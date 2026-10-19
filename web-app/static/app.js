const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
let serverURL = local ? (localStorage.getItem('plify-server-url') || location.origin) : location.origin;
let accessKey = sessionStorage.getItem('plify-access-key') || '';
const clientID = sessionStorage.getItem('plify-client-id') || crypto.randomUUID();
sessionStorage.setItem('plify-client-id', clientID);
let sent;
try { sent = new Set(JSON.parse(sessionStorage.getItem('plify-auto-downloads') || '[]')); }
catch { sent = new Set(); }
let state, filter = 'all', connected = false, refreshing = false, submitting = false, toastTimer, capabilityChecked = false;
const transferring = new Set();
const downloadLinks = new Map();
const preparingLinks = new Map();
const titles = {
  dashboard: ['링크 하나로, 내 기기에.', 'YouTube 영상은 MP3로, 플레이리스트는 ZIP으로 이 기기에 저장하세요.', '다운로드'],
  logs: ['나의 요청 기록.', '이 브라우저에서 요청한 변환과 파일 전송 상태를 확인하세요.', '실행 기록']
};
function authHeaders(extra = {}) { return {...extra, ...(accessKey ? {Authorization: 'Bearer ' + accessKey} : {})}; }
function navigate(view) {
  if (!titles[view]) view = 'dashboard';
  document.querySelectorAll('.view').forEach(element => element.hidden = element.id !== view);
  document.querySelectorAll('aside [data-view]').forEach(element => element.classList.toggle('selected', element.dataset.view === view));
  $('#page-title').textContent = titles[view][0];
  $('#page-description').textContent = titles[view][1];
  $('#breadcrumb').textContent = titles[view][2];
  history.replaceState(null, '', '#' + view);
}
function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 7000);
}
function controls() { $('#download-form button').disabled = !connected || submitting || state?.busy; }
function openConnection() {
  $('#server-url').value = serverURL; $('#server-url').readOnly = !local;
  $('#access-key').value = accessKey; $('#connect-error').textContent = '';
  if (!$('#connect-dialog').open) $('#connect-dialog').showModal();
}
async function readResponse(response) {
  if (!response.ok) {
    if (response.status === 401) throw Error('접속 키를 확인해주세요.');
    if ([502, 503, 504].includes(response.status)) throw Error('맥미니 서버에 연결되지 않습니다. 서버 앱과 터널을 확인해주세요.');
    let message;
    try { message = (await response.json()).error; } catch {}
    throw Error(message || '서버 오류: ' + response.status);
  }
  return response.json();
}
async function api(action, body = {}, refreshAfter = true) {
  if (!connected || !state) throw Error('서버 연결을 확인해주세요.');
  const result = await readResponse(await fetch(serverURL + '/api/' + action, {
    method: 'POST', headers: authHeaders({'Content-Type':'application/json', 'X-Plify-CSRF':state.csrf}),
    body: JSON.stringify({...body, client_id:clientID})
  }));
  if (refreshAfter) await refresh(); return result;
}
const labels = {inspecting:'링크 조회 중', downloading:'변환 중', ready:'파일 준비됨', received:'파일 준비됨', failed:'확인 필요', expired:'임시 파일 만료'};
function matches(request) {
  if (filter === 'all') return true;
  if (filter === 'queued') return ['inspecting', 'downloading'].includes(request.status);
  if (filter === 'success') return ['ready', 'received'].includes(request.status);
  return request.status === 'failed';
}
function requestRows(requests) {
  if (!requests.length) return '<div class="empty"><strong>아직 표시할 요청이 없어요.</strong>YouTube 영상이나 플레이리스트 링크를 입력해주세요.</div>';
  return '<div class="table">' + requests.map(request => {
    const downloadable = ['ready', 'received'].includes(request.status);
    const detail = request.error || (request.total ? `${request.completed} / ${request.total}곡 · ${request.playlist ? 'ZIP으로 묶기' : 'MP3'}` : '영상 정보를 확인하고 있습니다.');
    let action = '';
    if (downloadable) {
      const link = downloadLinks.get(request.id);
      action = link && link.expires > Date.now()
        ? `<a class="file-download" data-native-file="${esc(request.id)}" href="${esc(link.href)}" download="${esc(link.filename)}" referrerpolicy="no-referrer">파일 받기 ↓</a>`
        : `<button data-file="${esc(request.id)}">파일 링크 준비</button>`;
    }
    else if (request.status === 'failed' && request.total) action = `<button data-action="web-retry" data-id="${esc(request.id)}">재시도</button>`;
    else if (request.status === 'downloading') action = `<button data-action="web-cancel" data-id="${esc(request.id)}">취소</button>`;
    return `<div class="track"><span class="track-icon">${request.playlist ? '▤' : '♪'}</span><div class="track-info"><strong>${esc(request.title)}</strong><small>${esc(detail)}</small></div><span class="status ${downloadable?'success':esc(request.status)}">${labels[request.status] || esc(request.status)}</span>${action}</div>`;
  }).join('') + '</div>';
}
function render() {
  const requests = state.requests;
  const count = statuses => requests.filter(request => statuses.includes(request.status)).length;
  $('#stats').innerHTML = [
    ['변환 중',count(['inspecting','downloading']),'건','◷'],
    ['파일 준비됨',count(['ready','received']),'건','↓'],
    ['임시 파일 만료',count(['expired']),'건','◷'],
    ['확인 필요',count(['failed']),'건','!']
  ].map(([label, count, unit, icon]) => `<div class="stat"><div class="stat-label">${label}<span>${icon}</span></div><strong>${count}<small>${unit}</small></strong></div>`).join('');
  renderRequestList();
  $('#queue-info').textContent = `이 브라우저의 요청 ${requests.length}건 · 완료되면 자동으로 다운로드를 시작합니다.`;
  $('#request-state').textContent = state.busy ? '링크를 조회하고 있습니다. 플레이리스트 크기에 따라 시간이 걸릴 수 있습니다.' : '';
  $('#dependencies').textContent = state.dependencies;
  $('#activity').textContent = count(['inspecting','downloading']) ? '이 기기로 보낼 파일을 준비하는 중' : '링크를 입력하면 시작합니다.';
  $('#log-list').innerHTML = requests.length ? requests.map(request => `<div class="log"><span>${esc(request.title)} · ${labels[request.status]}${request.error?' · '+esc(request.error):''}</span></div>`).join('') : '<div class="empty">이 브라우저에서 요청한 작업만 표시됩니다.</div>';
  $('.connection').innerHTML = '<i></i> 맥미니 연결됨 · 설정';
  $('#connection-error').hidden = true;
  controls();
  const next = requests.find(request => request.status === 'ready' && !sent.has(request.id));
  if (next && !transferring.size) downloadRequest(next.id, true);
  for (const request of requests.filter(request => ['ready','received'].includes(request.status))) {
    prepareLink(request.id).then(renderRequestList).catch(() => {});
  }
}
async function refresh() {
  if (refreshing) return false;
  refreshing = true;
  try {
    if (!capabilityChecked) {
      const capabilities = await readResponse(await fetch(serverURL + '/api/state', {headers:authHeaders(),cache:'no-store',signal:AbortSignal.timeout(10000)}));
      if (!capabilities.web_delivery_version) throw Error('맥미니 서버 앱 업데이트가 필요합니다. 새 Plify Server.app으로 교체해주세요. GUI와 접속 키는 유지됩니다.');
      capabilityChecked = true;
    }
    state = await readResponse(await fetch(serverURL + '/api/web-state?client_id=' + encodeURIComponent(clientID), {
      headers:authHeaders(), cache:'no-store', signal:AbortSignal.timeout(10000)
    }));
    connected = true; render(); return true;
  } catch (error) {
    connected = false;
    const message = ['Failed to fetch','Load failed'].includes(error.message) ? '서버 연결에 실패했습니다. 맥미니 앱과 터널 실행 상태를 확인해주세요.' : error.message;
    $('.connection').textContent = '○ 서버 연결 설정';
    $('#connect-error').textContent = message;
    $('#connection-error').textContent = message; $('#connection-error').hidden = false;
    controls(); return false;
  } finally { refreshing = false; }
}
function renderRequestList() {
  if (state) $('#download-list').innerHTML = requestRows(state.requests.filter(matches));
}
function prepareLink(id) {
  const cached = downloadLinks.get(id);
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached);
  if (preparingLinks.has(id)) return preparingLinks.get(id);
  const pending = (async () => {
    const result = await api('web-ticket', {request_id:id}, false);
    const request = state.requests.find(request => request.id === id);
    const link = {href:serverURL + result.path, filename:request?.filename || (request?.playlist?'plify.zip':'plify.mp3'), expires:Date.now()+9*60*1000};
    downloadLinks.set(id, link);
    return link;
  })();
  preparingLinks.set(id, pending);
  pending.finally(() => preparingLinks.delete(id)).catch(() => {});
  return pending;
}
function markAttempted(id) {
  sent.add(id); sessionStorage.setItem('plify-auto-downloads', JSON.stringify([...sent].slice(-500)));
}
async function downloadRequest(id, automatic = false) {
  if (transferring.has(id)) return;
  transferring.add(id);
  markAttempted(id);
  try {
    const link = await prepareLink(id);
    // A same-origin download link forces an actual browser download. A hidden iframe
    // can consume an MP3 response without saving it in Safari.
    const anchor = document.createElement('a');
    anchor.href = link.href; anchor.download = link.filename; anchor.referrerPolicy = 'no-referrer';
    document.body.append(anchor); anchor.click();
    setTimeout(() => anchor.remove(), 1000);
    downloadLinks.delete(id);
    renderRequestList();
    toast(automatic ? '다운로드를 요청했습니다. 목록에 없으면 파일 받기 링크를 눌러주세요.' : '브라우저 다운로드 목록을 확인해주세요.');
  } catch (error) { toast(error.message); }
  finally { transferring.delete(id); }
}
$('#connect-button').onclick = openConnection;
$('#connect-close').onclick = () => $('#connect-dialog').close();
$('#connect-form').onsubmit = async event => {
  event.preventDefault(); if (refreshing) return;
  const button = event.target.querySelector('button.primary'); button.disabled = true;
  try {
    const url = new URL($('#server-url').value.trim());
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw Error('도메인까지만 입력해주세요.');
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))) throw Error('HTTPS 서버 주소를 입력해주세요.');
    serverURL = url.origin; accessKey = $('#access-key').value.trim(); connected = false; capabilityChecked = false; state = undefined; controls();
    if (await refresh()) {
      localStorage.setItem('plify-server-url', serverURL); sessionStorage.setItem('plify-access-key', accessKey);
      $('#connect-dialog').close(); toast('연결했습니다. 파일은 이 기기로 전달됩니다.');
    }
  } catch (error) { $('#connect-error').textContent = error.message; }
  finally { button.disabled = false; }
};
document.addEventListener('click', async event => {
  const nav = event.target.closest('[data-view]'); if (nav) navigate(nav.dataset.view);
  const choice = event.target.closest('[data-filter]');
  if (choice) {
    filter = choice.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(element => { element.classList.toggle('active', element === choice); element.setAttribute('aria-pressed', String(element === choice)); });
    if (state) render();
  }
  const nativeFile = event.target.closest('[data-native-file]');
  if (nativeFile) {
    const id = nativeFile.dataset.nativeFile;
    markAttempted(id);
    // Preserve the native click's user activation; don't preventDefault or await fetch.
    setTimeout(() => { downloadLinks.delete(id); prepareLink(id).then(renderRequestList).catch(() => {}); }, 1000);
    return;
  }
  const file = event.target.closest('[data-file]'); if (file) downloadRequest(file.dataset.file);
  const action = event.target.closest('[data-action]');
  if (action) { try { await api(action.dataset.action, {request_id:action.dataset.id}); } catch(error) { toast(error.message); } }
});
$('#download-form').onsubmit = async event => {
  event.preventDefault(); if (submitting) return;
  submitting = true; controls();
  try {
    await api('web-download', {url:$('#download-url').value.trim()});
    event.target.reset(); toast('요청했습니다. 완료되면 이 기기로 다운로드합니다. 이 탭을 열어두세요.');
  } catch(error) { toast(error.message); }
  finally { submitting = false; controls(); }
};
navigate(location.hash.slice(1) || 'dashboard');
if (accessKey) refresh(); else openConnection();
setInterval(() => { if (accessKey && !$('#connect-dialog').open) refresh(); }, 2500);
