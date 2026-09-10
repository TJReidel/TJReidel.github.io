/* PillPlan UX completion v1 — edit form, append-only corrections, voice entry */
'use strict';

let _ppEditId=null;

function ppTxt(de,en){return (typeof lang==='string'&&lang==='de')?de:en}
function ppModalClose(){document.getElementById('pp-modal')?.remove();}
function ppModal(html){ppModalClose();const wrap=document.createElement('div');wrap.id='pp-modal';wrap.className='pp-modal-backdrop';wrap.innerHTML=`<section class="pp-modal-card" role="dialog" aria-modal="true">${html}</section>`;document.body.appendChild(wrap);wrap.addEventListener('click',e=>{if(e.target===wrap)ppModalClose()});return wrap;}
function ppTimesRows(times){return normalizeTimes(times).map(t=>`<div class="pp-edit-time-row"><input class="form-input pp-edit-time" type="time" value="${esc(t)}"><button type="button" class="time-remove pp-edit-time-remove">−</button></div>`).join('')}
function ppBindEditTimes(){document.querySelectorAll('.pp-edit-time-remove').forEach(b=>b.onclick=()=>{const rows=document.querySelectorAll('.pp-edit-time-row');if(rows.length<=1)return;b.closest('.pp-edit-time-row')?.remove();});}

editMed=async function(id){
  const m=await getOne('meds',id);if(!m||m.endDate)return;
  _ppEditId=id;
  const nowTimes=timesForDate(m,today());
  const html=`<div class="pp-modal-head"><div><div class="form-title">${ppTxt('Medikament bearbeiten','Edit medication')}</div><div class="pp-modal-sub">${esc(m.name)}</div></div><button class="pp-close" id="pp-edit-close">×</button></div>
  <label class="form-label">${ppTxt('Medikament','Medication')}</label><input id="pp-edit-name" class="form-input" value="${esc(m.name)}">
  <label class="form-label">${ppTxt('Einnahmezeit','Intake time')}</label><div id="pp-edit-times">${ppTimesRows(nowTimes.length?nowTimes:['08:00'])}</div><button type="button" class="secondary-action" id="pp-edit-add-time">＋ ${ppTxt('Weitere Einnahmezeit','Add another intake time')}</button>
  <label class="form-label">${ppTxt('Dosis / Stärke','Dose / strength')}</label><input id="pp-edit-dose" class="form-input" value="${esc(m.dose||'')}">
  <label class="form-label">${ppTxt('Ärztliche Vorgabe','Doctor instructions')}</label><textarea id="pp-edit-doctor" class="form-input" rows="3">${esc(m.doctorInstructions||'')}</textarea>
  <label class="form-label">${ppTxt('MHD / Verfallsdatum','Expiry date')}</label><input id="pp-edit-expiry" class="form-input" type="date" value="${esc(m.expiryDate||'')}">
  <label class="form-label">${ppTxt('Neue Zeiten gelten','New times apply')}</label><select id="pp-edit-from" class="form-input"><option value="today">${ppTxt('ab heute','from today')}</option><option value="tomorrow">${ppTxt('ab morgen','from tomorrow')}</option></select>
  <div class="pp-modal-actions"><button class="secondary-action" id="pp-edit-cancel">${ppTxt('Abbrechen','Cancel')}</button><button class="primary-action" id="pp-edit-save">${ppTxt('Änderungen speichern','Save changes')}</button></div>`;
  ppModal(html);ppBindEditTimes();
  document.getElementById('pp-edit-close').onclick=ppModalClose;document.getElementById('pp-edit-cancel').onclick=ppModalClose;
  document.getElementById('pp-edit-add-time').onclick=()=>{const row=document.createElement('div');row.className='pp-edit-time-row';row.innerHTML='<input class="form-input pp-edit-time" type="time" value="12:00"><button type="button" class="time-remove pp-edit-time-remove">−</button>';document.getElementById('pp-edit-times').appendChild(row);ppBindEditTimes();};
  document.getElementById('pp-edit-save').onclick=async()=>{
    const name=document.getElementById('pp-edit-name').value.trim();const nt=normalizeTimes([...document.querySelectorAll('.pp-edit-time')].map(x=>x.value));
    if(!name)return alert(typeof tr==='function'?tr('needName'):'Please enter a medication name.');if(!nt.length||nt.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))return alert(typeof tr==='function'?tr('badTime'):'Please enter valid times.');
    m.name=name;m.dose=document.getElementById('pp-edit-dose').value.trim();m.doctorInstructions=document.getElementById('pp-edit-doctor').value.trim();m.expiryDate=document.getElementById('pp-edit-expiry').value||'';
    const old=timesForDate(m,today());if(JSON.stringify(old)!==JSON.stringify(nt)){
      let from=document.getElementById('pp-edit-from').value==='tomorrow'?addDays(today(),1):today();const map=await latestEvents();if(from===today()&&old.some(t=>map[slotKey(m.id,today(),t)]?.type==='taken')){from=addDays(today(),1);alert(ppTxt('Für heute ist bereits eine Einnahme dokumentiert. Die neuen Zeiten gelten deshalb ab morgen.','An intake is already documented today. New times will apply from tomorrow.'));}
      upsertSchedule(m,from,nt);m.times=nt;
    }
    await put('meds',m);ppModalClose();await render();
  };
};

