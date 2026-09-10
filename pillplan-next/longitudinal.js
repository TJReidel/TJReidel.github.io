(function(){
  function addDays(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return localDate(d)}
  function previousDay(ds){return addDays(ds,-1)}
  function timesForDate(m,ds){
    if(!m)return[];
    if(m.startDate&&ds<m.startDate)return[];
    if(m.endDate&&ds>m.endDate)return[];
    const h=Array.isArray(m.scheduleHistory)?m.scheduleHistory.filter(x=>x&&x.from&&Array.isArray(x.times)).slice().sort((a,b)=>a.from.localeCompare(b.from)):[];
    let times=null;
    for(const x of h){if(x.from<=ds)times=x.times;else break;}
    return normalizeTimes(times===null?(m.times||[]):times);
  }
  function activeToday(m){return timesForDate(m,today()).length>0}
  async function anyDocumented(m,ds,times){const map=await latestEvents();return times.some(t=>{const e=map[slotKey(m.id,ds,t)];return e&&e.type==='taken';});}
  function upsertSchedule(m,from,times){
    const h=Array.isArray(m.scheduleHistory)?m.scheduleHistory.slice():[];
    const idx=h.findIndex(x=>x.from===from);
    const entry={from,times:normalizeTimes(times)};
    if(idx>=0)h[idx]=entry;else h.push(entry);
    h.sort((a,b)=>a.from.localeCompare(b.from));
    m.scheduleHistory=h;
  }

  todayStats=async function(){
    const meds=await all('meds'),map=await latestEvents(),td=today();let tot=0,done=0,onTime=0,rated=0;
    for(const m of meds)for(const t of timesForDate(m,td)){tot++;const e=map[slotKey(m.id,td,t)];if(e&&e.type==='taken'){done++;if(e.tier!=='unrated'){rated++;if(e.tier==='green')onTime++;}}}
    return{tot,done,pct:tot?Math.round(done/tot*100):0,punct:rated?Math.round(onTime/rated*100):0};
  };
  streak=async function(){
    const meds=await all('meds'),map=await latestEvents();if(!meds.length)return 0;let s=0;
    for(let i=0;i<365;i++){const d=new Date();d.setDate(d.getDate()-i);const ds=localDate(d);let due=0,ok=true;
      for(const m of meds)for(const t of timesForDate(m,ds)){due++;const e=map[slotKey(m.id,ds,t)];if(!(e&&e.type==='taken'))ok=false;}
      if(due===0)continue;if(ok)s++;else break;
    }return s;
  };
  classifyDay=function(m,d,map){
    const times=timesForDate(m,d);if(!times.length)return'pre';let done=0,worst='green';
    for(const t of times){const e=map[slotKey(m.id,d,t)];if(e&&e.type==='taken'){done++;if(e.tier==='red')worst='red';else if(e.tier==='yellow'&&worst!=='red')worst='yellow';else if(e.tier==='unrated'&&worst==='green')worst='unrated';}}
    if(done===0)return'';if(done<times.length)return'partial';return worst;
  };
  periodStats=async function(){
    const meds=await all('meds'),map=await latestEvents(),days=pastDays(period);let due=0,done=0;
    for(const d of days)for(const m of meds)for(const t of timesForDate(m,d)){due++;const e=map[slotKey(m.id,d,t)];if(e&&e.type==='taken')done++;}
    return{due,done,pct:due?Math.round(done/due*100):0};
  };
  chooseHistoricalTime=async function(m,date){
    const times=timesForDate(m,date);if(!times.length){alert('Für diesen Tag war keine Einnahme geplant.');return;}
    if(times.length===1){await toggle(m.id,date,times[0],'unrated');return;}
    const options=times.map((t,i)=>`${i+1}: ${t}`).join('\n');const ans=prompt(`Welche Einnahme von ${m.name} am ${new Date(date+'T12:00:00').toLocaleDateString('de-DE')} ändern?\n${options}\n\nNummer eingeben:`);if(ans===null)return;const idx=Number(ans)-1;if(!Number.isInteger(idx)||idx<0||idx>=times.length){alert('Ungültige Auswahl.');return;}await toggle(m.id,date,times[idx],'unrated');
  };

  editMed=async function(id){
    const m=await getOne('meds',id);if(!m)return;
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
    if(changed){let from=today();if(await anyDocumented(m,today(),oldTimes)){from=addDays(today(),1);alert('Für heute ist bereits eine Einnahme dokumentiert. Die neue Einnahmezeit gilt deshalb ab morgen.');}else{const ans=prompt('Ab wann sollen die neuen Einnahmezeiten gelten?\n1 = ab heute\n2 = ab morgen','1');if(ans===null)return;from=String(ans).trim()==='2'?addDays(today(),1):today();}upsertSchedule(m,from,newTimes);m.times=newTimes;}
    await put('meds',m);await render();
  };

  removeMed=async function(id){
    const m=await getOne('meds',id);if(!m||m.endDate)return;
    const current=timesForDate(m,today());let from=today();
    if(await anyDocumented(m,today(),current)){from=addDays(today(),1);if(!confirm(`${m.name} nach heute beenden? Die gesamte bisherige Historie bleibt erhalten.`))return;}
    else{const ans=prompt(`${m.name} beenden – Historie bleibt erhalten.\n1 = ab heute beenden\n2 = nach heute beenden`,'2');if(ans===null)return;from=String(ans).trim()==='1'?today():addDays(today(),1);}
    upsertSchedule(m,from,[]);m.endDate=previousDay(from);m.endedAt=new Date().toISOString();m.times=[];await put('meds',m);await render();
  };

  render=async function(){
    const app=document.getElementById('app'),meds=await all('meds'),map=await latestEvents(),s=await todayStats(),st=await streak(),ps=await periodStats(),td=today();
    const title=view==='plan'?'Dokumentation':'Heute';
    let html=`<div class="header-row"><div class="logo">Pill<span>Plan</span></div><div class="date-chip">${fmtDate()}</div></div><div class="progress-card"><div class="ring">${s.pct}%</div><div><div class="progress-title">${title}</div><div class="progress-sub">${s.done} / ${s.tot} dokumentiert</div><div class="punct">Pünktlichkeit: ${s.punct}%</div><div class="streak">🔥 ${st} ${st===1?'Tag':'Tage'} in Folge</div></div></div><select class="period-select" id="period"><option value="7" ${period===7?'selected':''}>1 Woche</option><option value="14" ${period===14?'selected':''}>2 Wochen</option><option value="21" ${period===21?'selected':''}>3 Wochen</option><option value="30" ${period===30?'selected':''}>1 Monat</option></select><div class="tabs"><button class="tab ${view==='today'?'active':''}" data-v="today">💊 Heute</button><button class="tab ${view==='plan'?'active':''}" data-v="plan">📅 Plan</button><button class="tab ${view==='add'?'active':''}" data-v="add">＋ Hinzufügen</button></div><main class="content">`;
    if(view==='today'){
      const active=meds.filter(activeToday);if(!active.length)html+=`<div class="empty">Heute sind keine Medikamente geplant.</div>`;
      for(const m of active)for(const t of timesForDate(m,td)){const e=map[slotKey(m.id,td,t)],on=e&&e.type==='taken',cls=tierClass(e);html+=`<div class="card dose"><div class="dose-icon">${on?'✅':'💊'}</div><div class="grow"><div class="name">${esc(m.name)}${m.dose?' '+esc(m.dose):''}</div><div class="time">${esc(t)}</div><div class="statusline ${cls}">${statusText(e)}</div></div><button class="check ${on?'on':''}" data-toggle="${m.id}" data-time="${esc(t)}">${on?'✓':'○'}</button></div>`;}
    }
    if(view==='plan'){
      html+=`<div class="legend"><div>Was bedeuten die Farben?</div><div class="legend-row"><span class="sw g">✓</span> Grün – dokumentiert und pünktlich</div><div class="legend-row"><span class="sw y">!</span> Gelb – 30–44 Min. verspätet</div><div class="legend-row"><span class="sw r">!</span> Rot – 45+ Min. verspätet</div><div class="legend-row"><span class="sw n">✓</span> Hellgrau – nachgetragen, genaue Zeit unbekannt</div></div><div class="section-label">${period===7?'1 WOCHE':period===14?'2 WOCHEN':period===21?'3 WOCHEN':'1 MONAT'} · ${ps.done}/${ps.due} · ${ps.pct}%</div>`;
      const days=pastDays(period);
      for(const m of meds){const hasAny=days.some(d=>timesForDate(m,d).length);if(!hasAny&&!activeToday(m))continue;const ct=timesForDate(m,td);html+=`<div class="plan-med"><div class="plan-head"><div><div class="plan-name">${esc(m.name)}${m.dose?' '+esc(m.dose):''}</div><div class="small">${m.endDate?`Beendet am ${new Date(m.endDate+'T12:00:00').toLocaleDateString('de-DE')}`:(ct.length?ct.join(' · '):'Aktuell keine Einnahme')}</div></div><div class="med-actions"><button class="mini" data-edit="${m.id}" ${m.endDate?'disabled':''}>✏️ Bearbeiten</button><button class="mini remove" data-remove="${m.id}" ${m.endDate?'disabled':''}>${m.endDate?'Beendet':'Beenden'}</button></div></div><div class="days">`;
        for(const d of days){const cls=classifyDay(m,d,map),dt=new Date(d+'T12:00:00'),visual=cls==='unrated'?'':cls==='partial'?'yellow':cls==='pre'?'':cls,mark=cls==='pre'?'·':cls?'✓':'○';html+=`<button class="day ${visual} ${d===td?'today':''}" data-day="${d}" data-mid="${m.id}" title="Nachtragen / ändern"><div>${dt.toLocaleDateString('de-DE',{weekday:'short'}).slice(0,2)}</div><strong>${dt.getDate()}</strong><div>${mark}</div></button>`;}html+=`</div></div>`;
      }
    }
    if(view==='add')html+=`<div class="card"><div class="form-title">Medikament hinzufügen</div><input id="med-name" class="field" placeholder="Name des Medikaments"><div class="small" style="margin-top:8px">Einnahmezeiten pro Tag</div><div id="time-list">${timeRowsHTML(['08:00'])}</div><button type="button" id="add-time" class="btn secondary">＋ Einnahmezeit hinzufügen</button><button id="add-med" class="btn primary">Medikament speichern</button></div>`;
    if(view==='settings')html+=`<div class="card"><div class="form-title">Einstellungen</div><div class="settings-row"><strong>Daten</strong><div class="small">PillPlan Next speichert lokal in IndexedDB.</div></div><div class="settings-row"><strong>Sicherung</strong><input id="backup-file" class="field" type="file" accept="application/json,.json"><button id="import-btn" class="btn primary">Backup importieren</button><button id="export-btn" class="btn secondary">Backup exportieren</button></div></div>`;
    html+=`</main><nav class="bottom-nav"><button class="nav ${view==='today'?'active':''}" data-v="today"><span class="nav-icon">💊</span>HEUTE</button><button class="nav ${view==='plan'?'active':''}" data-v="plan"><span class="nav-icon">📅</span>PLAN</button><button class="nav ${view==='add'?'active':''}" data-v="add"><span class="nav-icon">＋</span>HINZUFÜGEN</button><button class="nav ${view==='settings'?'active':''}" data-v="settings"><span class="nav-icon">⚙️</span>EINSTELLUNGEN</button></nav>`;app.innerHTML=html;
    document.querySelectorAll('[data-v]').forEach(b=>b.onclick=async()=>{view=b.dataset.v;await render()});const p=document.getElementById('period');if(p)p.onchange=async()=>{period=Number(p.value);await render()};document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.toggle),td,b.dataset.time));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editMed(Number(b.dataset.edit)));document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeMed(Number(b.dataset.remove)));document.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const m=meds.find(x=>x.id===Number(b.dataset.mid));if(m)chooseHistoricalTime(m,b.dataset.day)});const addTime=document.getElementById('add-time');if(addTime){addTime.onclick=addTimeRow;bindTimeRemove()}const add=document.getElementById('add-med');if(add)add.onclick=async()=>{const name=document.getElementById('med-name').value.trim(),times=collectTimeInputs();if(!name){alert('Bitte Medikamentenname eingeben.');return}if(!times.length){alert('Bitte mindestens eine Einnahmezeit angeben.');return}await addMed(name,times)};const imp=document.getElementById('import-btn');if(imp)imp.onclick=async()=>{const f=document.getElementById('backup-file').files[0];if(!f){alert('Bitte zuerst eine Sicherungsdatei auswählen.');return}try{await importBackup(f);alert('Import erfolgreich')}catch(e){alert('Import fehlgeschlagen: '+e.message)}};const exp=document.getElementById('export-btn');if(exp)exp.onclick=exportBackup;
  };
  window.PillPlanLongitudinal={timesForDate};
})();