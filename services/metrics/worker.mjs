import {validMetric} from '../../src/metrics-client.mjs';
import {INCREMENT_SQL,cutoffDay,PRUNE_SQL} from './storage.mjs';
const headers=origin=>({'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
function originAllowed(origin,env){return origin==='https://zhuanmp3.com'||(env.TEST_ORIGIN&&origin===env.TEST_ORIGIN);}
async function readBounded(request){
  if(Number(request.headers.get('content-length'))>256)throw Error('body');
  const reader=request.body?.getReader();if(!reader)throw Error('body');
  const chunks=[];let length=0;try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>256){await reader.cancel();throw Error('body');}chunks.push(value);}}finally{reader.releaseLock();}
  const data=new Uint8Array(length);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(data));
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(url.pathname==='/health'&&!url.search&&request.method==='GET')return Response.json({service:'audio-counters',version:1},{headers:{'Cache-Control':'no-store'}});
  if(!['/collect','/api/metrics'].includes(url.pathname)||url.search)return new Response('Not found',{status:404});
  if(!originAllowed(origin,env))return new Response('Forbidden',{status:403,headers:{'Cache-Control':'no-store'}});
  const h=headers(origin);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:h});
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return new Response('Unsupported media type',{status:415,headers:h});
  let data;try{data=await readBounded(request);}catch{return new Response('Invalid payload',{status:400,headers:h});}
  if(!validMetric(data)||(origin!== 'https://zhuanmp3.com'&&data.environment!=='test'))return new Response('Invalid payload',{status:400,headers:h});
  const day=new Date().toISOString().slice(0,10);
  try{const result=await env.COUNTERS.prepare(INCREMENT_SQL).bind(day,data.environment,data.event,data.group,data.outcome,data.lang,day).run();return new Response(null,{status:result.meta?.changes?204:429,headers:h});}
  catch{console.warn(JSON.stringify({event:'aggregate_write_failed'}));return new Response('Unavailable',{status:503,headers:h});}
 },
 async scheduled(_event,env){await env.COUNTERS.prepare(PRUNE_SQL).bind(cutoffDay()).run();}
};
