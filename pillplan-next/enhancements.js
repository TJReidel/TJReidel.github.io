(function(){
  const baseAddMed = addMed;
  const baseEditMed = editMed;
  const baseRender = render;

  function daysUntil(dateStr){
    if(!dateStr) return null;
    const target=new Date(dateStr+'T12:00:00');
    const now=new Date(today()+'T12:00:00');
    return Math.ceil((target-now)/86400000);
  }

  function praiseText(s,st){
    if(!s.tot) return '';
    if(s.done===0) return 'Guten Morgen. Dein erster Check wartet.';
    if(s.done<s.tot) return `${s.done} von ${s.tot} geschafft. Du bleibst dran.`;
    if(st>=30) return '30 Tage in Folge. Sehr stark – diese Routine trägt.';
    if(st>=14) return 'Zwei Wochen konsequent. Stark weitergemacht.';
    if(st>=7) return 'Eine Woche. Stark.';
    if(st>=3) return `${st} Tage in Folge. Gute Routine.`;
    return `${s.done} von ${s.tot}. Du bleibst dran — das zählt.`;
  }

  function statsPraise(pct){
    if(pct>=80) return 'Gut im Blick – weiter so.';
    if(pct>=40) return 'Schon einiges dokumentiert.';
    return 'Jeder Eintrag hilft Ihnen, den Überblick zu behalten.';
  }

  async function buildStats(daysCount=30){
    const meds=await all('meds');
    const map=await latestEvents();
    const days=pastDays(daysCount);
    const out={green:0,yellow:0,red:0,unrated:0,undocumented:0,due:0,done:0};
    for(const d of days){
      for(const m of meds){
        if(m.startDate && d<m.startDate) continue;
        const times=normalizeTimes(m.times||[]);
        for(const t of times){
          out.due++;
          const e=map[slotKey(m.id,d,t)];
          if(!e || e.type!=='taken'){out.undocumented++;continue;}
          out.done++;
          if(e.tier==='yellow') out.yellow++;
          else if(e.tier==='red') out.red++;
          else if(e.tier==='unrated') out.unrated++;
          else out.green++;
        }
      }
    }
    out.pct=out.due?Math.round(out.done/out.due*100):0;
    return out;
  }

  async function buildSummary(){
    const meds=await all('meds');
    const s=await todayStats();
    const st=await streak();
    const lines=[`PillPlan – ${fmtDate()}`,`Heute: ${s.done}/${s.tot} dokumentiert (${s.pct}%)`,`Serie: ${st} ${st===1?'Tag':'Tage'}`,''];
    meds.forEach(m=>{
      const times=normalizeTimes(m.times||[]).join(', ');
      let line=`${m.name}${m.dose?` ${m.dose}`:''}: ${times}`;
      if(m.doctorInstructions) line+=` · ${m.doctorInstructions}`;
      if(m.expiryDate) line+=` · MHD ${m.expiryDate}`;
      lines.push(line);
    });
    return lines.join('\n');
  }

  async function shareSummary(){
    const text=await buildSummary();
    try{
      if(navigator.share){await navigator.share({title:'PillPlan',text});}
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('PillPlan-Zusammenfassung wurde kopiert.');}
      else alert(text);
    }catch(e){if(e?.name!=='AbortError')alert('Teilen war nicht möglich.');}
  }

  async function testNotification(){
    if(!('Notification' in window)){alert('Benachrichtigungen werden in diesem Browser nicht unterstützt.');return;}
    let permission=Notification.permission;
    if(permission==='default') permission=await Notification.requestPermission();
    if(permission!=='granted'){alert('Benachrichtigungen sind nicht freigegeben.');return;}
    try{
      const reg=await navigator.serviceWorker?.ready;
      if(reg?.showNotification) await reg.showNotification('PillPlan',{body:'Test erfolgreich. PillPlan kann Benachrichtigungen anzeigen.',icon:'/icon.png'});
      else new Notification('PillPlan',{body:'Test erfolgreich. PillPlan kann Benachrichtigungen anzeigen.'});
    }catch(e){alert('Testbenachrichtigung konnte nicht angezeigt werden.');}
  }

  function startVoiceInput(){
    const field=document.getElementById('med-name');
    if(!field)return;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){field.focus();alert('Direkte Spracheingabe ist hier nicht verfügbar. Nutze das Mikrofon der iPhone-Tastatur.');return;}
    const r=new SR();
    r.lang='de-DE'; r.interimResults=false; r.maxAlternatives=1;
    const b=document.getElementById('voice-med');
    if(b){b.textContent='🎙️';b.classList.add('listening');}
    r.onresult=e=>{const t=e.results?.[0]?.[0]?.transcript||'';if(t)field.value=t.trim();};
    r.onerror=()=>alert('Spracheingabe konnte nicht gestartet werden.');
    r.onend=()=>{if(b){b.textContent='🎤';b.classList.remove('listening');}};
    r.start();
  }

  async function importCompat(file){
    const text=await file.text();
    const obj=JSON.parse(text);

    // PillPlan Next export
    if(obj && Array.isArray(obj.meds) && Array.isArray(obj.events)){
      await clear('meds'); await clear('events'); await clear('meta');
      for(const m of obj.meds) await put('meds',{...m,times:normalizeTimes(m.times||[])});
      for(const e of obj.events) await put('events',e);
      for(const x of (obj.meta||[])) await put('meta',x);
      await put('meta',{key:'importedAt',value:new Date().toISOString()});
      await render(); return;
    }

    // Legacy PillPlan localStorage backup
    let state=obj;
    if(obj?.localStorage?.pillplan_v4) state=typeof obj.localStorage.pillplan_v4==='string'?JSON.parse(obj.localStorage.pillplan_v4):obj.localStorage.pillplan_v4;
    if(!state || !Array.isArray(state.meds) || typeof state.taken!=='object') throw new Error('Ungültige PillPlan-Sicherung');
    await clear('meds'); await clear('events');
    for(const m of state.meds){
      await put('meds',{
        id:m.id,name:m.name,times:normalizeTimes(m.times||[]),color:m.color||'#2a7c74',startDate:m.startDate||null,
        scheduleHistory:m.scheduleHistory||[],dose:m.dose||'',doctorInstructions:m.doctorInstructions||'',expiryDate:m.expiryDate||''
      });
    }
    for(const [slot,val] of Object.entries(state.taken||{})){
      const tier=tierForLegacy(val); if(!tier) continue;
      await put('events',{eventId:uid(),slot,type:'taken',tier,createdAt:(val&&val.takenAt)||new Date().toISOString(),legacy:true});
    }
    await put('meta',{key:'importedAt',value:new Date().toISOString()});
    await render();
  }

  async function exportCompat(){
    const meds=await all('meds'),events=await all('events'),meta=await all('meta');
    const payload={schema:'pillplan-next-v6',exportedAt:new Date().toISOString(),meds,events,meta};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`PillPlan_Backup_${today()}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  importBackup=importCompat;
  exportBackup=exportCompat;
  window.importBackup=importCompat;
  window.exportBackup=exportCompat;

  async function addMed(name,times,color='#2a7c74'){
    times=normalizeTimes(times); if(!name||!times.length)return;
    const id=Date.now();
    const instructions=(document.getElementById('doctor-instructions')?.value||'').trim();
    const dose=(document.getElementById('med-dose')?.value||'').trim();
    const expiry=document.getElementById('med-expiry')?.value||'';
    const chosenColor=document.getElementById('med-color')?.value||color;
    await put('meds',{id,name:name.trim(),times,color:chosenColor,startDate:today(),scheduleHistory:[{from:today(),times:[...times]}],doctorInstructions:instructions,dose,expiryDate:expiry});
    view='today'; await render();
  }

  async function editMed(id){
    const m=await getOne('meds',id); if(!m)return;
    const name=prompt('Medikament bearbeiten – Name',m.name); if(name===null)return;
    const raw=prompt('Einnahmezeiten, durch Komma getrennt (z. B. 08:00, 14:00, 20:00)',normalizeTimes(m.times||[]).join(', ')); if(raw===null)return;
    const times=normalizeTimes(raw.split(',').map(x=>x.trim()));
    if(!times.length||times.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))){alert('Bitte gültige Uhrzeiten als HH:MM eingeben.');return}
    const dose=prompt('Dosis / Stärke (optional)',m.dose||''); if(dose===null)return;
    const instructions=prompt('Ärztliche Einnahmevorgabe (optional)',m.doctorInstructions||''); if(instructions===null)return;
    const expiry=prompt('MHD / Verfallsdatum (JJJJ-MM-TT, optional)',m.expiryDate||''); if(expiry===null)return;
    if(expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)){alert('Bitte MHD als JJJJ-MM-TT eingeben.');return}
    m.name=name.trim()||m.name; m.times=times; m.dose=dose.trim(); m.doctorInstructions=instructions.trim(); m.expiryDate=expiry;
    m.scheduleHistory=[...(m.scheduleHistory||[]),{from:today(),times:[...times]}];
    await put('meds',m); await render();
  }

  window.addMed=addMed;
  window.editMed=editMed;

  async function enhance(){
    const app=document.getElementById('app'); if(!app) return;
    const s=await todayStats(), st=await streak(), meds=await all('meds');

    const periodSelect=document.getElementById('period');
    if(periodSelect && ![...periodSelect.options].some(o=>o.value==='21')){
      const opt=document.createElement('option'); opt.value='21'; opt.textContent='3 Wochen';
      periodSelect.insertBefore(opt,periodSelect.querySelector('option[value="30"]'));
    }
    if(period===21){const label=document.querySelector('.section-label');if(label)label.textContent=label.textContent.replace('1 MONAT','3 WOCHEN');}

    const content=document.querySelector('.content');
    if(view==='today' && content && !document.getElementById('daily-praise')){
      const p=document.createElement('div'); p.id='daily-praise'; p.className='praise-card'; p.textContent=praiseText(s,st); content.prepend(p);
      const warnings=[];
      meds.forEach(m=>{const d=daysUntil(m.expiryDate);if(d!==null&&d<=30){warnings.push(d<0?`⚠️ ${m.name}: MHD überschritten`:`📅 ${m.name}: MHD in ${d} Tagen`);}});
      if(warnings.length){const w=document.createElement('div');w.className='expiry-card';w.innerHTML=warnings.map(x=>`<div>${esc(x)}</div>`).join('');p.after(w);}
      meds.forEach(m=>{
        if(!m.doctorInstructions&&!m.dose&&!m.expiryDate)return;
        const cards=[...document.querySelectorAll('.dose')];
        const first=cards.find(c=>c.querySelector('.name')?.textContent===m.name);
        if(first&&!first.querySelector('.doctor-note')){
          const note=document.createElement('div');note.className='doctor-note';
          let text='';if(m.dose)text+=`Dosis: ${m.dose}`;if(m.doctorInstructions)text+=(text?' · ':'')+m.doctorInstructions;if(m.expiryDate)text+=(text?' · ':'')+`MHD ${m.expiryDate}`;
          note.textContent=text;first.querySelector('.grow')?.appendChild(note);
        }
      });
    }

    if(view==='add'){
      const card=document.querySelector('.content .card');
      if(card&&!document.getElementById('med-dose')){
        const name=document.getElementById('med-name');
        if(name&&!document.getElementById('voice-med')){
          const row=document.createElement('div');row.className='name-voice-row';name.parentNode.insertBefore(row,name);row.appendChild(name);
          const mic=document.createElement('button');mic.type='button';mic.id='voice-med';mic.className='voice-btn';mic.textContent='🎤';mic.title='Medikament per Sprache eingeben';mic.onclick=startVoiceInput;row.appendChild(mic);
        }
        const wrap=document.createElement('div');wrap.innerHTML=`
          <div class="small" style="margin-top:12px">Ärztliche Vorgaben</div>
          <input id="med-dose" class="field" placeholder="Dosis / Stärke, z. B. 5 mg">
          <textarea id="doctor-instructions" class="field" rows="3" placeholder="z. B. morgens nüchtern / nach dem Essen / nach ärztlicher Vorgabe"></textarea>
          <div class="small" style="margin-top:10px">MHD / Verfallsdatum</div>
          <input id="med-expiry" class="field" type="date">
          <div class="small" style="margin-top:10px">Kennfarbe</div>
          <input id="med-color" class="color-field" type="color" value="#2a7c74" aria-label="Kennfarbe des Medikaments">
          <div class="doctor-disclaimer">Dein Arzt plant — PillPlan erinnert. Änderungen an Dosis oder Einnahme immer mit Arzt/Ärztin oder Apotheke klären.</div>`;
        const addTime=document.getElementById('add-time');card.insertBefore(wrap,addTime);
      }
    }

    if(view==='settings'&&content){
      if(!document.getElementById('stats-v2')){
        const stats=await buildStats(30);
        const box=document.createElement('div');box.id='stats-v2';box.className='card stats-card';
        box.innerHTML=`<div class="form-title">Statistik · letzte 30 Tage</div>
          <div class="stats-main"><strong>${stats.pct}%</strong><span>Dokumentierte Einnahmen</span></div>
          <div class="stats-praise">${statsPraise(stats.pct)}</div>
          <div class="stats-row"><span><i class="dot green-dot"></i>Grün · pünktlich</span><strong>${stats.green}</strong></div>
          <div class="stats-row"><span><i class="dot yellow-dot"></i>Gelb · 30–44 Min. verspätet</span><strong>${stats.yellow}</strong></div>
          <div class="stats-row"><span><i class="dot red-dot"></i>Rot · 45+ Min. verspätet</span><strong>${stats.red}</strong></div>
          <div class="stats-row"><span><i class="dot gray-dot"></i>Hellgrau · nachgetragen</span><strong>${stats.unrated}</strong></div>
          <div class="stats-row"><span><i class="dot white-dot"></i>Nicht dokumentiert</span><strong>${stats.undocumented}</strong></div>`;
        content.appendChild(box);
      }
      if(!document.getElementById('comfort-tools')){
        const box=document.createElement('div');box.id='comfort-tools';box.className='card';
        const notifText=('Notification' in window)?`Status: ${Notification.permission==='granted'?'freigegeben':Notification.permission==='denied'?'blockiert':'noch nicht freigegeben'}`:'Auf diesem Gerät nicht verfügbar';
        box.innerHTML=`<div class="form-title">Komfort & Weitergabe</div>
          <button id="share-summary" class="btn primary">Teilen</button>
          <button id="print-summary" class="btn secondary">Drucken</button>
          <button id="test-notif" class="btn secondary">Erinnerung testen</button>
          <div class="small reminder-note">${notifText}. Geplante Hintergrund-Erinnerungen werden in der Web-App noch nicht zuverlässig garantiert.</div>`;
        content.appendChild(box);
        document.getElementById('share-summary').onclick=shareSummary;
        document.getElementById('print-summary').onclick=()=>window.print();
        document.getElementById('test-notif').onclick=testNotification;
      }
    }
  }

  render=async function(){await baseRender();await enhance();};
  window.render=render;

  const style=document.createElement('style');
  style.textContent=`
    .praise-card{background:#e8f4f3;border:1px solid #c8e4e1;border-radius:18px;padding:14px 16px;margin:8px 0 12px;font-weight:800;color:#315f5a}
    .expiry-card{background:#fff8e9;border:1px solid #ead4a1;border-radius:16px;padding:12px 14px;margin-bottom:12px;font-weight:700}
    .doctor-note{font-size:12px;color:#5f5a55;margin-top:6px;line-height:1.35}
    .doctor-disclaimer{background:#f3efe8;border-radius:14px;padding:12px;margin:10px 0 4px;font-size:13px;line-height:1.4;color:#514b45}
    textarea.field{resize:vertical;min-height:84px}
    .name-voice-row{display:grid;grid-template-columns:1fr 58px;gap:8px;align-items:center}
    .voice-btn{height:48px;border:0;border-radius:14px;background:#e8f4f3;font-size:24px}
    .voice-btn.listening{outline:3px solid #2f7770}
    .color-field{width:100%;height:48px;border:1px solid #ddd4c9;border-radius:14px;background:#fff;padding:5px;margin:6px 0}
    .reminder-note{margin-top:10px;line-height:1.4}
    .stats-main{display:flex;align-items:baseline;gap:10px;margin:4px 0 6px}.stats-main strong{font-size:38px;color:#2f7770}.stats-main span{font-weight:800}.stats-praise{color:#5f5a55;margin-bottom:12px}.stats-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid #eee8e0;font-size:14px}.dot{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:8px;vertical-align:-1px}.green-dot{background:#2f7770}.yellow-dot{background:#d8b866}.red-dot{background:#bb4436}.gray-dot{background:#d9d4cd}.white-dot{background:#fff;border:1px solid #cfc8bf}
    @media print{.bottom-nav,.tabs,.period-select,.mini,.legend{display:none!important}#app{max-width:none;padding:0}.card,.plan-med,.progress-card{break-inside:avoid}}
  `;
  document.head.appendChild(style);
  setTimeout(()=>enhance(),250);
})();