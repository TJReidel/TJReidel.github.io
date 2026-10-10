'use strict';
const fs=require('node:fs'),cp=require('node:child_process');
const gate=require('./release-gate.json');
const runtimePaths=['pillplan-next/index.html','pillplan-next/core-v5.js','pillplan-next/sw.js','pillplan-next/design-master-v4.css','pillplan-next/design-master.css','pillplan-next/manifest.json','icon.png','icon-512.png'];
const sha=process.env.CANDIDATE_SHA;
if(!/^[a-f0-9]{40}$/.test(sha||''))throw new Error('Missing exact candidate SHA');
const checked=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sha!==checked)throw new Error('Candidate does not match checked out code');
const results={regression:process.env.REGRESSION_RESULT,browser:process.env.BROWSER_RESULT};
const map=x=>x==='success'?'PASS':x==='failure'?'FAIL':x==='cancelled'?'BLOCKED':'NOT TESTED';
const tests=Object.fromEntries(Object.entries(results).map(([k,v])=>[k,map(v)]));
const pr=JSON.parse(fs.readFileSync(process.env.PR_STATE_FILE||'release-pr-state.json','utf8'));
const current=pr.number===19&&pr.head.sha===sha&&pr.base.sha===gate.productionBaseline&&pr.state==='open'&&pr.draft===true;
const runtimeUnchanged=cp.execFileSync('git',['diff','--name-only',gate.runtimeReference,sha,'--',...runtimePaths],{encoding:'utf8'}).trim()==='';
const technical=Object.values(tests).every(x=>x==='PASS')&&current?'PASS':'HOLD';
const status={candidate:sha,base:pr.base.sha,baseline:gate.productionBaseline,pr:19,run:process.env.RUN_URL,
 tests,identity:current?'PASS':'BLOCKED',runtimeUnchangedSinceReference:runtimeUnchanged,
 technical,deviceEvidence:gate.deviceEvidence,privacy:gate.privacy,publication:'HOLD',
 protectedOrigin:gate.protectedOrigin,protectedSiteId:gate.protectedSiteId,
 blockers:[...gate.blockers,...(current?[]:['PR draft, candidate or production baseline changed; reverify']),...(technical==='PASS'?[]:['Required technical checks not green'])],
 preview:technical==='PASS'?(runtimeUnchanged?'NOT REQUIRED: app runtime unchanged':'READY FOR ISOLATED DEPLOYMENT'):'BLOCKED',
 nextAction:technical==='PASS'?gate.nextAction:'Inspect the failed or blocked CI check; do not deploy'};
fs.mkdirSync('release-evidence',{recursive:true});
fs.writeFileSync('release-evidence/release-status.json',JSON.stringify(status,null,2)+'\n');
const summary=`# PillPlan release gate\n\nCandidate: \`${sha}\`\n\n| Check | Status |\n| --- | --- |\n${Object.entries(tests).map(([k,v])=>`| ${k} | ${v} |`).join('\n')}\n| PR / baseline identity | ${status.identity} |\n| Technical readiness | ${technical} |\n| Privacy | ${gate.privacy} |\n| Publication | HOLD |\n\nPreview: ${status.preview}\n\nHistorical iPhone results retain their original commit; no new device PASS is inferred.\n\nNext action: ${status.nextAction}\n\nNo merge, production deployment, or access to personal browser data is performed.\n`;
fs.writeFileSync('release-evidence/release-status.md',summary);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
console.log(JSON.stringify({candidate:sha,technical,publication:'HOLD',preview:status.preview}));
