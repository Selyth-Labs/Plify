import {createHash, createPrivateKey, randomUUID, sign} from 'node:crypto';
import {isIP} from 'node:net';

const methods = {session:'GET',state:'GET',download:'POST',auth:'POST',logout:'POST',ticket:'POST',retry:'POST',cancel:'POST'};
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const fail=(status,message)=>res.status(status).json({error:message});
  const action=req.query?.action;
  if (typeof action!=='string' || !Object.hasOwn(methods,action)) return fail(404,'찾을 수 없습니다.');
  if (req.method!==methods[action]) return fail(405,'지원하지 않는 요청입니다.');
  const origin=req.headers.origin;
  if (origin && origin!==`https://${req.headers.host}` && origin!==`http://${req.headers.host}`) return fail(403,'허용되지 않은 요청입니다.');
  const ip=String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (!isIP(ip)) return fail(503,'요청 주소를 확인할 수 없습니다.');
  const pem=process.env.PLIFY_GATEWAY_PRIVATE_KEY;
  if (!pem) return fail(503,'서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.');
  let body='';
  if (req.method==='POST') {
    if (typeof req.body==='string') { try { JSON.parse(req.body); body=req.body; } catch {return fail(400,'잘못된 요청입니다.');} }
    else body=JSON.stringify(req.body || {});
    if (Buffer.byteLength(body)>16384) return fail(413,'요청이 너무 큽니다.');
  }
  const path='/api/public/'+action, timestamp=String(Math.floor(Date.now()/1000)), nonce=randomUUID();
  const cookie=String(req.headers.cookie || '');
  if (cookie.length>4096) return fail(400,'브라우저 저장 정보를 확인해주세요.');
  const hash=value=>createHash('sha256').update(value).digest('hex');
  const message=[timestamp,nonce,req.method,path,ip,hash(body),hash(cookie)].join('\n');
  const headers={'Origin':'https://plify-web.vercel.app','Cookie':cookie,'X-Plify-IP':ip,'X-Plify-Time':timestamp,
    'X-Plify-Nonce':nonce,'X-Plify-Proof':sign(null,Buffer.from(message),createPrivateKey(pem)).toString('base64')};
  if (req.headers['x-plify-csrf']) headers['X-Plify-CSRF']=String(req.headers['x-plify-csrf']).slice(0,256);
  if (body) headers['Content-Type']='application/json';
  try {
    const response=await fetch('https://plify-api.selyth.xyz'+path,{method:req.method,headers,body:body||undefined,redirect:'error',signal:AbortSignal.timeout(12000)});
    if(action==='session' && response.status===401)return fail(503,'맥미니 서버 앱 업데이트가 필요합니다.');
    for (const name of ['content-type','retry-after']) {
      const value=response.headers.get(name); if(value)res.setHeader(name,value);
    }
    const cookies=response.headers.getSetCookie?.() || [];
    if(cookies.length)res.setHeader('Set-Cookie',cookies);
    const text=await response.text();
    if(text.length>1024*1024)return fail(502,'서버 응답을 처리하지 못했습니다.');
    if(!response.headers.get('content-type')?.includes('application/json'))return fail(503,'다운로드 서버를 준비 중입니다. 잠시 후 다시 시도해주세요.');
    return res.status(response.status).send(text);
  } catch {
    return fail(503,'다운로드 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
  }
}
