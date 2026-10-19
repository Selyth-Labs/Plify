const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, view='dashboard', filter='all', toastTimer, submitting=false, connected=false, refreshing=false;
const local = ['127.0.0.1','localhost'].includes(location.hostname);
let serverURL = localStorage.getItem('plify-server-url') || (local ? location.origin : 'https://plify-api.selyth.xyz');
let accessKey = sessionStorage.getItem('plify-access-key') || '';
function authHeaders(extra={}){return {...extra,...(accessKey?{Authorization:'Bearer '+accessKey}:{})}}
function openConnection(){ $('#server-url').value=serverURL; $('#access-key').value=accessKey; $('#connect-error').textContent=''; if(!$('#connect-dialog').open)$('#connect-dialog').showModal(); }

const titles={dashboard:['링크 하나로, 나의 음악.','YouTube 영상이나 플레이리스트 링크를 넣고 MP3로 저장하세요.','다운로드'],logs:['다운로드의 모든 기록.','링크 조회와 다운로드 작업 결과를 확인하세요.','실행 기록']};
function navigate(next){if(!titles[next])next='dashboard';view=next;document.querySelectorAll('.view').forEach(e=>e.hidden=e.id!==view);document.querySelectorAll('aside [data-view]').forEach(e=>e.classList.toggle('selected',e.dataset.view===view));$('#page-title').textContent=titles[view][0];$('#page-description').textContent=titles[view][1];$('#breadcrumb').textContent=titles[view][2];history.replaceState(null,'','#'+view)}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000)}
function controls(){ $('#download-form button').disabled=!connected||submitting||state?.busy; $('#resume').disabled=!connected; $('#pause').disabled=!connected; }
async function api(action,body={}){if(!connected||!state)throw Error('서버 연결을 확인해주세요.');const r=await fetch(serverURL+'/api/'+action,{method:'POST',headers:authHeaders({'Content-Type':'application/json','X-Plify-CSRF':state.csrf}),body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'작업 실패');await refresh();return data}
async function act(action,body,message='요청을 처리했습니다.'){try{await api(action,body);toast(message)}catch(e){toast(e.message)}}
function empty(title,text){return `<div class="empty"><strong>${title}</strong>${text}</div>`}
const labels={queued:'다운로드 대기',running:'다운로드 중',success:'완료',failed:'실패',blocked:'확인 필요',cancelled:'취소됨'};
function tracks(items){return items.length?`<div class="table">${items.map(t=>`<div class="track"><span class="track-icon">${t.status==='success'?'♪':'↓'}</span><div class="track-info"><strong>${esc(t.data.track||t.data.title||t.video_id)}</strong><small>${esc(t.error||t.data.artist||t.data.uploader||t.video_id)}</small></div><span class="status ${esc(t.status)}">${labels[t.status]||esc(t.status)}</span>${t.status==='queued'||t.status==='running'?`<button data-action="cancel" data-id="${t.id}">취소</button>`:['failed','blocked','cancelled'].includes(t.status)?`<button data-action="retry" data-id="${t.id}">재시도</button>`:t.status==='success'?`<button data-file="${t.id}">파일 받기</button>`:''}</div>`).join('')}</div>`:empty(state.total?'선택한 상태의 음악이 없습니다.':'아직 다운로드한 음악이 없어요.',state.total?'다른 필터를 선택해주세요.':'YouTube 영상이나 플레이리스트 링크를 입력해주세요.')}
function render(){const s=state;$('#stats').innerHTML=[['다운로드 완료',s.counts.success||0,'곡','♪'],['다운로드 중',s.counts.running||0,'곡','↓'],['다운로드 대기',s.counts.queued||0,'곡','◷'],['확인 필요',(s.counts.failed||0)+(s.counts.blocked||0),'곡','!']].map(([name,count,unit,icon])=>`<div class="stat"><div class="stat-label">${name}<span>${icon}</span></div><strong>${count}<small>${unit}</small></strong></div>`).join('');$('#download-list').innerHTML=tracks(s.downloads.filter(t=>filter==='all'||(filter==='failed'?['failed','blocked'].includes(t.status):t.status===filter)));$('#queue-info').textContent=`전체 ${s.total}곡 · 최근 100곡 표시 · ${s.paused?'현재 곡 완료 후 대기 / 정지 상태':'대기열 처리 중'}`;$('#request-state').textContent=s.busy?'링크를 조회하고 대기열에 추가하는 중입니다. 플레이리스트 크기에 따라 시간이 걸릴 수 있습니다.':'';$('#log-list').innerHTML=s.logs.length?s.logs.slice().reverse().map(l=>`<div class="log"><time>${esc(l.time)}</time><span>${esc(l.message)}</span></div>`).join(''):empty('아직 실행 기록이 없습니다.','다운로드를 시작하면 이곳에 기록됩니다.');$('#dependencies').textContent=s.dependencies;$('#download-path').textContent=s.download_root;$('#activity').textContent=s.busy?'링크 조회 중':s.counts.running?'MP3 다운로드 중':'다운로드 준비 완료';$('.connection').innerHTML='<i></i> 맥미니 연결됨 · 설정';controls()}
async function refresh(){
  if(refreshing)return false;
  refreshing=true;
  try{
    const r=await fetch(serverURL+'/api/state',{cache:'no-store',headers:authHeaders(),signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error(r.status===401?'접속 키를 확인해주세요.':r.status===403?'서버 앱에 이 웹 주소를 허용해주세요.':'서버 오류: '+r.status);
    state=await r.json(); connected=true; render(); return true;
  }catch(e){ connected=false; $('.connection').textContent='○ 서버 연결 설정'; $('#connect-error').textContent=e.message==='Failed to fetch'?'서버 앱·터널 실행 상태와 허용 웹 주소를 확인해주세요.':e.message; controls(); return false;
  }finally{refreshing=false}
}
async function downloadFile(id,button){
  button.disabled=true;
  try{
    const r=await fetch(serverURL+'/api/files/'+id,{headers:authHeaders()});
    if(!r.ok){const error=await r.json();throw Error(error.error)}
    const blob=await r.blob(), url=URL.createObjectURL(blob);
    const track=state.downloads.find(t=>String(t.id)===id);
    const a=document.createElement('a');a.href=url;a.download=(track?.path?.split('/').pop()||'plify.mp3');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){toast(e.message)}finally{button.disabled=false}
}
$('#connect-button').onclick=openConnection;
$('#connect-close').onclick=()=>$('#connect-dialog').close();
$('#connect-form').onsubmit=async e=>{
  e.preventDefault();if(refreshing)return;
  const button=e.target.querySelector('button.primary');button.disabled=true;
  try{
    const url=new URL($('#server-url').value.trim());
    if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('도메인까지만 입력해주세요.');
    if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('HTTPS 서버 주소를 입력해주세요.');
    serverURL=url.origin;accessKey=$('#access-key').value.trim();connected=false;state=undefined;controls();
    if(await refresh()){localStorage.setItem('plify-server-url',serverURL);sessionStorage.setItem('plify-access-key',accessKey);$('#connect-dialog').close();toast('맥미니 서버에 연결했습니다.')}
  }catch(e){$('#connect-error').textContent=e.message}finally{button.disabled=false}
};
document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]');if(nav)navigate(nav.dataset.view);const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===f);x.setAttribute('aria-pressed',String(x===f))});if(state)render()}const a=e.target.closest('[data-action]');if(a)act(a.dataset.action,{id:a.dataset.id});const file=e.target.closest('[data-file]');if(file)downloadFile(file.dataset.file,file)});
$('#download-form').addEventListener('submit',async e=>{e.preventDefault();if(submitting)return;submitting=true;controls();try{await api('download',{url:$('#download-url').value.trim()});toast('링크 조회를 시작했습니다. 실행 기록에서 결과를 확인하세요.');e.target.reset()}catch(err){toast(err.message)}finally{submitting=false;controls()}});
$('#resume').onclick=()=>act('start',{},'다운로드를 시작했습니다.');$('#pause').onclick=()=>act('pause',{},'현재 곡이 끝나면 대기합니다.');
navigate(location.hash.slice(1)||'dashboard');if(accessKey){refresh()}else{openConnection()}setInterval(()=>{if(accessKey&&!$('#connect-dialog').open)refresh()},2500);
