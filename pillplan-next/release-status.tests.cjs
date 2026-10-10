const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),gate=require('./release-gate.json');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pillplan-gate-'));
const prPath=path.join(temp,'pr.json');
function run(result='success',head=sha,base=gate.productionBaseline,draft=true){
 fs.writeFileSync(prPath,JSON.stringify({number:19,state:'open',draft,head:{sha:head},base:{sha:base}}));
 const out=execFileSync(process.execPath,[path.join(__dirname,'release-status.cjs')],{encoding:'utf8',env:{...process.env,CANDIDATE_SHA:sha,PR_STATE_FILE:prPath,REGRESSION_RESULT:result,BROWSER_RESULT:'success',GITHUB_STEP_SUMMARY:''}});
 return JSON.parse(out);
}
try{
 assert.equal(run().technical,'PASS');assert.equal(run().publication,'HOLD');
 for(const r of ['failure','cancelled','skipped',undefined]){
  if(r===undefined)continue;
  assert.equal(run(r).technical,'HOLD');
 }
 assert.equal(run('success','f'.repeat(40)).technical,'HOLD');
 assert.equal(run('success',sha,'f'.repeat(40)).technical,'HOLD');
 assert.equal(run('success',sha,gate.productionBaseline,false).technical,'HOLD');
 console.log('PASS release gate: failed/cancelled/skipped checks, stale PR/base, non-draft and permanent publication HOLD');
}finally{fs.rmSync(temp,{recursive:true,force:true});fs.rmSync('release-evidence',{recursive:true,force:true});}
