const {test,expect}=require('@playwright/test');
test.use({locale:'de-DE',timezoneId:'Europe/Berlin',viewport:{width:390,height:844}});
const URL='http://127.0.0.1:8765/pillplan-next/';
test('historical calendar colours retained without rewriting records or rating late documentation',async({page},testInfo)=>{
 await page.goto(URL);await expect(page.locator('.bottom-nav')).toBeVisible();
 const before=await page.evaluate(async()=>{
  const d=today(),start=addDays(d,-3),m={id:42,name:'SYNTHETIC COLOUR QA',times:['08:00'],startDate:start};
  const events=['green','yellow','red'].map((tier,i)=>({eventId:'legacy-'+i,slot:slotKey(42,addDays(d,i-3),'08:00'),type:'taken',tier,createdAt:new Date().toISOString()}));
  const date=d,stamp=new Date().toISOString();events.push({eventId:'new',slot:slotKey(42,date,'08:00'),type:'taken',tier:'red',documentationVersion:2,sequence:1,plannedAtLocal:date+'T08:00',createdAt:stamp,documentedAt:stamp,actualTakenAt:null,actualTakenLocal:date+'T08:00',planTimeZone:deviceTimeZone(),actualTimeZone:deviceTimeZone(),actualTimeSource:'reported'});
  const backup={meds:[m],events,meta:[]};await importBackup({text:async()=>JSON.stringify(backup)});return await all('events');
 });
 await page.locator('[data-v="plan"]').click();
 const dates=await page.evaluate(()=>[-3,-2,-1,0].map(i=>addDays(today(),i)));
 for(const [i,cls] of ['done','tier-yellow','tier-red','done'].entries())await expect(page.locator(`[data-day="${dates[i]}"]`)).toHaveClass(new RegExp(cls));
 await page.locator('.status-legend summary').click();await expect(page.locator('.status-legend')).toContainText('Historische Zeitbewertung');
 await page.screenshot({path:testInfo.outputPath('historical-colours.png'),fullPage:true});
 expect(await page.evaluate(()=>all('events'))).toEqual(before);
});
async function snapshot(page){return page.evaluate(async()=>({meds:await all('meds'),events:(await all('events')).sort(compareEvents),meta:await all('meta')}))}
async function create(page,name='SYNTHETIC TIME QA'){
 await page.goto(URL);await page.locator('[data-v="add"]').click();await page.locator('#med-name').fill(name);await page.locator('#add-med').click();
 await expect(page.locator('.dose-name')).toHaveText(name);
}

