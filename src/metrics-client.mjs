const groups=['ordinary','special','existing_mp3','unknown'];
const outcomes=['success','unsupported','invalid_or_unknown','browser_decode','limit','cancel','other'];
export function validMetric(data) {
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  const keys=['v','event','group','outcome','lang','environment'];
  if(Object.keys(data).length!==keys.length||!keys.every(key=>Object.hasOwn(data,key)))return false;
  if(data.v!==1||!['zh','en'].includes(data.lang)||!['production','test'].includes(data.environment))return false;
  if(data.event==='process_finished')return groups.includes(data.group)&&outcomes.includes(data.outcome);
  if(data.event==='download_triggered')return data.group==='none'&&['single','zip'].includes(data.outcome);
  return data.event==='zip_failed'&&data.group==='none'&&data.outcome==='error';
}
export function createMetricsReporter(options={}) {
  const {endpoint,fetch:send=globalThis.fetch,hostname='',lang='zh',environment=hostname==='zhuanmp3.com'?'production':'test',doNotTrack,globalPrivacyControl,disabled=false}=options;
  let enabled=false;
  try {const url=new URL(endpoint);enabled=url.protocol==='https:'&&['/collect','/api/metrics'].includes(url.pathname)&&!url.search&&!url.hash&&!url.username&&!url.password;} catch {}
  return {emit(event,group,outcome){
    if(!enabled||disabled||doNotTrack==='1'||globalPrivacyControl||typeof send!=='function')return;
    const data={v:1,event,group,outcome,lang:lang==='en'?'en':'zh',environment};
    if(!validMetric(data))return;
    let timer;
    try {const controller=new AbortController();timer=setTimeout(()=>controller.abort(),5000);const result=send(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,signal:controller.signal});Promise.resolve(result).catch(()=>{}).finally(()=>clearTimeout(timer));}catch{clearTimeout(timer);}
  }};
}
