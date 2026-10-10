'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let src=fs.readFileSync(path.join(__dirname,'core-v5.js'),'utf8');src=src.slice(0,src.lastIndexOf('applyLang();openDB()'));
const ctx=vm.createContext({console,Date,Intl,crypto:require('node:crypto').webcrypto,navigator:{language:'de'},window:{},document:{documentElement:{}},localStorage:{getItem:()=>null,setItem(){}},indexedDB:{}});
vm.runInContext(src,ctx);
function prepare(obj){ctx.input=obj;return vm.runInContext('prepareBackup(input)',ctx)}
const valid={meds:[{id:1,name:'Test',times:['08:00']}],events:[{eventId:'e1',slot:'2026-10-10_1_08:00',type:'taken'}],meta:[{key:'timeZone',value:'Europe/Berlin'}]};
assert.equal(prepare(valid).meds.length,1);
for(const corrupt of [
 {meds:[{id:1,name:'',times:['08:00']}],events:[]},
 {meds:[{id:1,name:'Test',times:['99:99']}],events:[]},
 {meds:[{id:1,name:'A',times:[]},{id:1,name:'B',times:[]}],events:[]},
 {meds:[],events:[{eventId:'e1',slot:'x',type:'taken'},{eventId:'e1',slot:'y',type:'taken'}]},
 {meds:[],events:[],meta:[{}]},
 {meds:[],events:'invalid'}
])assert.throws(()=>prepare(corrupt));
let stores={meds:[{id:999,name:'EXISTING'}],events:[],meta:[]};
let transactions=0;
ctx.db={transaction(names,mode){assert.equal(mode,'readwrite');transactions++;const before=structuredClone(stores),next=structuredClone(stores);const t={objectStore(n){return{clear(){next[n]=[]},put(item){next[n].push(item)}}}};queueMicrotask(()=>{stores=next;t.oncomplete?.()});return t}};
ctx.fakeFile={text:async()=>JSON.stringify(valid)};
ctx.applyLang=()=>{};ctx.render=async()=>{};
(async()=>{
 await vm.runInContext('importBackup(fakeFile)',ctx);
 assert.equal(transactions,1);
 assert.equal(stores.meds[0].name,'Test');
 const snapshot=JSON.stringify(stores);
 ctx.fakeFile={text:async()=>JSON.stringify({meds:[{id:1,name:'Broken',times:['88:88']}],events:[]})};
 await assert.rejects(vm.runInContext('importBackup(fakeFile)',ctx));
 assert.equal(JSON.stringify(stores),snapshot);
 assert.equal(transactions,1);
 console.log('PASS backup validation, duplicate keys, single transaction, malformed data retains records');
})().catch(e=>{console.error(e);process.exitCode=1});
