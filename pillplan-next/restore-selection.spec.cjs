const {test,expect}=require('@playwright/test');
test.use({locale:'de-DE',timezoneId:'Europe/Berlin',viewport:{width:390,height:844}});
test('restore selector remains accessible; exact safety file and unchanged records are required',async({page})=>{
 page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/pillplan-next/');
 await page.evaluate(async()=>{await put('meds',{id:1,name:'SYNTHETIC CURRENT',times:['08:00'],startDate:today()});await render()});
 const before=await page.evaluate(()=>backupSnapshot());
 const incoming={schema:'pillplan-next-consolidated-v7',meds:[{id:2,name:'SYNTHETIC RESTORED',times:['08:00'],startDate:'2026-01-01'}],events:[],meta:[]};
 await page.locator('[data-v="settings"]').click();await expect(page.locator('#backup-file')).toBeVisible();
 const choose=async()=>{await page.locator('#backup-file').setInputFiles({name:'incoming.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});await page.locator('#import-btn').click();await expect(page.locator('#pp-safety-file')).toBeVisible()};
 await choose();await expect(page.locator('#pp-safety-file')).toBeEnabled();await expect(page.locator('#pp-safety-replace')).toBeDisabled();
 // A selectable control does not authorize overwriting: the target is not the safety file.
 await page.locator('#pp-safety-file').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
 await page.locator('#pp-safety-replace').click();await expect(page.locator('#pp-safety-message')).toContainText('entspricht nicht');expect(await page.evaluate(()=>backupSnapshot())).toEqual(before);
 const wait=page.waitForEvent('download');await page.locator('#pp-safety-export').click();const saved=await wait;const path=await saved.path();
 // Switching out of the view must not disable the selector.
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect(page.locator('#pp-safety-file')).toBeEnabled();
 await page.locator('#pp-safety-cancel').click();await choose();
 await page.locator('#pp-safety-file').setInputFiles(path);await page.locator('#pp-safety-replace').click();
 await expect(page.locator('#pp-safety-message')).toContainText('entspricht nicht');expect(await page.evaluate(()=>backupSnapshot())).toEqual(before);
 const next=page.waitForEvent('download');await page.locator('#pp-safety-export').click();const fresh=await next;
 await page.locator('#pp-safety-file').setInputFiles(await fresh.path());await page.locator('#pp-safety-replace').click();await expect(page.locator('#pp-modal')).toHaveCount(0);
 expect(await page.evaluate(()=>backupSnapshot())).toEqual({meds:incoming.meds,events:[],meta:[]});await page.reload();expect((await page.evaluate(()=>backupSnapshot())).meds).toEqual(incoming.meds);
});
