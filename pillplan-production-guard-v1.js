// PillPlan production guard v1
// Prevents demo medications from appearing in real installs and adds a safe restore entry point.
(function(global){
  "use strict";
  if(global.__pillplanProductionGuardV1) return;
  global.__pillplanProductionGuardV1=true;

  var KEY="pillplan_v4";
  function isDemoDataset(state){
    if(!state||!Array.isArray(state.meds)||state.meds.length!==2) return false;
    var names=state.meds.map(function(m){return String(m&&m.name||"");}).sort();
    var demoNames=["Lisinopril 10 mg","Metformin 500 mg"].sort();
    if(names[0]!==demoNames[0]||names[1]!==demoNames[1]) return false;
    return !state.taken||Object.keys(state.taken).length===0;
  }

  var hadSaved=false;
  try{ hadSaved=!!localStorage.getItem(KEY); }catch(e){}

  // The legacy core contains sample medications as defaults. In production,
  // a genuinely new install must start empty. Also clean an untouched demo-only
  // dataset if it was accidentally persisted by an earlier build.
  if(global.S && ((!hadSaved && isDemoDataset(global.S)) || (hadSaved && isDemoDataset(global.S)))){
    global.S.meds=[];
    global.S.taken={};
    global.S.screen="today";
    try{ localStorage.removeItem(KEY); }catch(e){}
  }

  function restoreButtonHtml(){
    var de=!global.S||global.S.lang==="de";
    return '<div id="pp-restore-entry" style="margin:18px 0;padding:16px;border:1.5px solid rgba(42,124,116,.25);border-radius:18px;background:#e8f4f3">'+
      '<div style="font-weight:800;margin-bottom:6px;color:#2a7c74">'+(de?'Sicherung wiederherstellen':'Restore backup')+'</div>'+
      '<div style="font-size:13px;line-height:1.45;color:#4a4540;margin-bottom:12px">'+(de?'Vorhandene PillPlan-Sicherung einlesen – Medikamente und dokumentierte Einnahmen werden geprüft, bevor etwas überschrieben wird.':'Import an existing PillPlan backup. Data is validated before anything is replaced.')+'</div>'+
      '<a href="/pillplan-restore.html" style="display:block;text-align:center;text-decoration:none;background:#2a7c74;color:#fff;border-radius:14px;padding:13px 16px;font-weight:800">'+(de?'Backup auswählen':'Choose backup')+'</a></div>';
  }

  function injectRestoreEntry(){
    var main=document.getElementById("main-content");
    if(!main||document.getElementById("pp-restore-entry")) return;
    var shouldShow=(global.S&&global.S.meds&&global.S.meds.length===0)||(global.S&&global.S.screen==="settings");
    if(!shouldShow) return;
    var holder=document.createElement("div");
    holder.innerHTML=restoreButtonHtml();
    var node=holder.firstElementChild;
    if(global.S&&global.S.meds&&global.S.meds.length===0) main.insertBefore(node,main.firstChild);
    else main.appendChild(node);
  }

  var originalRender=global.render;
  if(typeof originalRender==="function"){
    global.render=function(){
      var out=originalRender.apply(this,arguments);
      try{ injectRestoreEntry(); }catch(e){}
      return out;
    };
    global.render();
  }else{
    document.addEventListener("DOMContentLoaded",injectRestoreEntry,{once:true});
  }
})(window);
