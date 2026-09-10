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
  async function addMed(name,times,color='#2a7c74'){
    times=normalizeTimes(times); if(!name||!times.length)return;
    const id=Date.now();
    const instructions=(document.getElementById('doctor-instructions')?.value||'').trim();
    const dose=(document.getElementById('med-dose')?.value||'').trim();
    const expiry=document.getElementById('med-expiry')?.value||'';
    await put('meds',{id,name:name.trim(),times,color,startDate:today(),scheduleHistory:[{from:today(),times:[...times]}],doctorInstructions:instructions,dose,expiryDate:expiry});
    view='today'; await baseRender();
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
    await put('meds',m); await baseRender();
  }
  window.addMed=addMed; window.editMed=editMed;

  async function enhance(){
    const app=document.getElementById('app'); if(!app) return;
    const s=await todayStats(), st=await streak(), meds=await all('meds');

    const period=document.getElementById('period');
    if(period && ![...period.options].some(o=>o.value==='21')){
      const opt=document.createElement('option'); opt.value='21'; opt.textContent='3 Wochen';
      period.insertBefore(opt,period.querySelector('option[value="30"]'));
    }

    const content=document.querySelector('.content');
    if(view==='today' && content && !document.getElementById('daily-praise')){
      const p=document.createElement('div'); p.id='daily-praise'; p.className='praise-card'; p.textContent=praiseText(s,st); content.prepend(p);
      const warnings=[];
      meds.forEach(m=>{const d=daysUntil(m.expiryDate); if(d!==null && d<=30){warnings.push(d<0?`⚠️ ${m.name}: MHD überschritten`:`📅 ${m.name}: MHD in ${d} Tagen`);}});
      if(warnings.length){const w=document.createElement('div');w.className='expiry-card';w.innerHTML=warnings.map(x=>`<div>${esc(x)}</div>`).join('');p.after(w);}
      meds.forEach(m=>{
        if(!m.doctorInstructions && !m.dose && !m.expiryDate)return;
        const cards=[...document.querySelectorAll('.dose')];
        const first=cards.find(c=>c.querySelector('.name')?.textContent===m.name);
        if(first && !first.querySelector('.doctor-note')){
          const note=document.createElement('div'); note.className='doctor-note';
          let text=''; if(m.dose) text+=`Dosis: ${m.dose}`; if(m.doctorInstructions) text+=(text?' · ':'')+m.doctorInstructions; if(m.expiryDate) text+=(text?' · ':'')+`MHD ${m.expiryDate}`;
          note.textContent=text; first.querySelector('.grow')?.appendChild(note);
        }
      });
    }

    if(view==='add'){
      const card=document.querySelector('.content .card');
      if(card && !document.getElementById('med-dose')){
        const times=document.getElementById('time-list');
        const wrap=document.createElement('div'); wrap.innerHTML=`
          <div class="small" style="margin-top:12px">Ärztliche Vorgaben</div>
          <input id="med-dose" class="field" placeholder="Dosis / Stärke, z. B. 5 mg">
          <textarea id="doctor-instructions" class="field" rows="3" placeholder="z. B. morgens nüchtern / nach dem Essen / nach ärztlicher Vorgabe"></textarea>
          <div class="small" style="margin-top:10px">MHD / Verfallsdatum</div>
          <input id="med-expiry" class="field" type="date">
          <div class="doctor-disclaimer">Dein Arzt plant — PillPlan erinnert. Änderungen an Dosis oder Einnahme immer mit Arzt/Ärztin oder Apotheke klären.</div>`;
        const addTime=document.getElementById('add-time'); card.insertBefore(wrap,addTime);
      }
    }
  }

  render = async function(){ await baseRender(); await enhance(); };
  window.render=render;
  const style=document.createElement('style');
  style.textContent=`.praise-card{background:#e8f4f3;border:1px solid #c8e4e1;border-radius:18px;padding:14px 16px;margin:8px 0 12px;font-weight:800;color:#315f5a}.expiry-card{background:#fff8e9;border:1px solid #ead4a1;border-radius:16px;padding:12px 14px;margin-bottom:12px;font-weight:700}.doctor-note{font-size:12px;color:#5f5a55;margin-top:6px;line-height:1.35}.doctor-disclaimer{background:#f3efe8;border-radius:14px;padding:12px;margin:10px 0 4px;font-size:13px;line-height:1.4;color:#514b45}textarea.field{resize:vertical;min-height:84px}`;
  document.head.appendChild(style);
  setTimeout(()=>enhance(),250);
})();