// Codex, 2026-10-20. MIT algorithm ports/data: MengYX, KGG-Decryptor, music-geshizhuanhuan.
// See THIRD_PARTY_NOTICES.md. No network or persistent key storage.
import CryptoJS from 'crypto-js';
import tables from './format-tables.json' with {type:'json'};
const str=b=>new TextDecoder().decode(b),has=(b,s,at=0)=>at+s.length<=b.length&&[...s].every((c,i)=>b[at+i]===c.charCodeAt(0));
const view=b=>new DataView(b.buffer,b.byteOffset,b.byteLength),u32=(b,p,le=true)=>{if(p<0||p+4>b.length)throw Error('文件字段截断。');return view(b).getUint32(p,le);};
const equal=(a,b)=>b.every((v,i)=>a[i]===v);
export const ORDINARY=['mp3','flac','ogg','opus','wav','m4a','mp4','aac','ape','wma','aif','aiff','dff'];
export const QMC=['qmc0','qmc2','qmc3','qmc4','qmc6','qmc8','qmcflac','qmcogg','mflac','mflac0','mgg','mgg0','mgg1','mggl','mmp4','tkm','bkcmp3','bkcflac','bkcm4a','bkcwav','bkcape','bkcogg','bkcwma','666c6163','6d7033','6f6767','6d3461'];
export const EXTRA=['kwm','kgm','kgma','vpr','kgg','uc','x2m','x3m','mg3d','xm','ofl_en','tm0','tm2','tm3','tm6'];
export function sniffExtra(b){
  if(has(b,'OggS')&&b.length>=58&&b[4]===0){const n=b[26];if(n&&27+n<=b.length){let size=0;for(let i=0;i<n;i++)size+=b[27+i];const p=27+n;if(p+size<=b.length&&(has(b,'\x01vorbis',p)||has(b,'OpusHead',p)||has(b,'\x7fFLAC',p)))return has(b,'OpusHead',p)?'opus':'ogg';}}
  if(has(b,'RIFF')&&has(b,'WAVE',8)&&b.length>=44&&u32(b,4)+8<=b.length){let fmt=false,data=false;for(let p=12;p+8<=b.length;){const n=u32(b,p+4);if(p+8+n>b.length)return; if(has(b,'fmt ',p)&&n>=16){const v=view(b),c=v.getUint16(p+10,true),r=u32(b,p+12);fmt=c>0&&c<=32&&r>=8000&&r<=768000;}if(has(b,'data',p)&&n>0)data=true;p+=8+n+(n%2);}if(fmt&&data)return 'wav';}
  if(b.length>32&&has(b,'ftyp',4)){let p=0,ftyp=false,mdat=false,moov=false;while(p+8<=b.length){let n=u32(b,p,false),head=8;if(n===1){if(p+16>b.length||u32(b,p+8,false)!==0)return;n=u32(b,p+12,false);head=16;}if(n===0)n=b.length-p;if(n<head||p+n>b.length)return;ftyp||=has(b,'ftyp',p+4);mdat||=has(b,'mdat',p+4)&&n>head;moov||=has(b,'moov',p+4)&&n>head;p+=n;}if(p===b.length&&ftyp&&mdat&&moov)return 'm4a';}
  // Require two complete ADTS frames, rather than accepting a sync byte alone.
  const adts=p=>p+7<=b.length&&b[p]===255&&(b[p+1]&246)===240&&((b[p+2]>>2)&15)<13?((b[p+3]&3)<<11)|(b[p+4]<<3)|(b[p+5]>>5):0;
  const n=adts(0);if(n>=7&&n<b.length&&adts(n)>=7&&n+adts(n)<=b.length)return 'aac';
  if(b.length>96&&equal(b,[0x30,0x26,0xb2,0x75,0x8e,0x66,0xcf,0x11,0xa6,0xd9,0,0xaa,0,0x62,0xce,0x6c])&&u32(b,16)>=30&&u32(b,16)<=b.length&&b[28]===1&&b[29]===2)return 'wma';
  if(b.length>80&&has(b,'MAC ')&&view(b).getUint16(4,true)>=3800&&view(b).getUint16(4,true)<=5000)return 'ape';
  if(b.length>54&&has(b,'FORM')&&(has(b,'AIFF',8)||has(b,'AIFC',8))&&u32(b,4,false)+8<=b.length)return 'aiff';
  if(b.length>64&&has(b,'FRM8')&&has(b,'DSD ',12))return 'dff';
}
function base64(s){s=s.trim();if(!s||s.length>16384||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))throw Error('音频密钥不是有效 Base64。');try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch{throw Error('音频密钥编码无效。');}}
function teaBlock(b,key){let l=view(b).getUint32(0),r=view(b).getUint32(4),sum=0xe3779b90;const k=Array.from({length:4},(_,i)=>view(key).getUint32(i*4));for(let i=0;i<16;i++){r=(r-((((l<<4)+k[2])^(l+sum)^((l>>>5)+k[3]))>>>0))>>>0;l=(l-((((r<<4)+k[0])^(r+sum)^((r>>>5)+k[1]))>>>0))>>>0;sum=(sum-0x9e3779b9)>>>0;}const out=new Uint8Array(8);view(out).setUint32(0,l);view(out).setUint32(4,r);return out;}
export function teaDecrypt(b,key){if(b.length<16||b.length%8||key.length!==16)throw Error('音频密钥 TEA 长度无效。');let prev=new Uint8Array(8),cur=new Uint8Array(8);const plain=new Uint8Array(b.length);for(let off=0;off<b.length;off+=8){const block=b.subarray(off,off+8),next=teaBlock(block.map((v,i)=>v^cur[i]),key);plain.set(next.map((v,i)=>v^prev[i]),off);prev=block;cur=next;}const start=1+(plain[0]&7)+2,end=b.length-7;if(start>end||plain.subarray(end).some(v=>v!==0))throw Error('音频密钥校验失败。');return plain.slice(start,end);}
export function deriveKey(s){let raw=base64(s);const prefix='QQMusic EncV2,Key:';if(has(raw,prefix)){const a=teaDecrypt(raw.subarray(prefix.length),new TextEncoder().encode('386ZJY!@#*$%^&)('));const b=teaDecrypt(a,new TextEncoder().encode('**#!(#$%&^a1cZ,T'));raw=base64(str(b));}
if(raw.length<24)throw Error('音频密钥过短。');const salt=[105,86,70,56,43,32,21,11],key=new Uint8Array(16);for(let i=0;i<8;i++){key[2*i]=salt[i];key[2*i+1]=raw[i];}const tail=teaDecrypt(raw.subarray(8),key),out=new Uint8Array(8+tail.length);out.set(raw.subarray(0,8));out.set(tail,8);if(!out.length||out.length>8192)throw Error('音频密钥长度异常。');return out;}
export function qmcCrypt(data,key){const n=key.length,out=data.slice();if(!n||n>8192)throw Error('音频密钥长度无效。');if(n<=300){for(let i=0;i<out.length;i++){const at=i>32767?i%32767:i,idx=(at*at+71214)%n,r=((idx&7)+4)%8;out[i]^=((key[idx]<<r)|(key[idx]>>r))&255;}return out;}
const box=Uint8Array.from({length:n},(_,i)=>i&255);let j=0;for(let i=0;i<n;i++){j=(j+box[i]+key[i])%n;[box[i],box[j]]=[box[j],box[i]];}let hash=1;for(const v of key){if(!v)continue;const next=Math.imul(hash,v)>>>0;if(!next||next<=hash)break;hash=next;}const skip=id=>key[id%n]?Math.floor(hash/((id+1)*key[id%n])*100)%n:0;
for(let i=0;i<Math.min(128,out.length);i++)out[i]^=key[skip(i)];for(let off=128;off<out.length;){const end=Math.min(out.length,(Math.floor(off/5120)+1)*5120),s=box.slice(),count=off%5120+skip(Math.floor(off/5120));let j=0,k=0;for(let i=-count;i<end-off;i++){j=(j+1)%n;k=(s[j]+k)%n;[s[j],s[k]]=[s[k],s[j]];if(i>=0)out[off+i]^=s[(s[j]+s[k])%n];}off=end;}return out;}
export function qmcFooter(data){let end=data.length,ekey='';const tail=str(data.subarray(-4));if(tail==='QTag'||tail==='STag'){const len=u32(data,end-8,false);if(len>16384||len>end-8)throw Error('QMC 尾部长度异常。');end-=len+8;const fields=str(data.subarray(end,end+len)).split(',');if(tail==='QTag'){if(fields.length!==3||fields[2]!=='2')throw Error('QMC QTag 结构无效。');ekey=fields[0];}}
else if(has(data,'musicex\0',data.length-8)){if(data.length<16)throw Error('QMC musicex 尾部截断。');const len=u32(data,data.length-16),version=u32(data,data.length-12);if(version!==1||len<16||len>4096||len+12>data.length)throw Error('QMC musicex 尾部长度异常。');end-=len+12;}
else if(end>=4){const len=u32(data,end-4);if(len>0&&len<0x500&&len+4<end){end-=len+4;ekey=str(data.subarray(end,end+len)).replace(/\0+$/,'');}}
return {audio:data.subarray(0,end),ekey};}
let publicMask;
async function kgmMask(){if(!publicMask){const compressed=Uint8Array.from(atob(tables.kgmPublicDeflate),c=>c.charCodeAt(0));const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'));publicMask=new Uint8Array(await new Response(stream).arrayBuffer());if(publicMask.length!==6553600)throw Error('酷狗恢复表损坏。');}return publicMask;}
function kugouMd5(b){const wa=CryptoJS.MD5(CryptoJS.lib.WordArray.create(b));const digest=Uint8Array.from({length:16},(_,i)=>(wa.words[i>>>2]>>>(24-(i%4)*8))&255);return Uint8Array.from({length:16},(_,i)=>digest[14-(i&~1)+(i&1)]);}
export async function decodeExtended(data,ext,sniff,legacyMask){
  const direct=sniff(data);if(direct)return {audio:data.slice(),action:'original'};
  if(ORDINARY.includes(ext))throw Error('未识别到有效音频编码，文件损坏或实际为加密版本。');
  let audio;
  if(QMC.includes(ext)){const footer=qmcFooter(data),key=footer.ekey;if(key)audio=qmcCrypt(footer.audio,deriveKey(key));else{audio=footer.audio.slice();const next=legacyMask();for(let i=0;i<audio.length;i++)audio[i]^=next();if(!sniff(audio))throw Error('此文件版本暂不支持。');}}
  else if(ext==='kwm'){if(data.length<=1024||!(has(data,'yeelion-kuwo-tme')||has(data,'yeelion-kuwo\0\0\0\0')))throw Error('KWM 文件头无效或截断。');const digits=view(data).getBigUint64(24,true).toString(),base='MoOtOiTvINGwd2E6n0E1i7L5t2IoOoNk',mask=Uint8Array.from({length:32},(_,i)=>base.charCodeAt(i)^digits.charCodeAt(i%digits.length));audio=data.slice(1024);for(let i=0;i<audio.length;i++)audio[i]^=mask[i%32];}
  else if(ext==='uc'){audio=data.map(v=>v^163);}
  else if(ext==='xm'){if(data.length<17||!has(data,'ifmt')||!equal(data.subarray(8,12),[254,254,254,254])||![' WAV','FLAC',' MP3',' A4M'].includes(str(data.subarray(4,8))))throw Error('XM 文件头无效。');const start=data[12]|data[13]<<8|data[14]<<16;audio=data.slice(16);if(start>audio.length)throw Error('XM 音频偏移越界。');for(let i=start;i<audio.length;i++)audio[i]=(audio[i]-data[15])^255;}
  else if(ext==='x2m'||ext==='x3m'){if(data.length<1024)throw Error('喜马拉雅文件头截断。');audio=data.slice();const key=tables[ext+'Key'],table=tables[ext+'ScrambleTable'];for(let i=0;i<1024;i++)audio[i]=data[table[i]]^key[i%key.length];}
  else if(['tm0','tm3'].includes(ext)){audio=data.slice();}
  else if(['tm2','tm6'].includes(ext)){if(data.length<8)throw Error('TM 文件截断。');audio=data.slice();audio.set([0,0,0,32,102,116,121,112]);}
  else if(ext==='mg3d'){for(let pos=32;pos+32<=Math.min(data.length,640);pos+=32){const key=data.subarray(pos,pos+32);if(!key.every(v=>(v>=48&&v<=57)||(v>=65&&v<=70)))continue;const head=data.subarray(0,256).map((v,i)=>(v-key[i%32])&255);if(!has(head,'RIFF')||!has(head,'WAVEfmt ',8)||![16,18,40].includes(u32(head,16)))continue;const candidate=data.map((v,i)=>(v-key[i%32])&255);if(sniff(candidate)==='wav'){audio=candidate;break;}}if(!audio)throw Error('MG3D 未找到有效的 WAV 恢复密钥，文件可能不属于此版本。');}
  else if(['kgm','kgma','vpr','kgg'].includes(ext)){if(data.length<80||(!equal(data,tables.kgmMagic)&&!equal(data,tables.vprMagic)))throw Error('酷狗 KGM/VPR/KGG 文件头无效。');const offset=u32(data,16),version=u32(data,20);if(offset<80||offset>=data.length)throw Error('酷狗音频偏移越界。');if(version===5)throw Error('此文件版本暂不支持。');
else if([2,3,4].includes(version)){
  if(version===3&&u32(data,24)===1){const slot=kugouMd5(Uint8Array.of(108,44,47,39)),key=new Uint8Array(17);key.set(kugouMd5(data.subarray(44,60)));key[16]=107;audio=data.slice(offset);for(let i=0;i<audio.length;i++){const v=audio[i]^key[i%17];audio[i]=v^(v<<4)^slot[i%16]^(i&255)^((i>>>8)&255)^((i>>>16)&255)^((i>>>24)&255);}}
  if(!audio||!sniff(audio)){if(offset<1024)throw Error('旧版酷狗文件头过短。');const pub=await kgmMask(),own=new Uint8Array(17);own.set(data.subarray(28,44));audio=data.slice(offset);for(let i=0;i<audio.length;i++){let a=audio[i]^own[i%17],b=pub[i>>4]^tables.mendTable[i%272];audio[i]=a^((a&15)<<4)^b^((b&15)<<4);}if(equal(data,tables.vprMagic)&&!sniff(audio)){const diff=[37,223,232,166,117,30,117,14,47,128,243,45,184,182,227,17,0];for(let i=0;i<audio.length;i++)audio[i]^=diff[i%17];}}
}
else throw Error('此酷狗加密版本暂不支持。');}
  else if(ext==='ofl_en')throw Error('JOOX OFL_EN 已识别；当前未接入可验证的恢复引擎，暂不能转换。');
  if(!audio||!sniff(audio))throw Error('恢复后未识别到有效音频编码：密钥不匹配、文件损坏或此版本暂不支持。');return {audio,action:'recovered'};
}
