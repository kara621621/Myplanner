const $ = (s) => document.querySelector(s);
const categories = {Class:{label:'수업',color:'#668aad',tint:'#edf3fa',icon:'book'},Assignment:{label:'과제',color:'#cc9872',tint:'#fbf0e6',icon:'file'},Research:{label:'연구',color:'#9c8bb1',tint:'#f2edf7',icon:'book'},'Team Project':{label:'팀 프로젝트',color:'#6b9f91',tint:'#eaf4ee',icon:'users'},Personal:{label:'개인',color:'#c38d9b',tint:'#f8edf0',icon:'coffee'}};
const paths={grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2',check:'M5 12l4 4L19 6',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',plus:'M12 5v14 M5 12h14',search:'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15 M16 16l5 5',left:'M14 6l-6 6 6 6',right:'M10 6l6 6-6 6',link:'M10 13a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-2 2 M14 11a4 4 0 0 0-6 0l-4 4a4 4 0 0 0 6 6l2-2',book:'M12 5C8 2 4 3 3 4v15c4-2 6-1 9 1 3-2 5-3 9-1V4c-3-2-6-1-9 1z M12 5v15',file:'M5 3h9l5 5v13H5z M14 3v6h5 M9 13h6 M9 17h6',users:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 7 M22 21v-3a4 4 0 0 0-3-4',coffee:'M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M16 9h2a3 3 0 0 1 0 6h-2 M7 3v2 M12 3v2',leaf:'M20 3C7 2 2 9 6 16s17 5 14-13z M5 21L16 9',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',arrow:'M4 16l6-6 4 4 6-9 M15 5h5v5'};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.calendar}"/></svg>`;}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = dateKey(new Date());
let events=[];
let viewDate=new Date(today+'T12:00:00'),view='dashboard',filter='all',calendarMode='month',editingId=null,busy=false;
const defaultGoogleConfig={clientId:'85680299111-qgih23g1lkdnl4j6j4ccaldkou6jbnok.apps.googleusercontent.com',sheetId:'1XtM8ijovR1laOJBH4maGxG3gIHireHPMOg9HzRL7Tm8'};
let config={...defaultGoogleConfig},token=null,connected=false,tokenExpiry=0;
const catFor=e=>categories[e.category]||categories.Personal;
const catStyle=c=>`--cat:${c.color};--tint:${c.tint}`;
const sorted=arr=>[...arr].sort((a,b)=>(a.date+(a.time||'99:99')).localeCompare(b.date+(b.time||'99:99')));
const daysTo=date=>Math.round((new Date(date+'T12:00:00')-new Date(today+'T12:00:00'))/86400000);
function dueLabel(date){const n=daysTo(date);return n===0?'오늘':n<0?`${-n}일 지남`:n<=7?`D-${n}`:`${Number(date.slice(5,7))}.${Number(date.slice(8))}`;}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function askConfirmation(message){return new Promise(resolve=>{const dialog=$('#confirm-dialog');$('#confirm-message').textContent=message;let accepted=false;$('#confirm-accept').onclick=()=>{accepted=true;dialog.close();};$('#confirm-cancel').onclick=()=>dialog.close();dialog.onclose=()=>resolve(accepted);dialog.showModal();});}
function render(){
 $('#demo-notice').classList.toggle('hidden',connected);
 $('#storage-status').innerHTML=`<i></i> ${connected?'Google Sheets 연결됨':'Google 연결 필요'}`;
 const pending=events.filter(e=>!e.completed), todays=events.filter(e=>e.date===today), upcoming=pending.filter(e=>daysTo(e.date)>=0&&daysTo(e.date)<=7&&e.category!=='Class'&&e.category!=='Personal'),done=events.filter(e=>e.completed).length;
 const statItems=[['오늘의 일정',todays.length,'개','나의 하루를 차근차근','calendar','#edf3ea','#7d9b72'],['7일 내 할 일',upcoming.length,'개','놓치지 말아야 할 계획','clock','#fcf1e8','#d1a17e'],['미완료 할 일',pending.length,'개','한 가지씩, 나의 속도로','file','#f1eef6','#a294b1'],['완료한 일정',done,'개',`전체 일정의 <b>${events.length?Math.round(done/events.length*100):0}%</b> 완료했어요`,'check','#edf3ed','#82a080']];
 $('#stats').innerHTML=statItems.map(([label,num,unit,detail,ic,bg,col])=>`<article class="stat"><span class="stat-icon" style="--stat-bg:${bg};--stat-color:${col}">${icon(ic)}</span><div class="stat-label">${label}</div><div class="stat-number">${num}<small>${unit}</small></div><div class="stat-detail">${detail}</div></article>`).join('');
 $('#nav-count').textContent=pending.length;
 $('#category-nav').innerHTML=Object.entries(categories).map(([key,c])=>`<button class="nav-item category-item ${filter===key?'active':''}" data-category="${key}"><span class="dot" style="--cat:${c.color}"></span>${c.label}</button>`).join('');
 $('#legend').innerHTML=Object.values(categories).map(c=>`<span class="legend-item"><i class="dot" style="--cat:${c.color}"></i>${c.label}</span>`).join('');
 $('#filter-tabs').innerHTML=[['all',{label:'전체'}],...Object.entries(categories)].map(([key,c])=>`<button class="filter-tab ${filter===key?'active':''}" data-category="${key}">${c.label}<small>${events.filter(e=>!e.completed&&(key==='all'||e.category===key)).length}</small></button>`).join('');
 $('#today-date').textContent=new Date(today+'T12:00:00').toLocaleDateString('ko-KR',{month:'long',day:'numeric'});
 $('#today-count').textContent=todays.length;
 $('#today-events').innerHTML=sorted(todays).map(e=>{const c=catFor(e);return `<article class="today-event" style="${catStyle(c)}"><span class="time-column">${esc(e.time||'종일')}</span><div class="today-event-details"><div class="mini-category">${c.label}${e.completed?' · 완료':''}</div><button class="event-title" data-edit="${esc(e.id)}">${esc(e.title)}</button>${e.memo?`<p>${esc(e.memo)}</p>`:''}</div></article>`;}).join('')||empty('오늘은 여유로운 하루네요.','새로운 계획을 추가해 보세요.');
 renderCalendar();renderTasks();
}
function empty(title,sub=''){return `<div class="empty"><span class="empty-symbol">✧</span>${title}${sub?`<br>${sub}`:''}</div>`;}
function row(e){const c=catFor(e);return `<article class="task-row ${e.completed?'is-complete':''}" style="${catStyle(c)}"><button class="check-button ${e.completed?'done':''}" data-toggle="${esc(e.id)}" aria-label="${esc(e.title)} ${e.completed?'미완료로 변경':'완료하기'}" aria-pressed="${e.completed}">${e.completed?icon('check'):''}</button><div class="task-main"><button class="event-title" data-edit="${esc(e.id)}">${esc(e.title)}</button><div class="task-meta">${esc(e.date.replaceAll('-','.'))}${e.time?` · ${esc(e.time)}`:''}${e.memo?`　${esc(e.memo)}`:''}</div></div><span class="badge">${c.label}</span><span class="due ${daysTo(e.date)<=2&&!e.completed?'urgent':''}">${e.completed?'완료':dueLabel(e.date)}</span><button class="icon-button task-edit" data-edit="${esc(e.id)}" aria-label="일정 수정">⋯</button></article>`;}
function renderCalendar(){
 const y=viewDate.getFullYear(),m=viewDate.getMonth();$('#month-label').textContent=`${y}년 ${m+1}월`;
 const monthEvents=events.filter(e=>e.date.startsWith(`${y}-${String(m+1).padStart(2,'0')}`));
 $('#month-view').classList.toggle('selected',calendarMode==='month');$('#list-view').classList.toggle('selected',calendarMode==='list');
 if(calendarMode==='list'){$('#calendar').innerHTML=`<div class="month-list">${sorted(monthEvents).map(row).join('')||empty('이달에 등록된 일정이 없어요.')}</div>`;return;}
 const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),numCells=Math.ceil((first.getDay()+new Date(y,m+1,0).getDate())/7)*7;
 let html='<div class="week-header">'+['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=>`<span>${d}</span>`).join('')+'</div><div class="calendar-grid">';
 for(let i=0;i<numCells;i++){const d=new Date(start);d.setDate(start.getDate()+i);const date=dateKey(d),items=sorted(events.filter(e=>e.date===date));html+=`<div class="day ${d.getMonth()!==m?'outside':''} ${date===today?'is-today':''}" data-date="${date}" tabindex="0" role="button" aria-label="${date} 일정 추가"><span class="day-number">${d.getDate()}</span>${items.slice(0,3).map(e=>`<button class="event-chip ${e.completed?'completed':''}" style="${catStyle(catFor(e))}" data-edit="${esc(e.id)}" title="${esc(e.title)}">${esc(e.title)}</button>`).join('')}${items.length>3?`<span class="more-events">+${items.length-3}개 더</span>`:''}</div>`;}
 $('#calendar').innerHTML=html+'</div>';
}
function renderTasks(){const q=$('#search').value.toLowerCase().trim(),status=$('#status-filter').value;const items=sorted(events.filter(e=>(filter==='all'||filter===e.category)&&(status==='all'||(status==='done'?e.completed:!e.completed))&&`${e.title} ${e.memo}`.toLowerCase().includes(q)));$('#task-list').innerHTML=items.map(row).join('')||empty('조건에 맞는 일정이 없어요.','새 계획을 등록하거나 필터를 변경해 보세요.');}
function setView(next){view=next;document.body.dataset.view=view;const labels={dashboard:['대시보드','조금 더 여유로운, 오늘','수업부터 연구, 나를 위한 시간까지. 오늘의 흐름을 함께 정리해요.'],calendar:['캘린더','한눈에 그려보는, 나의 한 달','빼곡한 하루에도 나를 위한 여백을 남겨두세요.'],tasks:['할 일 모아보기','하나씩 채워가는, 나의 계획','작은 체크 하나가 쌓여 커다란 진전이 됩니다.']};$('#page-label').textContent=labels[view][0];$('#heading').innerHTML=`${labels[view][1]} <span>✧</span>`;$('#subheading').textContent=labels[view][2];document.querySelectorAll('[data-view]').forEach(el=>{if(el.tagName==='BUTTON')el.classList.toggle('active',el.dataset.view===view);});}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b){filter='all';setView(b.dataset.view);render();}});
document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),toggle=e.target.closest('[data-toggle]'),category=e.target.closest('[data-category]'),day=e.target.closest('[data-date]');if(edit){openEvent(null,edit.dataset.edit);return;}if(toggle){toggleEvent(toggle.dataset.toggle);return;}if(category){filter=category.dataset.category;if(category.closest('#category-nav'))setView('tasks');render();return;}if(day)openEvent(day.dataset.date);});
$('#calendar').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-date]')){e.preventDefault();openEvent(e.target.dataset.date);}});
$('#prev-month').onclick=()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);renderCalendar();};
$('#next-month').onclick=()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);renderCalendar();};
$('#today-button').onclick=()=>{viewDate=new Date(today+'T12:00:00');renderCalendar();};
$('#month-view').onclick=()=>{calendarMode='month';renderCalendar();};$('#list-view').onclick=()=>{calendarMode='list';renderCalendar();};
$('#search').oninput=renderTasks;$('#status-filter').onchange=renderTasks;
$('#event-category').innerHTML=Object.entries(categories).map(([key,c])=>`<option value="${key}">${c.label}</option>`).join('');
function openEvent(date,id){if(!connected){openSettings();return;}if(busy){toast('저장이 끝날 때까지 잠시 기다려 주세요.');return;}editingId=id||null;const f=$('#event-form');f.reset();const ev=id?events.find(e=>e.id===id):null;if(id&&!ev)return;f.elements.title.value=ev?.title||'';f.elements.category.value=ev?.category||'Class';f.elements.date.value=ev?.date||date||today;f.elements.time.value=ev?.time||'';f.elements.memo.value=ev?.memo||'';f.elements.completed.checked=ev?.completed||false;$('#form-title').textContent=id?'일정 수정하기':'새 일정 만들기';$('#delete-event').classList.toggle('hidden',!id);$('#event-dialog').showModal();}
$('#add-event').onclick=()=>openEvent(today);$('#today-add').onclick=()=>openEvent(today);
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>$('#event-dialog').close());
function setBusy(value){busy=value;$('#save-event').disabled=value;$('#delete-event').disabled=value;$('#save-event').textContent=value?'저장 중…':'일정 저장';}
async function commit(next,operation){if(!connected){openSettings();return false;}if(busy)return false;setBusy(true);try{await operation();events=next;render();return true;}catch(err){toast(err.message||'저장하지 못했어요. 다시 시도해 주세요.');return false;}finally{setBusy(false);}}
$('#event-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const ev={id:editingId||crypto.randomUUID(),title:f.elements.title.value.trim(),category:f.elements.category.value,date:f.elements.date.value,time:f.elements.time.value,memo:f.elements.memo.value.trim(),completed:f.elements.completed.checked};if(!ev.title){f.elements.title.setCustomValidity('일정 제목을 입력해 주세요.');f.elements.title.reportValidity();return;}const editing=!!editingId;const next=editing?events.map(x=>x.id===ev.id?ev:x):[...events,ev];if(await commit(next,()=>writeEvent(ev,editing))){$('#event-dialog').close();toast(editing?'일정을 수정했어요.':'새 일정을 저장했어요.');}};
$('#event-form').elements.title.oninput=e=>e.target.setCustomValidity('');
async function toggleEvent(id){const ev=events.find(e=>e.id===id);if(!ev)return;const changed={...ev,completed:!ev.completed};if(await commit(events.map(x=>x.id===id?changed:x),()=>writeEvent(changed,true)))toast(changed.completed?'한 가지를 해냈네요. 수고했어요!':'미완료로 변경했어요.');}
$('#delete-event').onclick=async()=>{if(!editingId||!await askConfirmation('이 일정을 삭제할까요?'))return;const id=editingId;if(await commit(events.filter(e=>e.id!==id),()=>removeEvent(id))){$('#event-dialog').close();toast('일정을 삭제했어요.');}};
$('#clear-demo').onclick=()=>openSettings();
function openSettings(){$('#settings-form').elements.clientId.value=config.clientId||'';$('#settings-form').elements.sheetId.value=config.sheetId||'';$('#origin-text').textContent=location.origin;$('#connection-error').textContent='';$('#disconnect').classList.toggle('hidden',!connected);if(!$('#settings-dialog').open)$('#settings-dialog').showModal();}
$('#settings-button').onclick=openSettings;$('#connection-shortcut').onclick=openSettings;$('#close-settings').onclick=()=>$('#settings-dialog').close();
let gisPromise;
function loadGIS(){if(window.google?.accounts?.oauth2)return Promise.resolve();if(!gisPromise)gisPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.onload=()=>resolve();script.onerror=()=>{gisPromise=null;script.remove();reject(new Error('Google 연결 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));};document.head.append(script);});return gisPromise;}
function authorize(clientId){return new Promise((resolve,reject)=>{const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'https://www.googleapis.com/auth/spreadsheets',callback:r=>{if(r.error)return reject(new Error('Google 접근 권한이 허용되지 않았어요.'));if(!google.accounts.oauth2.hasGrantedAllScopes(r,'https://www.googleapis.com/auth/spreadsheets'))return reject(new Error('구글시트 읽기·쓰기 권한을 허용해 주세요.'));resolve(r);},error_callback:()=>reject(new Error('연결 창이 닫혔거나 차단되었어요. 다시 눌러 주세요.'))});client.requestAccessToken({prompt:''});});}
async function sheetsRequest(path,options={}){if(!token||Date.now()>=tokenExpiry)throw new Error('Google 연결이 만료됐어요. 연결 설정에서 다시 연결해 주세요.');const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.sheetId)}${path}`,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers}});if(!r.ok){let msg='';try{msg=(await r.json()).error?.message||'';}catch{}if(r.status===401){tokenExpiry=0;forgetSession();throw new Error('Google 연결이 만료됐어요. 다시 연결해 주세요.');}throw new Error(`구글시트 요청 실패 (${r.status}). ${msg}`);}return r.status===204?{}:r.json();}
async function readSheet(){const result=await sheetsRequest('/values/Events!A1:G');const rows=result.values||[];const expected=['id','title','category','date','time','memo','completed'];if(!expected.every((v,i)=>String(rows[0]?.[i]||'').trim()===v))throw new Error('Events 탭의 첫 행을 id, title, category, date, time, memo, completed 순서로 확인해 주세요.');return rows;}
function parseRows(rows){const seen=new Set();return rows.slice(1).map((r,i)=>{if(!r.some(v=>v!==''))return null;if(!r[0]||!r[1]||!/^\d{4}-\d{2}-\d{2}$/.test(String(r[3])))throw new Error(`${i+2}행의 id, title, date(YYYY-MM-DD)를 확인해 주세요.`);if(!categories[r[2]])throw new Error(`${i+2}행 category는 Class, Assignment, Research, Team Project, Personal 중 하나여야 합니다.`);if(seen.has(String(r[0])))throw new Error(`${i+2}행의 id가 중복돼 있어요. 고유한 id로 수정해 주세요.`);seen.add(String(r[0]));return {id:String(r[0]),title:String(r[1]),category:String(r[2]),date:String(r[3]),time:String(r[4]||''),memo:String(r[5]||''),completed:String(r[6]).toLowerCase()==='true'};}).filter(Boolean);}
const valuesFor=e=>[e.id,e.title,e.category,e.date,e.time,e.memo,e.completed];
async function rowFor(id){const rows=await readSheet();const index=rows.findIndex((r,i)=>i>0&&String(r[0])===id);if(index<1)throw new Error('시트에서 일정을 찾지 못했어요. 다시 연결해 최신 일정을 불러와 주세요.');return index+1;}
async function writeEvent(e,editing){if(editing){const row=await rowFor(e.id);await sheetsRequest(`/values/Events!A${row}:G${row}?valueInputOption=RAW`,{method:'PUT',body:JSON.stringify({values:[valuesFor(e)]})});}else{await sheetsRequest('/values/Events!A:G:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',{method:'POST',body:JSON.stringify({values:[valuesFor(e)]})});}}
async function removeEvent(id){const row=await rowFor(id);await sheetsRequest(`/values/Events!A${row}:G${row}:clear`,{method:'POST',body:'{}'});}
const sessionKey='campus-google-session-v1';
function rememberSession(){try{sessionStorage.setItem(sessionKey,JSON.stringify({config,token,tokenExpiry}));}catch{}}
function forgetSession(){try{sessionStorage.removeItem(sessionKey);}catch{}}
async function connectSheet(nextConfig){
 const previous={config,token,tokenExpiry,connected};
 $('#connect-button').disabled=true;$('#connect-button').textContent='연결 중…';$('#connection-error').textContent='';
 try{
  // GIS is preloaded so the account popup starts within the button click.
  if(!window.google?.accounts?.oauth2)throw new Error('Google 연결 도구를 준비 중이에요. 잠시 후 다시 눌러 주세요.');
  const auth=await authorize(nextConfig.clientId);
  config=nextConfig;token=auth.access_token;tokenExpiry=Date.now()+Number(auth.expires_in)*1000;
  const loaded=parseRows(await readSheet());events=loaded;connected=true;rememberSession();
  render();$('#settings-dialog').close();toast('내 구글시트의 일정을 불러왔어요.');
 }catch(err){
  ({config,token,tokenExpiry,connected}=previous);$('#connection-error').textContent=err.message;
 }finally{$('#connect-button').disabled=false;$('#connect-button').textContent='Google 연결하고 내 일정 보기';}
}
$('#settings-form').onsubmit=e=>{
 e.preventDefault();const f=e.currentTarget;let sheetId=f.elements.sheetId.value.trim();
 const match=sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);if(match)sheetId=match[1];
 const clientId=f.elements.clientId.value.trim();
 if(!clientId.endsWith('.apps.googleusercontent.com')||!/^[a-zA-Z0-9_-]+$/.test(sheetId)){$('#connection-error').textContent='클라이언트 ID와 스프레드시트 ID를 확인해 주세요.';return;}
 connectSheet({clientId,sheetId});
};
$('#disconnect').onclick=async()=>{
 if(!await askConfirmation('구글시트 연결을 해제할까요? 시트의 일정은 그대로 보관됩니다.'))return;
 if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});
 token=null;tokenExpiry=0;connected=false;events=[];forgetSession();render();$('#settings-dialog').close();toast('연결을 해제했어요.');
};
async function startPlanner(){
 render();
 const gisReady=loadGIS();gisReady.catch(()=>{});
 let saved=null;try{saved=JSON.parse(sessionStorage.getItem(sessionKey));}catch{}
 if(saved?.config?.clientId===config.clientId&&saved?.config?.sheetId===config.sheetId&&typeof saved.token==='string'&&saved.token&&saved.tokenExpiry>Date.now()+30000){
  token=saved.token;tokenExpiry=saved.tokenExpiry;
  $('#storage-status').textContent='내 구글시트 불러오는 중…';
  try{events=parseRows(await readSheet());connected=true;render();return;}
  catch(err){token=null;tokenExpiry=0;forgetSession();render();openSettings();$('#connection-error').textContent=err.message;}
 }else{forgetSession();openSettings();}
 $('#connect-button').disabled=true;$('#connect-button').textContent='Google 연결 준비 중…';
 try{await gisReady;}
 catch(err){$('#connection-error').textContent=err.message;}
 finally{$('#connect-button').disabled=false;$('#connect-button').textContent='Google 연결하고 내 일정 보기';}
}
startPlanner();
