// Codex, 2026-10-20. Browser decoder only; no upload, fetch or audio output.
export async function decodeAudio(buffer,mime,isActive=()=>true){
  const url=URL.createObjectURL(new Blob([buffer],{type:mime})),audio=new Audio();let duration;
  try{duration=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{clean();reject(Error('读取音频时长超时。'));},15000);function clean(){clearTimeout(timer);audio.onloadedmetadata=audio.onerror=null;}audio.onloadedmetadata=()=>{clean();resolve(audio.duration);};audio.onerror=()=>{clean();reject(Error('浏览器无法解码此音频，请使用支持该编码的桌面转换工具。'));};audio.preload='metadata';audio.src=url;});}
  finally{audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);}
  if(!isActive())throw Error('已取消。');if(Number.isFinite(duration)&&(duration<=0||duration>20*60))throw Error('普通音频转 MP3 当前支持 20 分钟以内的文件。');
  if(Number.isFinite(duration)&&duration*44100*2*4>256*1024**2)throw Error('解码后音频超过 256 MB，请缩短音频后重试。');
  const context=new OfflineAudioContext(2,1,44100);let decoded;
  try{decoded=await context.decodeAudioData(buffer);}catch{throw Error('浏览器无法解码此音频，不能转换为 MP3。');}
  if(!isActive())throw Error('已取消。');if(decoded.duration>1200)throw Error('普通音频转 MP3 当前支持 20 分钟以内的文件。');if(decoded.length*decoded.numberOfChannels*4>256*1024**2)throw Error('解码音频超过 256 MB。');
  if(decoded.numberOfChannels>2){const mix=new OfflineAudioContext(2,decoded.length,44100),source=mix.createBufferSource();source.buffer=decoded;source.connect(mix.destination);source.start();decoded=await mix.startRendering();}
  return {channels:Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i)),sampleRate:decoded.sampleRate};
}
