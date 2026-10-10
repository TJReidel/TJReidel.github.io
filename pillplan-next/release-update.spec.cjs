const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const crypto=require('node:crypto');
const BASE='a4ad82dc21daa1d4848f0aa670b5fcc8f15a3f54';

test('release update: production baseline to candidate, same origin, offline and code rollback',async({browser},testInfo)=>{
 test.setTimeout(120000);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pillplan-update-'));
 const archive=execFileSync('git',['archive',BASE,'pillplan-next','icon.png','icon-512.png']);
 execFileSync('tar',['-x','-C',temp],{input:archive});
 let root=temp;
 const server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://localhost').pathname;
  if(p.includes('..')){res.writeHead(403).end();return;}
  const file=path.join(root,p,p.endsWith('/')?'index.html':'');
  try{
   const type={'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.json':'application/json'}[path.extname(file)]||'text/plain';
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/pillplan-next/';
 const context=await browser.newContext({locale:'de-DE'});
 const requests=[];
 context.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 let page=await context.newPage();
 page.on('dialog',d=>d.accept());
 async function snapshot(){return page.evaluate(async()=>{
  const db=await new Promise((ok,no)=>{const q=indexedDB.open('pillplan-next-db');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
  const out={version:db.version};
  for(const store of ['meds','events','meta'])out[store]=await new Promise((ok,no)=>{const q=db.transaction(store).objectStore(store).getAll();q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
  db.close();out.localStorage={...localStorage};return out;
 });}
 async function settleWorker(cache){
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;const r=await navigator.serviceWorker.getRegistration();await r.update()});
  await expect.poll(()=>page.evaluate(()=>caches.keys()),{timeout:30000}).toContain(cache);
  await page.reload();await expect(page.locator('.bottom-nav')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 }
 async function exportBackup(){
  await page.locator('[data-v="settings"]').click();
  const wait=page.waitForEvent('download');await page.locator('#export-btn').click();
  const d=await wait;return JSON.parse(fs.readFileSync(await d.path(),'utf8'));
 }
 try{
  await page.goto(url);await expect(page.locator('.bottom-nav')).toBeVisible();
  // Explicitly choose a language: a valid import persists the language in its backup.
  // An inferred browser default is not initially stored by the legacy runtime.
  await page.locator('[data-v="settings"]').click();await page.locator('#language-select').selectOption('de');
  await page.locator('[data-v="add"]').click();await page.locator('#med-name').fill('FICTIONAL_UPDATE_CANARY');
  await page.locator('#med-dose').fill('QA strength');await page.locator('#add-med').click();
  await page.locator('[data-toggle]').first().click();
  await expect(page.locator('.dose-status').first()).toContainText(/Dokumentiert|Documented/);
  await page.locator('[data-toggle]').first().click();
  await expect(page.locator('.dose-status').first()).not.toContainText(/Dokumentiert|Documented/);
  await page.locator('[data-toggle]').first().click();
  await expect(page.locator('.dose-status').first()).toContainText(/Dokumentiert|Documented/);
  await settleWorker('pillplan-next-v25-stable1');
  const before=await snapshot();expect(before.events.length).toBeGreaterThanOrEqual(3);
  const oldBackup=await exportBackup();
  root=process.cwd();
  await page.reload();
  await settleWorker('pillplan-next-v29-privacy-closure');
  const after=await snapshot();expect(after).toEqual(before);expect(after.version).toBe(1);
  const live=await page.evaluate(()=>fetch('/pillplan-next/core-v5.js',{cache:'no-store'}).then(r=>r.text()));
  const expected=fs.readFileSync('pillplan-next/core-v5.js','utf8');expect(live).toBe(expected);
  await page.locator('[data-v="settings"]').click();await expect(page.locator('#report-btn')).toBeVisible();
  await expect(page.locator('#notify-btn')).toHaveCount(0);
  const newBackup=await exportBackup();
  for(const s of ['meds','events','meta'])expect(newBackup[s]).toEqual(oldBackup[s]);
  await page.locator('#backup-file').setInputFiles({name:'fictional-old-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(oldBackup))});
  await page.locator('#import-btn').click();expect(await snapshot()).toEqual(before);
  await page.locator('#backup-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{invalid')});
  await page.locator('#import-btn').click();expect(await snapshot()).toEqual(before);
  await page.reload();await context.setOffline(true);await page.reload();
  await expect(page.locator('.dose-name').first()).toHaveText('FICTIONAL_UPDATE_CANARY QA strength');
  await page.locator('[data-toggle]').first().click();
  await expect(page.locator('.dose-status').first()).not.toContainText(/Dokumentiert|Documented/);
  const offline=await snapshot();expect(offline.events.length).toBe(before.events.length+1);
  await page.close();page=await context.newPage();page.on('dialog',d=>d.accept());await page.goto(url);
  await expect(page.locator('.bottom-nav')).toBeVisible();expect(await snapshot()).toEqual(offline);
  await context.setOffline(false);await page.reload();expect(await snapshot()).toEqual(offline);
  root=temp;await page.reload();await settleWorker('pillplan-next-v25-stable1');
  expect(await snapshot()).toEqual(offline);
  const requestsDuringUpdate=requests.filter(r=>r.url.startsWith(origin));
  expect(requestsDuringUpdate.every(r=>r.method==='GET'&&!r.url.includes('FICTIONAL_UPDATE_CANARY'))).toBe(true);
  await testInfo.attach('update-evidence',{body:JSON.stringify({baseline:BASE,candidate:process.env.CANDIDATE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtimeSha256:crypto.createHash('sha256').update(expected).digest('hex'),before,after,offline,requests:requestsDuringUpdate},null,2),contentType:'application/json'});
 }finally{await context.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});}
});
