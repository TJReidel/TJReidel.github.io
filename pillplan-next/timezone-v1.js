/* PillPlan timezone safety v1 — detects travel, preserves local prescription times, stamps future events */
'use strict';

const TZ_TX={
  de:{title:'Zeitzone',sub:'Einnahmezeiten bleiben lokale, ärztlich vorgegebene Zielzeiten.',plan:'Plan-Zeitzone',device:'Geräte-Zeitzone',changed:'Zeitzonenwechsel erkannt – Einnahmeplan prüfen.',changedSub:'PillPlan verschiebt Einnahmezeiten nicht automatisch. Prüfen Sie die ärztlich vorgegebenen Zeiten und bestätigen Sie erst danach die neue Zeitzone.',accept:'Geräte-Zeitzone übernehmen',same:'Zeitzone aktuell',confirmed:'Zeitzone bestätigt.'},
  en:{title:'Time zone',sub:'Intake times remain local doctor-prescribed target times.',plan:'Plan time zone',device:'Device time zone',changed:'Time zone change detected – review your intake plan.',changedSub:'PillPlan does not shift intake times automatically. Review the prescribed times before confirming the new time zone.',accept:'Use device time zone',same:'Time zone current',confirmed:'Time zone confirmed.'},
  fr:{title:'Fuseau horaire',sub:'Les heures de prise restent les heures locales prescrites.',plan:'Fuseau du plan',device:'Fuseau de l’appareil',changed:'Changement de fuseau détecté – vérifiez le plan de prise.',changedSub:'PillPlan ne décale pas automatiquement les heures. Vérifiez les heures prescrites avant de confirmer le nouveau fuseau.',accept:'Utiliser le fuseau de l’appareil',same:'Fuseau actuel',confirmed:'Fuseau confirmé.'},
  es:{title:'Zona horaria',sub:'Las horas de toma siguen siendo las horas locales prescritas.',plan:'Zona del plan',device:'Zona del dispositivo',changed:'Cambio de zona horaria detectado – revisa el plan de toma.',changedSub:'PillPlan no cambia automáticamente las horas. Revisa las horas prescritas antes de confirmar la nueva zona.',accept:'Usar zona del dispositivo',same:'Zona horaria actual',confirmed:'Zona horaria confirmada.'},
  it:{title:'Fuso orario',sub:'Gli orari restano gli orari locali prescritti.',plan:'Fuso del piano',device:'Fuso del dispositivo',changed:'Cambio di fuso rilevato – controlla il piano di assunzione.',changedSub:'PillPlan non sposta automaticamente gli orari. Controlla gli orari prescritti prima di confermare il nuovo fuso.',accept:'Usa fuso del dispositivo',same:'Fuso attuale',confirmed:'Fuso confermato.'},
  tr:{title:'Saat dilimi',sub:'Kullanım saatleri doktorun belirlediği yerel hedef saatler olarak kalır.',plan:'Plan saat dilimi',device:'Cihaz saat dilimi',changed:'Saat dilimi değişikliği algılandı – kullanım planını kontrol edin.',changedSub:'PillPlan saatleri otomatik kaydırmaz. Yeni saat dilimini onaylamadan önce doktorun belirlediği saatleri kontrol edin.',accept:'Cihaz saat dilimini kullan',same:'Saat dilimi güncel',confirmed:'Saat dilimi onaylandı.'},
  ar:{title:'المنطقة الزمنية',sub:'تبقى أوقات التناول هي الأوقات المحلية التي وصفها الطبيب.',plan:'منطقة الخطة',device:'منطقة الجهاز',changed:'تم اكتشاف تغيير في المنطقة الزمنية – راجع خطة التناول.',changedSub:'لا يغيّر PillPlan أوقات التناول تلقائيًا. راجع الأوقات الموصوفة قبل تأكيد المنطقة الجديدة.',accept:'استخدام منطقة الجهاز',same:'المنطقة الزمنية الحالية',confirmed:'تم تأكيد المنطقة الزمنية.'},
  ru:{title:'Часовой пояс',sub:'Время приёма остаётся локальным временем, назначенным врачом.',plan:'Часовой пояс плана',device:'Часовой пояс устройства',changed:'Обнаружена смена часового пояса – проверьте план приёма.',changedSub:'PillPlan не переносит время автоматически. Сначала проверьте назначенное время, затем подтвердите новый пояс.',accept:'Использовать пояс устройства',same:'Часовой пояс актуален',confirmed:'Часовой пояс подтверждён.'},
  pt:{title:'Fuso horário',sub:'As horas de toma permanecem as horas locais prescritas.',plan:'Fuso do plano',device:'Fuso do dispositivo',changed:'Mudança de fuso detectada – reveja o plano de toma.',changedSub:'O PillPlan não altera automaticamente as horas. Reveja as horas prescritas antes de confirmar o novo fuso.',accept:'Usar fuso do dispositivo',same:'Fuso atual',confirmed:'Fuso confirmado.'}
};

