/* PillPlan interaction core — delegated navigation and primary controls.
   Purpose: keep controls responsive across Safari/PWA rerenders without rebinding fragile per-node handlers. */
(function(){
  'use strict';
  if(window.__pillplanInteractionCore) return;
  window.__pillplanInteractionCore=true;

  async function go(v){
    if(!v) return;
    window.view=v;
    try{ view=v; }catch(_e){}
    if(typeof window.render==='function') await window.render();
    else if(typeof render==='function') await render();
  }

  document.addEventListener('click',async function(e){
    const nav=e.target.closest('[data-v]');
    if(nav){
      e.preventDefault(); e.stopPropagation();
      await go(nav.dataset.v);
      return;
    }

    const edit=e.target.closest('[data-edit]');
    if(edit){
      e.preventDefault(); e.stopPropagation();
      const id=Number(edit.dataset.edit);
      if(typeof window.editMed==='function') await window.editMed(id);
      return;
    }

    const remove=e.target.closest('[data-remove]');
    if(remove){
      e.preventDefault(); e.stopPropagation();
      const id=Number(remove.dataset.remove);
      if(typeof window.removeMed==='function') await window.removeMed(id);
      return;
    }

    const toggleBtn=e.target.closest('[data-toggle]');
    if(toggleBtn){
      e.preventDefault(); e.stopPropagation();
      const id=Number(toggleBtn.dataset.toggle);
      const time=toggleBtn.dataset.time;
      if(typeof window.toggle==='function') await window.toggle(id,(typeof today==='function'?today():new Date().toISOString().slice(0,10)),time);
      return;
    }
  },true);

  document.addEventListener('change',async function(e){
    if(e.target && e.target.id==='period'){
      const val=Number(e.target.value);
      try{ period=val; }catch(_e){}
      if(typeof window.render==='function') await window.render();
      else if(typeof render==='function') await render();
    }
  },true);
})();
