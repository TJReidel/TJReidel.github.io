'use strict';
// Run: node pillplan-next/medication-report.tests.cjs
// Tests real runtime functions with synthetic data; never opens a user database.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(relative) {
  let source = fs.readFileSync(path.join(root, relative), 'utf8');
  source = source.slice(0, source.lastIndexOf('applyLang();openDB()'));
  const settings = new Map([['pillplan_lang', 'de'], ['pillplan_timezone', 'Europe/Berlin']]);
  const context = vm.createContext({
    console, Date, Intl, crypto: require('node:crypto').webcrypto,
    navigator: {language: 'de'}, window: {}, document: {documentElement: {}},
    localStorage: {getItem: k => settings.get(k) || null, setItem: (k,v) => settings.set(k,v)},
  });
  vm.runInContext(source, context);
  vm.runInContext("today=()=> '2026-10-08';", context);
  return {context, settings, source};
}
function fixture(context, meds, events) {
  context.fixtureMeds = meds; context.fixtureEvents = events;
  vm.runInContext("all=async s=>s==='meds'?fixtureMeds:s==='events'?fixtureEvents:[]", context);
}
const json = x => JSON.parse(JSON.stringify(x));
async function run() {
  for (const runtime of ['pillplan-next/core-v5.js','pillplan-preview-pdf/core-v5.js']) {
    const {context:c,settings,source} = load(runtime);
    const med = {id:1,name:'Test <A>',dose:'5 mg',doctorInstructions:'mit Essen',expiryDate:'2027-01-01',startDate:'2026-09-01',times:['08:00']};
    const events = [
      {slot:'2026-10-08_1_08:00',type:'taken',tier:'green',createdAt:'2026-10-08T06:00:00Z'},
      {slot:'2026-10-07_1_08:00',type:'taken',tier:'yellow',createdAt:'2026-10-07T06:30:00Z'},
      {slot:'2026-10-06_1_08:00',type:'taken',tier:'red',createdAt:'2026-10-06T06:45:00Z'},
      {slot:'2026-10-05_1_08:00',type:'taken',tier:'unrated',createdAt:'2026-10-05T10:00:00Z'},
      {slot:'2026-10-04_1_08:00',type:'taken',tier:'green',createdAt:'2026-10-04T06:00:00Z'},
      {slot:'2026-10-04_1_08:00',type:'undo',createdAt:'2026-10-04T07:00:00Z'},
    ];
    fixture(c,[med],events.slice().reverse());
    for(const n of [7,14,21,30]) {
      const r = await vm.runInContext(`buildMedicationReport(${n})`,c);
      assert.equal(r.dayRows.length,n); assert.equal(r.stats.due,n);
      assert.equal(r.stats.done,4); assert.equal(r.stats.open,n-4);
      assert.equal(r.stats.pct,Math.round(400/n));
      for(const tier of ['green','yellow','red','unrated'])assert.equal(r.stats[tier],1);
      c.reportFixture=r;
      const html = vm.runInContext('reportHTML(reportFixture)',c);
      assert.ok(html.includes('Test &lt;A&gt;')); assert.ok(!html.includes('Test <A>'));
      assert.ok(html.includes('5 mg') && html.includes('mit Essen') && html.includes('01.01.2027'));
      let output='';
      c.window.open=()=>({document:{open(){},write(x){output=x},close(){}},focus(){}});
      vm.runInContext('openPrintableReport(reportFixture)',c);
      assert.ok(output.includes(html),'print includes the exact preview report');
    }
    const historic={...med,endDate:'2026-10-06',times:[],scheduleHistory:[{from:'2026-09-01',times:['08:00']},{from:'2026-10-05',times:['08:00','20:00']},{from:'2026-10-07',times:[]}]};
    fixture(c,[historic],[]);
    let r=await vm.runInContext('buildMedicationReport(7)',c);
    assert.equal(r.stats.due,7); assert.ok(r.dayRows.every(x=>x.date<='2026-10-06'));
    assert.deepEqual(json(r.medicationRows[0].times),['08:00','20:00']);
    fixture(c,[{...med,startDate:'2026-10-06'}],[]);
    r=await vm.runInContext('buildMedicationReport(30)',c); assert.equal(r.stats.due,3);
    fixture(c,[],[]);r=await vm.runInContext('buildMedicationReport(7)',c);
    assert.equal(r.stats.pct,0);assert.equal(r.dayRows.length,0);
    for(const [minute,tier] of [[29,'green'],[30,'yellow'],[44,'yellow'],[45,'red']]) {
      c.clock={getHours:()=>8,getMinutes:()=>minute};
      assert.equal(vm.runInContext("computeTier('08:00',clock)",c),tier);
    }
    // Report generation has no write path and retains existing storage schema.
    assert.equal(vm.runInContext('DB_VERSION',c),1);
    if(runtime.includes('preview')) {
      assert.equal(vm.runInContext('DB_NAME',c),'pillplan-preview-pdf-db');
      assert.equal(settings.get('pillplan_lang'),'de');assert.equal(settings.get('pillplan_timezone'),'Europe/Berlin');
      assert.ok(!/localStorage\.(?:getItem|setItem)\('pillplan_(?:lang|timezone)'/.test(source));
      assert.ok(!source.includes("register('/pillplan-next/sw.js'"));
    } else assert.equal(vm.runInContext('DB_NAME',c),'pillplan-next-db');
    console.log('PASS report periods, states, undo, history, end/start, escaping, output equality, tier boundaries, storage:',runtime);
  }
}
run().catch(e=>{console.error(e);process.exitCode=1;});
