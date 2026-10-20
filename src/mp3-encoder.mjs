// Codex, 2026-10-20. LGPL encoder is an independently replaceable local module.
import {Mp3Encoder} from '@breezystack/lamejs';
export function encodeMp3(channels,sampleRate,progress=()=>{}){
  if(!Array.isArray(channels)||channels.length<1||channels.length>2||sampleRate!==44100||!channels[0]?.length||channels.some(c=>!(c instanceof Float32Array)||c.length!==channels[0].length))throw Error('MP3 编码需要 44.1 kHz 单声道或双声道音频。');
  const count=channels[0].length;if(count*channels.length*4>256*1024**2)throw Error('解码音频超过 256 MB，请缩短音频后重试。');
  const encoder=new Mp3Encoder(channels.length,sampleRate,192),parts=[];let total=0;
  const pcm=(source,start,end)=>{const b=new Int16Array(end-start);for(let i=start;i<end;i++){const v=Math.max(-1,Math.min(1,Number.isFinite(source[i])?source[i]:0));b[i-start]=Math.round(v*(v<0?32768:32767));}return b;};
  for(let off=0;off<count;off+=1152){const end=Math.min(count,off+1152),left=pcm(channels[0],off,end),right=channels.length===2?pcm(channels[1],off,end):undefined;const b=encoder.encodeBuffer(left,right);if(b.length){parts.push(new Uint8Array(b));total+=b.length;}if(off%115200===0)progress(Math.round(off/count*100));}
  const tail=encoder.flush();parts.push(new Uint8Array(tail));total+=tail.length;const output=new Uint8Array(total);let off=0;for(const p of parts){output.set(p,off);off+=p.length;}progress(100);return output;
}