async function ppCorrectionEvent(m,date,time){
  const map=await latestEvents(),slot=slotKey(m.id,date,time),cur=map[slot],taken=cur&&cur.type==='taken';
  const dateText=new Date(date+'T12:00:00').toLocaleDateString((typeof LANGS!=='undefined'&&LANGS[lang])?LANGS[lang].locale:'de-DE');
  const html=`<div class="pp-modal-head"><div><div class="form-title">${ppTxt('Dokumentation korrigieren','Correct documentation')}</div><div class="pp-modal-sub">${esc(m.name)} · ${esc(dateText)} · ${esc(time)}</div></div><button class="pp-close" id="pp-corr-close">×</button></div>
  <div class="pp-corr-state">${taken?ppTxt('Aktuell: dokumentiert','Current: documented'):ppTxt('Aktuell: nicht dokumentiert','Current: not documented')}</div>
  <label class="form-label">${ppTxt('Notiz / Grund (optional)','Note / reason (optional)')}</label><textarea id="pp-corr-note" class="form-input" rows="3" placeholder="${ppTxt('z. B. nachträglich korrigiert','e.g. corrected later')}"></textarea>
  <div class="pp-modal-actions"><button class="secondary-action" id="pp-corr-cancel">${ppTxt('Abbrechen','Cancel')}</button><button class="primary-action ${taken?'pp-danger-action':''}" id="pp-corr-save">${taken?ppTxt('Eintrag zurücknehmen','Undo entry'):ppTxt('Einnahme nachtragen','Add intake')}</button></div>`;
  ppModal(html);document.getElementById('pp-corr-close').onclick=ppModalClose;document.getElementById('pp-corr-cancel').onclick=ppModalClose;
  document.getElementById('pp-corr-save').onclick=async()=>{const note=document.getElementById('pp-corr-note').value.trim();await put('events',{eventId:uid(),slot,type:taken?'undo':'taken',tier:taken?'unrated':'unrated',createdAt:new Date().toISOString(),correction:true,note,timeZone:(typeof deviceTimeZone==='function'?deviceTimeZone():Intl.DateTimeFormat().resolvedOptions().timeZone)});ppModalClose();await render();};
}

chooseHistorical=async function(m,date){
  const ts=timesForDate(m,date);if(!ts.length)return alert(typeof tr==='function'?tr('noPlanDay'):'No intake was scheduled for this day.');
  if(ts.length===1)return ppCorrectionEvent(m,date,ts[0]);
  const map=await latestEvents();const items=ts.map(t=>{const e=map[slotKey(m.id,date,t)],taken=e&&e.type==='taken';return `<button class="pp-slot-choice" data-pp-time="${esc(t)}"><span>${esc(t)}</span><b>${taken?'✓ '+ppTxt('dokumentiert','documented'):'○ '+ppTxt('offen','open')}</b></button>`}).join('');
  const html=`<div class="pp-modal-head"><div><div class="form-title">${ppTxt('Einnahme auswählen','Select intake')}</div><div class="pp-modal-sub">${esc(m.name)}</div></div><button class="pp-close" id="pp-slots-close">×</button></div><div class="pp-slot-list">${items}</div>`;ppModal(html);document.getElementById('pp-slots-close').onclick=ppModalClose;document.querySelectorAll('[data-pp-time]').forEach(b=>b.onclick=()=>{const t=b.dataset.ppTime;ppModalClose();ppCorrectionEvent(m,date,t)});
};

