// Codex, 2026-10-20. This worker has no network calls.
import { convert,outputName } from './engine.mjs';
import { encodeMp3 } from './mp3-encoder.mjs';
let pending;
self.onmessage=async({data:{file,type,channels,sampleRate}})=>{
  try {
    if(type==='encode'){
      if(!pending)throw Error('编码任务已失效。');
      const audio=encodeMp3(channels,sampleRate,value=>self.postMessage({type:'progress',value,label:'正在编码 MP3'}));
      const info={...pending,ext:'mp3',mime:'audio/mpeg',name:outputName(pending.name,'mp3'),action:'transcoded',warnings:['已转为 192 kbps MP3；重新编码有损，原文件未修改。']};pending=null;
      self.postMessage({type:'done',audio:audio.buffer,...info},[audio.buffer]);return;
    }
    self.postMessage({type:'progress',value:0,label:'正在读取本地文件'});
    const result=await convert(new Uint8Array(await file.arrayBuffer()),file.name,{progress:value=>self.postMessage({type:'progress',value,label:'正在恢复原音频'})});
    const {audio,...info}=result;delete info.cover;
    // Do not relay albumPic or arbitrary embedded metadata to the DOM.
    info.metadata={title:result.metadata.musicName,album:result.metadata.album};
    if(info.action==='original'&&info.ext!=='mp3'){pending=info;self.postMessage({type:'decode',audio:audio.buffer,...info},[audio.buffer]);return;}
    self.postMessage({type:'done',audio:audio.buffer,...info},[audio.buffer]);
  } catch(e){self.postMessage({type:'error',message:e.message||'转换失败。'});}
};
