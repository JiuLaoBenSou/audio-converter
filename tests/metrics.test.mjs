import test from 'node:test';import assert from 'node:assert/strict';
import worker from '../services/metrics/worker.mjs';
import {createMetricsReporter} from '../src/metrics-client.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {cutoffDay} from '../services/metrics/storage.mjs';
function fixture(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../services/metrics/schema.sql',import.meta.url),'utf8'));return {db,env:{COUNTERS:{prepare(sql){return{bind(...args){return{async run(){return{meta:db.prepare(sql).run(...args)}}}}}}}}};}
const metric=(overrides={})=>({v:1,event:'process_finished',group:'ordinary',outcome:'success',lang:'en',environment:'production',...overrides});
const req=(data,options={})=>new Request('https://metrics.invalid/collect',{method:'POST',headers:{origin:'https://zhuanmp3.com','content-type':'application/json',...options.headers},body:typeof data==='string'?data:JSON.stringify(data)});
test('real SQL increments aggregates atomically, isolates QA and exposes no read endpoint',async()=>{
 const {db,env}=fixture();try{
  for(const data of [metric(),metric(),metric({environment:'test'})])assert.equal((await worker.fetch(req(data),env)).status,204);
  const rows=db.prepare('SELECT environment,count FROM daily_counters ORDER BY environment').all();assert.deepEqual(rows.map(x=>[x.environment,x.count]),[['production',2],['test',1]]);
  const cols=db.prepare('PRAGMA table_info(daily_counters)').all().map(x=>x.name);assert.deepEqual(cols,['day','environment','event','group_name','outcome','language','count']);
  assert.equal((await worker.fetch(new Request('https://metrics.invalid/stats'),env)).status,404);
 }finally{db.close();}
});
test('body size, schema and CORS protections hold before database writes',async()=>{
 const {db,env}=fixture();try{
  assert.equal((await worker.fetch(req('x'.repeat(257)),env)).status,400);
  assert.equal((await worker.fetch(req(metric({outcome:'paid'})),env)).status,400);
  assert.equal((await worker.fetch(req(metric({group:'a-song.wav'})),env)).status,400);
  const preflight=await worker.fetch(new Request('https://metrics.invalid/collect',{method:'OPTIONS',headers:{origin:'https://zhuanmp3.com'}}),env);assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://zhuanmp3.com');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM daily_counters').get().n,0);
 }finally{db.close();}
});
test('daily accepted-event cap stops increments and scheduled cleanup retains the last 90 UTC dates',async()=>{
 const {db,env}=fixture();try{
  await worker.fetch(req(metric()),env);db.exec('UPDATE daily_counters SET count=10000');assert.equal((await worker.fetch(req(metric()),env)).status,429);assert.equal(db.prepare('SELECT count FROM daily_counters').get().count,10000);
  const cutoff=cutoffDay();db.prepare('INSERT INTO daily_counters VALUES(?,?,?,?,?,?,?)').run('2000-01-01','test','zip_failed','none','error','zh',1);db.prepare('INSERT INTO daily_counters VALUES(?,?,?,?,?,?,?)').run(cutoff,'test','zip_failed','none','error','zh',1);
  await worker.scheduled({},env);assert.equal(db.prepare("SELECT COUNT(*) AS n FROM daily_counters WHERE day='2000-01-01'").get().n,0);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM daily_counters WHERE day=?').get(cutoff).n,1);
 }finally{db.close();}
});
test('rejects extra fields and foreign origins without touching storage',async()=>{
 const event={v:1,event:'process_finished',group:'ordinary',outcome:'success',lang:'en',environment:'test'};
 for(const [body,origin,expected]of [[{...event,filename:'private.wav'},'https://zhuanmp3.com',400],[event,'https://foreign.invalid',403]]){const r=await worker.fetch(new Request('https://metrics.invalid/collect',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}),{COUNTERS:{prepare(){throw Error('must not access DB');}}});assert.equal(r.status,expected);assert.doesNotMatch(await r.text(),/private/);}
});
test('disabled and privacy-protected clients never send; a failed request never breaks conversion',async()=>{
 let calls=0;const fetch=async()=>{calls++;throw Error('offline');};
 createMetricsReporter({endpoint:null,fetch}).emit('process_finished','ordinary','success');
 createMetricsReporter({endpoint:'https://metrics.invalid/collect',fetch,doNotTrack:'1'}).emit('process_finished','ordinary','success');
 createMetricsReporter({endpoint:'https://metrics.invalid/collect',fetch,globalPrivacyControl:true}).emit('process_finished','ordinary','success');
 assert.equal(calls,0);
 const client=createMetricsReporter({endpoint:'https://metrics.invalid/collect',fetch,hostname:'zhuanmp3.com',lang:'en'});client.emit('process_finished','ordinary','success');await new Promise(r=>setTimeout(r,0));assert.equal(calls,1);
});
test('client payload contains only the approved fields and local QA defaults to isolated test mode',()=>{
 let call;const client=createMetricsReporter({endpoint:'https://metrics.invalid/collect',hostname:'127.0.0.1',lang:'en',fetch:(...args)=>{call=args;return Promise.resolve(new Response(null,{status:204}));}});client.emit('download_triggered','none','single');assert.ok(call);const options=call[1];assert.deepEqual(JSON.parse(options.body),{v:1,event:'download_triggered',group:'none',outcome:'single',lang:'en',environment:'test'});assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.keepalive,true);
});
