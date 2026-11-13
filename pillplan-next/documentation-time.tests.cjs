'use strict';
// Synthetic data only. No network, no user database and no personal backup fixture.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let source=fs.readFileSync(path.join(__dirname,'core-v5.js'),'utf8');
source=source.slice(0,source.lastIndexOf('applyLang();openDB()'));
const c=vm.createContext({console,Date,Intl,crypto:require('node:crypto').webcrypto,navigator:{language:'de'},window:{},document:{documentElement:{}},localStorage:{getItem:k=>k==='pillplan_lang'?'de':k==='pillplan_timezone'?'Europe/Berlin':null,setItem(){}}});
vm.runInContext(source,c);
const run=x=>vm.runInContext(x,c);
const json=x=>JSON.parse(JSON.stringify(x));
c.clock=new Date('2026-11-12T09:00:00Z'); // 10:00 Europe/Berlin
const now=run("actualDetails('now',null,'Europe/Berlin',clock)");
assert.equal(now.actualTakenAt,'2026-11-12T09:00:00.000Z');
assert.equal(now.actualTakenLocal,'2026-11-12T10:00');
const earlier=run("actualDetails('reported','2026-11-12T08:00','Europe/Berlin',clock)");
assert.equal(earlier.actualTakenLocal,'2026-11-12T08:00');
assert.equal(earlier.actualTakenAt,null,'a reported wall time must not invent an exact instant');
assert.equal(earlier.actualTimeSource,'reported');
assert.deepEqual(json(run("actualDetails('unknown')")),{actualTakenAt:null,actualTakenLocal:null,actualTimeZone:null,actualTimeSource:'unknown'});
for(const date of ['', '2026-02-30T08:00', '2026-11-12T25:00','2026-11-12T10:01']){
 c.local=date;assert.throws(()=>run("actualDetails('reported',local,'Europe/Berlin',clock)"));
}
assert.throws(()=>run("actualDetails('reported','2026-11-12T08:00','not/a-zone',clock)"));
assert.equal(run("actualDetails('reported','2026-10-25T02:30','Europe/Berlin',clock).actualTakenAt"),null,'DST overlap remains a patient-reported wall time');
// Legacy colours and createdAt can never be promoted into actual intake time.
for(const tier of ['green','yellow','red','unrated']){
 c.e={type:'taken',tier,createdAt:'2026-11-12T09:00:00Z'};
 assert.equal(run('eventTier(e)'),'unrated');assert.equal(run('actualTimeText(e)'),'Zeit unbekannt');
 assert.equal(run('visualTier(e)'),tier);
 assert.ok(!run('statusText(e)').includes('verspätet'));
}
assert.equal(run('eventTier(null)'),'open');
c.e={type:'taken',legacy:true,createdAt:'2026-11-12T09:00:00Z'};
assert.equal(run('recordedTimeText(e)'),'Zeit unbekannt','legacy-import timestamps may be reconstructed and are not asserted recording times');
c.e={type:'undo'};assert.equal(run('eventTier(e)'),'open');
c.e={type:'not_taken'};assert.equal(run('eventTier(e)'),'not_taken');
c.e={type:'unknown'};assert.equal(run('eventTier(e)'),'unknown');
// Sequence outranks a device clock moving backwards; a new undo supersedes old green.
c.rows=[{eventId:'old',slot:'s',type:'taken',createdAt:'2099-01-01T00:00:00Z'},
 {eventId:'one',slot:'s',type:'taken',createdAt:'2026-11-12T09:00:00Z',sequence:1},
 {eventId:'two',slot:'s',type:'undo',createdAt:'2026-11-12T08:00:00Z',sequence:2}];
run("all=async()=>rows");
(async()=>{
 assert.equal((await run('latestEvents()')).s.type,'undo');
 c.med={id:1,name:'SYNTHETIC',times:['08:00'],startDate:'2026-11-12',scheduleHistory:[{from:'2026-11-12',times:['08:00']}]};
 c.rows=[{eventId:'e1',slot:'2026-11-12_1_08:00',type:'taken',tier:'unrated',documentationVersion:2,sequence:1,
  ...json(earlier),plannedAtLocal:'2026-11-12T08:00',planTimeZone:'Europe/Berlin',timeZone:'Europe/Berlin',createdAt:'2026-11-12T09:00:00Z',documentedAt:'2026-11-12T09:00:00Z'}];
 run("all=async store=>store==='meds'?[med]:store==='events'?rows:[];today=()=> '2026-11-12'");
 const r=await run('buildMedicationReport(7)');
 assert.equal(r.stats.green,1);assert.equal(r.stats.done,1);
 assert.ok(r.dayRows[0].actualTime.includes('08:00'));
 assert.ok(r.dayRows[0].recordedTime.includes('10:00'));
 c.r=r;const html=run('reportHTML(r)');
 assert.ok(html.includes('08:00'));assert.ok(html.includes('10:00'));assert.ok(!html.includes('verspätet'));
 assert.ok(html.includes('keine Messung der Therapietreue'));
 c.backup={meds:[c.med],events:c.rows,meta:[]};
 assert.equal(run('prepareBackup(backup).events[0].actualTakenLocal'),'2026-11-12T08:00');
 for(const changes of [{actualTakenLocal:'2026-02-30T08:00'},{actualTimeZone:'invalid'},{sequence:-1},{actualTimeSource:'guessed'},{documentedAt:'invalid'}]){
  c.invalid={...c.backup,events:[{...c.rows[0],...changes}]};assert.throws(()=>run('prepareBackup(invalid)'));
 }
 assert.equal(run('DB_VERSION'),1);
 console.log('PASS separated planned/reported/recorded times; legacy unknown; explicit statuses; clock rollback; report and backup semantics');
})().catch(e=>{console.error(e);process.exitCode=1});