test('reported intake at 08:00, recorded at 10:00; unknown time, explicit statuses and offline correction',async({page,context},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.clock.install({time:new Date('2026-11-12T09:00:00Z')});
 await create(page);
 await expect(page.getByRole('button',{name:/Jetzt eingenommen/})).toBeVisible();
 await expect(page.locator('[data-earlier]')).toHaveText('Bereits eingenommen');
 await expect(page.locator('[data-toggle]')).toHaveCount(1);
 await page.screenshot({path:testInfo.outputPath('today-open-390px.png'),fullPage:true});
 await page.locator('[data-earlier]').click();
 await expect(page.locator('#pp-actual-time')).toBeVisible();
 await expect(page.locator('#pp-corr-state')).not.toBeVisible();
 await expect(page.locator('#pp-corr-note')).not.toBeVisible();
 await expect(page.locator('#pp-actual-date')).not.toBeVisible();
 await expect(page.locator('#pp-actual-time')).toHaveValue('');
 await page.locator('#pp-actual-time').fill('08:00');
 await page.screenshot({path:testInfo.outputPath('backfill-390px.png'),fullPage:true});
 await page.locator('#pp-corr-save').click();
 await expect(page.locator('#pp-modal')).toHaveCount(0);
 await expect(page.locator('.dose-status')).toContainText('Eingenommen zur Planzeit');
 await expect(page.locator('.dose-card')).toHaveClass(/done/);
 await expect(page.locator('.dose-body')).toContainText('Eintrag gespeichert am');
 await expect(page.locator('[data-toggle]')).toHaveCount(0);
 await expect(page.locator('[data-earlier]')).toHaveText('Angabe ändern');
 await expect(page.locator('.dose-status')).not.toContainText(/verspätet|Zeit eingehalten/);
 const saved=await snapshot(page),first=saved.events[0];
 expect(first.actualTakenLocal).toBe('2026-11-12T08:00');expect(first.actualTakenAt).toBe(null);
 expect(first.documentedAt.slice(0,16)).toBe('2026-11-12T09:00');
 expect(first.plannedAtLocal).toBe('2026-11-12T08:00');
 expect(first.planTimeZone).toBe('Europe/Berlin');expect(first.actualTimeSource).toBe('reported');
 await page.locator('[data-v="settings"]').click();await page.locator('#report-btn').click();
 const text=await page.locator('#pp-report-sheet').innerText();
 expect(text).toContain('08:00');expect(text).toContain('10:00');expect(text).toContain('keine Messung der Therapietreue');
 await page.locator('#pp-report-close').click();await page.locator('[data-v="today"]').click();
 await page.locator('[data-earlier]').click();await page.locator('#pp-actual-time').fill('');await page.locator('#pp-corr-save').click();
 await expect(page.locator('.dose-status')).toContainText('Einnahmezeit unbekannt');
 let rows=(await snapshot(page)).events;expect(rows).toHaveLength(2);expect(rows[1].supersedesEventId).toBe(first.eventId);
 await page.locator('[data-earlier]').click();await page.locator('#pp-more-details summary').click();await page.locator('#pp-corr-state').selectOption('unknown');await page.locator('#pp-corr-save').click();
 await expect(page.locator('.dose-status')).toContainText('Unsicher');
 await expect(page.locator('[data-toggle]')).toHaveCount(0);
 await expect(page.locator('[data-earlier]')).toHaveText('Angabe ändern');
 await page.locator('[data-earlier]').click();await page.locator('#pp-corr-state').selectOption('not_taken');await page.locator('#pp-corr-save').click();
 await expect(page.locator('.dose-status')).toContainText('Nicht eingenommen');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();
 await page.locator('[data-earlier]').click();await page.locator('#pp-corr-state').selectOption('undo');await page.locator('#pp-corr-save').click();
 await expect(page.locator('.dose-status')).toHaveText(/^(Fällig · noch nicht bestätigt|Noch nicht fällig)$/);
 await page.reload();await expect(page.locator('.dose-status')).toHaveText(/^(Fällig · noch nicht bestätigt|Noch nicht fällig)$/);
 await page.getByRole('button',{name:/Jetzt eingenommen/}).click();
 await expect(page.locator('.dose-status')).toContainText('120 Min. nach Planzeit');
 rows=(await snapshot(page)).events;expect(rows).toHaveLength(6);expect(rows[5].actualTimeSource).toBe('now');
 expect(Math.abs(Date.parse(rows[5].actualTakenAt)-Date.parse(rows[5].documentedAt))).toBeLessThan(2000);
 await page.screenshot({path:testInfo.outputPath('documentation-390px.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);await context.setOffline(false);
});

test('concurrent writes, failed transaction, clock rollback and safe backup roundtrip',async({page})=>{
 page.on('dialog',d=>d.accept());await create(page,'SYNTHETIC INTEGRITY QA');
 // Atomic compare-and-append prevents two tabs from confirming the same observed slot twice.
 const writes=await page.evaluate(async()=>{
  const m=(await all('meds'))[0],d=today(),t=m.times[0],details=actualDetails('now',null,deviceTimeZone());
  return (await Promise.allSettled([appendDocumentation(m.id,d,t,'taken',details,null),appendDocumentation(m.id,d,t,'taken',details,null)])).map(x=>x.status);
 });
 expect(writes.sort()).toEqual(['fulfilled','rejected']);
 const before=await snapshot(page);expect(before.events).toHaveLength(1);
 const failed=await page.evaluate(async()=>{
  const m=(await all('meds'))[0],e=(await all('events'))[0];
  try{await appendDocumentation(m.id,today(),m.times[0],'undo',{...actualDetails('unknown'),note:()=>{}},e.eventId);return false}catch{return true}
 });
 expect(failed).toBe(true);expect(await snapshot(page)).toEqual(before);
 await page.clock.install({time:new Date(Date.now()-3600000)});
 await page.evaluate(async()=>{const m=(await all('meds'))[0],e=(await all('events'))[0];await appendDocumentation(m.id,today(),m.times[0],'undo',actualDetails('unknown'),e.eventId);await render()});
 await expect(page.locator('.dose-status')).toHaveText(/^(Fällig · noch nicht bestätigt|Noch nicht fällig)$/);
 const after=await snapshot(page);expect(after.events).toHaveLength(2);expect(after.events[1].sequence).toBe(2);
 expect(after.events[1].createdAt<after.events[0].createdAt).toBe(true);
 await page.locator('[data-v="settings"]').click();
 const downloadWait=page.waitForEvent('download');await page.locator('#export-btn').click();const download=await downloadWait;
 const fs=require('node:fs'),backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 expect(backup.schema).toBe('pillplan-next-consolidated-v7');
 await page.locator('#backup-file').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 await page.locator('#import-btn').click();await expect(page.locator('#pp-safety-replace')).toBeDisabled();
 const safeWait=page.waitForEvent('download');await page.locator('#pp-safety-export').click();const safe=await safeWait;
 await page.locator('#pp-safety-file').setInputFiles(await safe.path());await page.locator('#pp-safety-replace').click();await expect(page.locator('#pp-modal')).toHaveCount(0);
 expect(await snapshot(page)).toEqual(after);
 const broken={...backup,events:[{...backup.events[0],actualTimeZone:'INVALID'},backup.events[1]]};
 await page.locator('#backup-file').setInputFiles({name:'corrupt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(broken))});
 const dialog=page.waitForEvent('dialog');await page.locator('#import-btn').click();await dialog;
 expect(await snapshot(page)).toEqual(after);
});

test('first installation can reopen offline without an extra online reload',async({page,context})=>{
 await create(page,'SYNTHETIC COLD OFFLINE');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator('.dose-name')).toHaveText('SYNTHETIC COLD OFFLINE');
 await expect(page.locator('.bottom-nav')).toBeVisible();
 expect(await page.locator('.dose-card').evaluate(e=>getComputedStyle(e).display)).toBe('flex');
 await context.setOffline(false);
});

test('WP03 upcoming versus unconfirmed, explicit states and legacy label consistency',async({page})=>{
 await page.clock.install({time:new Date('2026-11-12T09:00:00Z')});
 await page.goto('http://127.0.0.1:8765/pillplan-next/');await expect(page.locator('.bottom-nav')).toBeVisible();
 await page.evaluate(async()=>{
  const d=today(),zone=deviceTimeZone();localStorage.setItem('pillplan_timezone',zone);
  const current=localInZone(new Date(),zone);
  const future=current.slice(11,16)<'23:59'?'23:59':'23:58';
  const meds=[{id:71,name:'QA FUTURE',times:[future],startDate:d},{id:72,name:'QA OPEN',times:['00:00'],startDate:d},{id:73,name:'QA NOT TAKEN',times:['00:00'],startDate:d},{id:74,name:'QA UNKNOWN',times:['00:00'],startDate:d},{id:75,name:'QA LEGACY',times:['00:00'],startDate:d}];
  const events=[['not_taken',73],['unknown',74],['taken',75]].map(([type,id])=>({eventId:'qa-'+id,slot:slotKey(id,d,'00:00'),type,tier:'red',createdAt:new Date().toISOString()}));
  await importBackup({text:async()=>JSON.stringify({meds,events,meta:[]})});
 });
 const cards=page.locator('.dose-card');
 await expect(cards.filter({hasText:'QA FUTURE'})).toContainText(/Noch nicht fällig|Not due yet/);
 await expect(cards.filter({hasText:'QA OPEN'})).toContainText(/nicht bestätigt|not confirmed/i);
 await expect(cards.filter({hasText:'QA NOT TAKEN'})).toContainText(/Nicht eingenommen|Not taken/);
 await page.locator('[data-v="plan"]').click();
 await expect(page.locator('[data-mid="73"].today .day-ico')).toHaveText('×');
 await expect(page.locator('[data-mid="74"].today .day-ico')).toHaveText('?');
 await expect(page.locator('[data-mid="71"].today .day-ico')).toHaveText('◷');
 await page.locator('[data-v="settings"]').click();await page.locator('#report-btn').click();
 await expect(page.locator('#pp-report-sheet')).toContainText(/Noch nicht fällig|Not due yet/);
 await expect(page.locator('#pp-report-sheet .pp-report-status.red')).toContainText(/Einnahmezeit unbekannt|intake time unknown/);
});

test('WP03 stable due status, travel state and legend/focus retained',async({page})=>{
 await page.clock.install({time:new Date('2026-11-12T07:00:00Z')});
 await page.goto(URL);await expect(page.locator('.bottom-nav')).toBeVisible();
 await page.evaluate(async()=>{const d=today();await importBackup({text:async()=>JSON.stringify({meds:[{id:81,name:'SYNTHETIC TIME',times:['08:00'],startDate:addDays(d,-1)}],events:[],meta:[]})})});
 await expect(page.locator('.dose-status')).toHaveText('Fällig · noch nicht bestätigt');
 await page.clock.fastForward(61000);await expect(page.locator('.dose-status')).toHaveText('Fällig · noch nicht bestätigt');
 await page.locator('[data-v="plan"]').click();await page.locator('.status-legend summary').click();
 await page.locator('.status-legend summary').focus();
 await page.clock.fastForward(61000);
 await expect(page.locator('.status-legend')).toHaveAttribute('open','');
 await expect(page.locator('.status-legend summary')).toBeFocused();
 await page.evaluate(async()=>{localStorage.setItem('pillplan_timezone','UTC');await render()});
 await expect(page.locator('[data-mid="81"].today .day-ico')).toHaveText('↔');
 const yesterday=await page.evaluate(()=>addDays(today(),-1));
 await expect(page.locator('[data-mid="81"][data-day="'+yesterday+'"] .day-ico')).toHaveText('○');
 await page.locator('[data-v="settings"]').click();await page.locator('#report-btn').click();
 await expect(page.locator('#pp-report-sheet .pp-report-meta').first()).toContainText(/2026-11-12 07:0[2-9]/);
});
