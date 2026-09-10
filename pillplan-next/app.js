const DB_NAME='pillplan-next-db';
const DB_VERSION=1;
let db;
let view='today';

function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('meds'))d.createObjectStore('meds',{keyPath:'id'});if(!d.objectStoreNames.contains('events')){const s=d.createObjectStore('events',{keyPath:'eventId'});s.createIndex('slot','slot',{unique:false});s.createIndex('createdAt','createdAt',{unique:false});}if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'key'});};r.onsuccess=()=>{db=r.result;resolve(db)};r.onerror=()=>reject(r.error);});}
function tx(store,mode='readonly'){return db.transaction(store,mode).objectStore(store)}
function all(store){return new Promise((res,rej)=>{const r=tx(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
function put(store,obj){return new Promise((res,rej)=>{const r=tx(store,'readwrite').put(obj);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function clear(store){return new Promise((res,rej)=>{const r=tx(store,'readwrite').clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function del(store,key){return new Promise((res,rej)=>{const r=tx(store,'readwrite').delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function today(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function slotKey(mid,date,time){return `${date}_${mid}_${time}`}
function uid(){return (crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random())}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function latestEvents(){const ev=await all('events');ev.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));const map={};for(const e of ev)map[e.slot]=e;return map}
function tierForLegacy(v){if(v===true)return 'unrated';if(v===false||v==null)return null;if(typeof v==='object'){if(v.taken===false)return null;return v.tier||'unrated'}return null}
async function importBackup(file){const text=await file.text();let obj=JSON.parse(text);let state=obj;
  if(obj.localStorage&&obj.localStorage.pillplan_v4){state=typeof obj.localStorage.pillplan_v4==='string'?JSON.parse(obj.localStorage.pillplan_v4):obj.localStorage.pillplan_v4;}
  if(!state||!Array.isArray(state.meds)||typeof state.taken!=='object')throw new Error('Ungültige PillPlan-Sicherung');
  await clear('meds');await clear('events');
  for(const m of state.meds){await put('meds',{id:m.id,name:m.name,times:m.times||[],color:m.color||'#2a7c74',startDate:m.startDate||null,scheduleHistory:m.scheduleHistory||[]});}
  for(const [slot,val] of Object.entries(state.taken||{})){
    const tier=tierForLegacy(val);if(!tier)continue;
    await put('events',{eventId:uid(),slot,type:'taken',tier,createdAt:(val&&val.takenAt)||new Date().toISOString(),legacy:true});
  }
  await put('meta',{key:'importedAt',value:new Date().toISOString()});
  render();
}
async function exportBackup(){const meds=await all('meds'),events=await all('events'),meta=await all('meta');const blob=new Blob([JSON.stringify({schema:'pillplan-next-v1',exportedAt:new Date().toISOString(),meds,events,meta},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`PillPlan_Next_Backup_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function toggle(mid,date,time){const slot=slotKey(mid,date,time);const map=await latestEvents();const current=map[slot];await put('events',{eventId:uid(),slot,type:(current&&current.type==='taken')?'undo':'taken',tier:'unrated',createdAt:new Date().toISOString()});render()}
async function addMed(name,time){if(!name||!time)return;await put('meds',{id:Date.now(),name:name.trim(),times:[time],color:'#2a7c74',startDate:today(),scheduleHistory:[{from:today(),times:[time]}]});view='today';render()}
function pastDays(n){const out=[];for(let i=n-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');out.push(`${y}-${m}-${day}`)}return out}
async function stats(){const meds=await all('meds'),map=await latestEvents(),td=today();let tot=0,done=0;for(const m of meds)for(const t of m.times){tot++;const e=map[slotKey(m.id,td,t)];if(e&&e.type==='taken')done++;}return{tot,done,pct:tot?Math.round(done/tot*100):0}}
async function render(){const app=document.getElementById('app');const meds=await all('meds'),map=await latestEvents(),s=await stats();
  let html=`<h1>PillPlan</h1><div class="sub">Next · verlaufsstarker Kern</div><div class="status"><div>Heute</div><strong>${s.done}/${s.tot} · ${s.pct}%</strong></div><div class="tabs"><button data-v="today" class="${view==='today'?'active':''}">Heute</button><button data-v="plan" class="${view==='plan'?'active':''}">Plan</button><button data-v="data" class="${view==='data'?'active':''}">Daten</button></div>`;
  if(view==='today'){
    if(!meds.length)html+=`<div class="empty">Noch keine Medikamente. Importiere zuerst deine Sicherung oder füge ein Medikament hinzu.</div>`;
    for(const m of meds)for(const t of m.times){const slot=slotKey(m.id,today(),t),e=map[slot],on=e&&e.type==='taken';html+=`<div class="card dose"><div class="grow"><div class="name">${esc(m.name)}</div><div class="time">${esc(t)}</div></div><button class="check ${on?'on':''}" data-toggle="${m.id}" data-time="${esc(t)}">${on?'✓':'○'}</button></div>`}
    html+=`<div class="card"><h2>Medikament hinzufügen</h2><div class="actions"><input id="med-name" class="file" placeholder="Name"><input id="med-time" class="file" type="time" value="08:00"><button id="add-med" class="btn primary">Hinzufügen</button></div></div>`;
  }
  if(view==='plan'){
    const days=pastDays(7);if(!meds.length)html+=`<div class="empty">Noch keine Daten.</div>`;
    for(const m of meds){html+=`<div class="card"><div class="name">${esc(m.name)}</div><div class="grid">`;for(const d of days){let cls='',mark='·';for(const t of m.times){const e=map[slotKey(m.id,d,t)];if(e&&e.type==='taken'){cls=e.tier==='red'?'red':e.tier==='yellow'?'yellow':'green';mark='✓';break}}const dt=new Date(d+'T00:00:00');html+=`<div class="day ${cls}"><div>${dt.toLocaleDateString('de-DE',{weekday:'short'}).slice(0,2)}</div><strong>${dt.getDate()}</strong><div>${mark}</div></div>`}html+=`</div></div>`}
  }
  if(view==='data')html+=`<div class="card"><h2>Daten sichern / übernehmen</h2><div class="ok">PillPlan Next speichert den Verlauf als unveränderbares Ereignisprotokoll in IndexedDB. Kein Demo-Datensatz.</div><div class="actions" style="margin-top:12px"><input id="backup-file" class="file" type="file" accept="application/json,.json"><button id="import-btn" class="btn primary">Backup importieren</button><button id="export-btn" class="btn">Backup exportieren</button></div></div><div class="notice">Für wirklich geräteübergreifende, verlustsichere Historie folgt als nächster Baustein Server-Sync. Diese Version trennt zunächst sauber App, Speicher und Service Worker vom alten PillPlan.</div>`;
  app.innerHTML=html;
  document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;render()});
  document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.toggle),today(),b.dataset.time));
  const add=document.getElementById('add-med');if(add)add.onclick=()=>addMed(document.getElementById('med-name').value,document.getElementById('med-time').value);
  const imp=document.getElementById('import-btn');if(imp)imp.onclick=async()=>{try{const f=document.getElementById('backup-file').files[0];if(!f)throw new Error('Bitte Backup-Datei auswählen');await importBackup(f);alert('Import erfolgreich');}catch(e){alert(e.message)}};
  const exp=document.getElementById('export-btn');if(exp)exp.onclick=exportBackup;
}

(async()=>{await openDB();if('serviceWorker'in navigator)navigator.serviceWorker.register('/pillplan-next/sw.js',{scope:'/pillplan-next/'}).catch(()=>{});render();})();
