(function(){
  const timesForDate=(m,d)=>window.PillPlanLongitudinal?.timesForDate?window.PillPlanLongitudinal.timesForDate(m,d):normalizeTimes(m.times||[]);
  function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d)}
  function previousDay(ds){return addDays(ds,-1)}
  function upsertSchedule(m,from,times){const h=Array.isArray(m.scheduleHistory)?m.scheduleHistory.slice():[];const idx=h.findIndex(x=>x.from===from),entry={from,times:normalizeTimes(times)};if(idx>=0)h[idx]=entry;else h.push(entry);h.sort((a,b)=>a.from.localeCompare(b.from));m.scheduleHistory=h;}
  async function anyDocumented(m,ds,times){const map=await latestEvents();return times.some(t=>{const e=map[slotKey(m.id,ds,t)];return e&&e.type==='taken';});}

  // Schutz vor versehentlichem Entfernen bereits dokumentierter Einnahmen.
  toggle=async function(mid,date,time,forceTier=null){
    const slot=slotKey(mid,date,time),map=await latestEvents(),current=map[slot];
    const turningOn=!(current&&current.type==='taken');
    if(!turningOn){
      const m=await getOne('meds',mid);
      const label=m?.name||'Diese Einnahme';
      const dateLabel=new Date(date+'T12:00:00').toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
      const ok=confirm(`${label} am ${dateLabel} um ${time} wurde bereits als eingenommen dokumentiert.\n\nDiesen Eintrag wirklich zurücknehmen?`);
      if(!ok)return;
    }
    const tier=turningOn?(forceTier||computeTier(time)):'unrated';
    await put('events',{eventId:uid(),slot,type:turningOn?'taken':'undo',tier,createdAt:new Date().toISOString()});
    await render();
  };
  window.toggle=toggle;

  editMed=async function(id){
    const m=await getOne('meds',id);if(!m||m.endDate)return;
    const oldTimes=timesForDate(m,today());
    const name=prompt('Medikament bearbeiten – Name',m.name);if(name===null)return;
    const raw=prompt('Einnahmezeiten, durch Komma getrennt (z. B. 08:00, 14:00, 20:00)',normalizeTimes(m.times||oldTimes).join(', '));if(raw===null)return;
    const newTimes=normalizeTimes(raw.split(',').map(x=>x.trim()));
    if(!newTimes.length||newTimes.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))){alert('Bitte gültige Uhrzeiten als HH:MM eingeben.');return;}
    const dose=prompt('Dosis / Stärke (optional)',m.dose||'');if(dose===null)return;
    const instructions=prompt('Ärztliche Einnahmevorgabe (optional)',m.doctorInstructions||'');if(instructions===null)return;
    const expiry=prompt('MHD / Verfallsdatum (JJJJ-MM-TT, optional)',m.expiryDate||'');if(expiry===null)return;
    if(expiry&&!/^\d{4}-\d{2}-\d{2}$/.test(expiry)){alert('Bitte MHD als JJJJ-MM-TT eingeben.');return;}
    m.name=name.trim()||m.name;m.dose=dose.trim();m.doctorInstructions=instructions.trim();m.expiryDate=expiry;
    const changed=JSON.stringify(oldTimes)!==JSON.stringify(newTimes);
    if(changed){let from=today();if(await anyDocumented(m,today(),oldTimes)){from=addDays(today(),1);alert('Für heute ist bereits eine Einnahme dokumentiert. Die neuen Einnahmezeiten gelten deshalb ab morgen.');}else{const ans=prompt('Ab wann sollen die neuen Einnahmezeiten gelten?\n1 = ab heute\n2 = ab morgen','1');if(ans===null)return;from=String(ans).trim()==='2'?addDays(today(),1):today();}upsertSchedule(m,from,newTimes);m.times=newTimes;}
    await put('meds',m);await render();
  };

  removeMed=async function(id){
    const m=await getOne('meds',id);if(!m||m.endDate)return;
    const current=timesForDate(m,today());let from=today();
    if(await anyDocumented(m,today(),current)){from=addDays(today(),1);if(!confirm(`${m.name} nach heute beenden? Die bisherige Historie bleibt vollständig erhalten.`))return;}
    else{const ans=prompt(`${m.name} beenden – die Historie bleibt erhalten.\n1 = ab heute beenden\n2 = nach heute beenden`,'2');if(ans===null)return;from=String(ans).trim()==='1'?today():addDays(today(),1);}
    upsertSchedule(m,from,[]);m.endDate=previousDay(from);m.endedAt=new Date().toISOString();m.times=[];await put('meds',m);await render();
  };

  async function longitudinalStats(daysCount=30){
    const meds=await all('meds'),map=await latestEvents(),days=pastDays(daysCount);const out={green:0,yellow:0,red:0,unrated:0,undocumented:0,due:0,done:0};
    for(const d of days)for(const m of meds)for(const t of timesForDate(m,d)){out.due++;const e=map[slotKey(m.id,d,t)];if(!e||e.type!=='taken'){out.undocumented++;continue;}out.done++;if(e.tier==='yellow')out.yellow++;else if(e.tier==='red')out.red++;else if(e.tier==='unrated')out.unrated++;else out.green++;}
    out.pct=out.due?Math.round(out.done/out.due*100):0;return out;
  }
  function praise(pct){if(pct>=80)return'Gut im Blick – weiter so.';if(pct>=40)return'Schon einiges dokumentiert.';return'Jeder Eintrag hilft Ihnen, den Überblick zu behalten.';}
  async function fixStats(){
    const box=document.getElementById('stats-v2');if(!box)return;const s=await longitudinalStats(30);
    box.innerHTML=`<div class="form-title">Statistik · letzte 30 Tage</div><div class="stats-main"><strong>${s.pct}%</strong><span>Dokumentierte Einnahmen</span></div><div class="stats-praise">${praise(s.pct)}</div><div class="stats-row"><span><i class="dot green-dot"></i>Grün · pünktlich</span><strong>${s.green}</strong></div><div class="stats-row"><span><i class="dot yellow-dot"></i>Gelb · 30–44 Min. verspätet</span><strong>${s.yellow}</strong></div><div class="stats-row"><span><i class="dot red-dot"></i>Rot · 45+ Min. verspätet</span><strong>${s.red}</strong></div><div class="stats-row"><span><i class="dot gray-dot"></i>Hellgrau · nachgetragen</span><strong>${s.unrated}</strong></div><div class="stats-row"><span><i class="dot white-dot"></i>Nicht dokumentiert</span><strong>${s.undocumented}</strong></div>`;
  }
  const previousRender=render;
  render=async function(){await previousRender();await fixStats();};
  window.editMed=editMed;window.removeMed=removeMed;window.render=render;
  setTimeout(()=>fixStats(),300);
})();