function tzText(k){const code=(typeof lang==='string'&&TZ_TX[lang])?lang:'en';return TZ_TX[code][k]||TZ_TX.en[k]||k}
function deviceTimeZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch(_e){return'UTC'}}
function planTimeZone(){return localStorage.getItem('pillplan_timezone')||deviceTimeZone()}
function ensureInitialTimeZone(){if(!localStorage.getItem('pillplan_timezone'))localStorage.setItem('pillplan_timezone',deviceTimeZone())}
function timeZoneChanged(){return planTimeZone()!==deviceTimeZone()}

ensureInitialTimeZone();

/* Add the current timezone to every future audit event without changing the event model. */
const _tzBasePut=put;
put=async function(store,obj){
  if(store==='events'&&obj&&!obj.timeZone){
    obj={...obj,timeZone:deviceTimeZone(),planTimeZone:planTimeZone()};
  }
  return _tzBasePut(store,obj);
};

/* Backups now carry the confirmed plan timezone. */
exportBackup=async function(){
  const payload={schema:'pillplan-next-consolidated-v5',exportedAt:new Date().toISOString(),language:lang,timeZone:planTimeZone(),deviceTimeZone:deviceTimeZone(),meds:await all('meds'),events:await all('events'),meta:await all('meta')};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`PillPlan_Backup_${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
};

const _tzBaseImport=importBackup;
importBackup=async function(file){
  let importedTZ=null;
  try{const o=JSON.parse(await file.text());if(o&&typeof o.timeZone==='string'&&o.timeZone)importedTZ=o.timeZone}catch(_e){}
  await _tzBaseImport(file);
  if(importedTZ)localStorage.setItem('pillplan_timezone',importedTZ);
  await render();
};

function addTimezoneStyles(){
  if(document.getElementById('pillplan-timezone-style'))return;
  const s=document.createElement('style');s.id='pillplan-timezone-style';s.textContent=`
    .timezone-banner{margin:0 20px 14px;padding:14px 16px;border-radius:16px;background:#fff4df;border:2px solid #b08d57;color:#2b261f;box-shadow:0 2px 10px rgba(26,22,18,.06)}
    .timezone-banner strong{display:block;font-size:15px;margin-bottom:4px}.timezone-banner p{font-size:13px;line-height:1.45;color:#4a4035}.timezone-banner .tz-pair{font-size:12px;margin-top:8px;color:#4a4035}
    .timezone-control{width:min(190px,48vw);text-align:end}.timezone-value{font-size:13px;font-weight:800;color:#1f1b18;overflow-wrap:anywhere}.timezone-device{font-size:11px;color:#5f5750;margin-top:2px;overflow-wrap:anywhere}
    .timezone-accept{margin-top:9px;background:#2a7c74;color:#fff;padding:9px 11px;border-radius:11px;font-size:12px;font-weight:800;width:100%}
  `;document.head.appendChild(s);
}

function enhanceTimezoneUI(){
  addTimezoneStyles();
  const app=document.getElementById('app');if(!app)return;
  const old=document.getElementById('timezone-change-banner');if(old)old.remove();
  if(timeZoneChanged()){
    const period=document.querySelector('.period-selector');
    if(period){const b=document.createElement('div');b.id='timezone-change-banner';b.className='timezone-banner';b.innerHTML=`<strong>${tzText('changed')}</strong><p>${tzText('changedSub')}</p><div class="tz-pair">${tzText('plan')}: <b>${planTimeZone()}</b><br>${tzText('device')}: <b>${deviceTimeZone()}</b></div>`;period.insertAdjacentElement('afterend',b)}
  }
  const ls=document.getElementById('language-select');
  const row=ls?.closest('.settings-row');
  if(row&&!document.getElementById('timezone-row')){
    const r=document.createElement('div');r.className='settings-row';r.id='timezone-row';
    r.innerHTML=`<div><div class="settings-row-label">${tzText('title')}</div><div class="settings-row-sub">${tzText('sub')}</div></div><div class="timezone-control"><div class="timezone-value">${planTimeZone()}</div><div class="timezone-device">${tzText('device')}: ${deviceTimeZone()}</div>${timeZoneChanged()?`<button id="timezone-accept" class="timezone-accept">${tzText('accept')}</button>`:`<div class="timezone-device">✓ ${tzText('same')}</div>`}</div>`;
    row.insertAdjacentElement('afterend',r);
    const btn=document.getElementById('timezone-accept');if(btn)btn.onclick=async()=>{localStorage.setItem('pillplan_timezone',deviceTimeZone());try{await put('meta',{key:'timeZone',value:deviceTimeZone(),confirmedAt:new Date().toISOString()})}catch(_e){}alert(tzText('confirmed'));await render()};
  }
}

const _tzBaseRender=render;
render=async function(){await _tzBaseRender();enhanceTimezoneUI()};
window.addEventListener('load',()=>setTimeout(enhanceTimezoneUI,0));
