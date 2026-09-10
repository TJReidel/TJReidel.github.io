(function(){
  'use strict';

  function ensureStyles(){
    if(document.getElementById('pp-plan-color-fix-style')) return;
    const s=document.createElement('style');
    s.id='pp-plan-color-fix-style';
    s.textContent=`
      .day.unrated{background:#d9d4cc!important;color:#171513!important;border:1px solid #c9c2b8!important}
      .day.unrated.today{outline:2px solid var(--teal2)!important}
      .day.green{background:var(--teal2)!important;color:#fff!important}
      .day.yellow{background:var(--yellow)!important;color:#2b2418!important}
      .day.red{background:var(--red)!important;color:#fff!important}
    `;
    document.head.appendChild(s);
  }

  function apply(){
    ensureStyles();
    document.querySelectorAll('.day').forEach(el=>{
      const txt=(el.textContent||'').trim();
      const hasRated=el.classList.contains('green')||el.classList.contains('yellow')||el.classList.contains('red');
      if(txt.includes('✓') && !hasRated){
        el.classList.add('unrated');
        el.setAttribute('aria-label',(el.getAttribute('aria-label')||'')+' Nachgetragen, genaue Zeit unbekannt');
      }else if(!txt.includes('✓')){
        el.classList.remove('unrated');
      }
    });
  }

  const obs=new MutationObserver(apply);
  function start(){
    apply();
    const app=document.getElementById('app');
    if(app) obs.observe(app,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('pageshow',apply);
})();
