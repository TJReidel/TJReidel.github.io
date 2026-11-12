const {test,expect}=require('@playwright/test');
test.use({locale:'de-DE',timezoneId:'Europe/Berlin',viewport:{width:390,height:844}});
const URL='http://127.0.0.1:8765/pillplan-next/';
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
 await expect(page.locator('[data-earlier]')).toHaveText('Nachtragen');
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
 await expect(page.locator('.dose-status')).toContainText('Dokumentiert');
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
 await expect(page.locator('.dose-status')).toHaveText('Noch nicht bestätigt');
 await page.reload();await expect(page.locator('.dose-status')).toHaveText('Noch nicht bestätigt');
 await page.getByRole('button',{name:/Jetzt eingenommen/}).click();
 await expect(page.locator('.dose-status')).toHaveText('Dokumentiert · eingenommen');
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
 await expect(page.locator('.dose-status')).toHaveText('Noch nicht bestätigt');
 const after=await snapshot(page);expect(after.events).toHaveLength(2);expect(after.events[1].sequence).toBe(2);
 expect(after.events[1].createdAt<after.events[0].createdAt).toBe(true);
 await page.locator('[data-v="settings"]').click();
 const downloadWait=page.waitForEvent('download');await page.locator('#export-btn').click();const download=await downloadWait;
 const fs=require('node:fs'),backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 expect(backup.schema).toBe('pillplan-next-consolidated-v7');
 await page.locator('#backup-file').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 let dialog=page.waitForEvent('dialog');await page.locator('#import-btn').click();await dialog;
 expect(await snapshot(page)).toEqual(after);
 const broken={...backup,events:[{...backup.events[0],actualTimeZone:'INVALID'},backup.events[1]]};
 await page.locator('#backup-file').setInputFiles({name:'corrupt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(broken))});
 dialog=page.waitForEvent('dialog');await page.locator('#import-btn').click();await dialog;
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