function ppVoiceAvailable(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
function ppStartVoice(){
  const input=document.getElementById('med-name');if(!input)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return alert(ppTxt('Spracheingabe wird von diesem Browser nicht unterstützt.','Voice input is not supported by this browser.'));
  const r=new SR();r.lang=(typeof LANGS!=='undefined'&&LANGS[lang])?LANGS[lang].locale:'de-DE';r.interimResults=false;r.maxAlternatives=1;const b=document.getElementById('pp-voice');if(b)b.classList.add('listening');r.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript?.trim();if(text)input.value=text};r.onerror=()=>alert(ppTxt('Spracheingabe konnte nicht abgeschlossen werden.','Voice input could not be completed.'));r.onend=()=>{if(b)b.classList.remove('listening')};r.start();
}
function ppEnhanceAdd(){const input=document.getElementById('med-name');if(!input||document.getElementById('pp-voice'))return;const wrap=document.createElement('div');wrap.className='pp-voice-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);const b=document.createElement('button');b.type='button';b.id='pp-voice';b.className='pp-voice-btn';b.setAttribute('aria-label',ppTxt('Medikament per Sprache eingeben','Enter medication by voice'));b.textContent='🎙️';b.onclick=ppStartVoice;wrap.appendChild(b);if(!ppVoiceAvailable())b.classList.add('unsupported');}

function ppAddStyles(){if(document.getElementById('pp-ux-style'))return;const s=document.createElement('style');s.id='pp-ux-style';s.textContent=`
.pp-modal-backdrop{position:fixed;inset:0;background:rgba(26,22,18,.42);z-index:200;display:flex;align-items:flex-end;justify-content:center;padding:18px 12px calc(18px + env(safe-area-inset-bottom));backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.pp-modal-card{width:min(430px,100%);max-height:88vh;overflow:auto;background:#f7f4ef;border:1px solid #cfc5ba;border-radius:24px;padding:20px;box-shadow:0 20px 60px rgba(26,22,18,.28)}
.pp-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.pp-modal-sub{font-size:13px;color:#5d554e;margin-top:-5px}.pp-close{width:40px;height:40px;border-radius:50%;background:#e7dfd4;color:#2b2723;font-size:28px;line-height:1}.pp-modal-actions{display:grid;grid-template-columns:1fr 1.25fr;gap:10px;margin-top:20px}.pp-modal-actions .primary-action,.pp-modal-actions .secondary-action{margin-top:0;min-height:50px}.pp-danger-action{background:#a93429!important}.pp-edit-time-row{display:grid;grid-template-columns:1fr 52px;gap:8px;margin-bottom:8px}.pp-corr-state{margin:14px 0 4px;padding:12px 14px;background:#ece5dc;border:1px solid #cfc5ba;border-radius:14px;font-weight:800}.pp-slot-list{display:grid;gap:8px;margin-top:14px}.pp-slot-choice{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:start;background:#ece5dc;border:1px solid #c8bdb0;border-radius:14px;padding:14px 16px;color:#1a1612}.pp-slot-choice b{font-size:13px;color:#3f3934}.pp-voice-wrap{position:relative}.pp-voice-wrap .form-input{padding-right:58px}.pp-voice-btn{position:absolute;right:7px;top:7px;width:40px;height:40px;border-radius:12px;background:#e4eeeC;color:#1e625c;font-size:20px;border:1px solid #9ebdb8}.pp-voice-btn.listening{background:#2a7c74;color:#fff}.pp-voice-btn.unsupported{opacity:.45}
[dir="rtl"] .pp-voice-btn{right:auto;left:7px}[dir="rtl"] .pp-voice-wrap .form-input{padding-right:17px;padding-left:58px}
`;document.head.appendChild(s)}

const _ppBaseRender=render;
render=async function(){await _ppBaseRender();ppAddStyles();ppEnhanceAdd();};
ppAddStyles();setTimeout(ppEnhanceAdd,0);
