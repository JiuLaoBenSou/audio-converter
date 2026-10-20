// Codex, 2026-10-20. Derived algorithms: see THIRD_PARTY_NOTICES.md.
import CryptoJS from 'crypto-js';
import { ID3Writer } from 'browser-id3-writer';
import { ORDINARY, QMC, EXTRA, sniffExtra, decodeExtended } from './extended.mjs';
export const MAX_FILE = 100 * 1024 ** 2;
export const SUPPORTED = ['ncm',...ORDINARY,...QMC,...EXTRA];
const utf8 = new TextDecoder('utf-8', { fatal: true });
const enc = new TextEncoder();
const text = bytes => utf8.decode(bytes);
const starts = (b,s) => s.length <= b.length && [...s].every((c,i)=>b[i]===c.charCodeAt(0));
export function validateInput(file) {
  if (!SUPPORTED.includes(file.name.split('.').at(-1).toLowerCase())) throw Error('不支持此扩展名。请查看页面中的格式列表。');
  if (!file.size) throw Error('文件为空。');
  if (file.size > MAX_FILE) throw Error('超过每个文件 100 MB 的当前限制，请使用桌面工具处理。');
}
export function outputName(name,ext) {
  const stem = name.replace(/\.[^.]*$/, '').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/^[. ]+|[. ]+$/g,'').slice(0,160) || '音频';
  return `${stem}.${ext}`;
}
function aes(cipher,key) {
  if (!cipher.length || cipher.length%16) throw Error('NCM 加密块长度异常。');
  const plain = CryptoJS.AES.decrypt({ciphertext: CryptoJS.lib.WordArray.create(cipher)},CryptoJS.enc.Hex.parse(key),{mode:CryptoJS.mode.ECB,padding:CryptoJS.pad.NoPadding});
  const bytes = Uint8Array.from({length:plain.sigBytes},(_,i)=>(plain.words[i>>>2]>>>(24-(i%4)*8))&255);
  const pad=bytes.at(-1);
  if (!pad || pad>16 || !bytes.slice(-pad).every(v=>v===pad)) throw Error('NCM 密钥或填充无效，可能为不支持的版本。');
  return bytes.slice(0,-pad);
}
function unpackNcm(data) {
  if (!starts(data,'CTENFDAM')) throw Error('NCM 文件头无效或文件已截断。');
  let offset=10;
  const take = n => { if (!Number.isSafeInteger(n)||n<0||offset+n>data.length) throw Error('NCM 字段长度越界，文件已截断。'); const b=data.subarray(offset,offset+n);offset+=n;return b; };
  const u32 = () => { const b=take(4);return new DataView(b.buffer,b.byteOffset,4).getUint32(0,true); };
  const keyLen=u32();if(keyLen>4096) throw Error('NCM 密钥长度异常。');
  const keyPlain=aes(take(keyLen).map(v=>v^0x64),'687a4852416d736f356b496e62617857');
  if(!starts(keyPlain,'neteasecloudmusic') || keyPlain.length<=17) throw Error('NCM 音频密钥无效。');
  const key=keyPlain.subarray(17);
  const metaLen=u32();if(metaLen>4*1024**2) throw Error('NCM 元数据长度超过 4 MB。');
  const metaBytes=take(metaLen);
  const warnings=[];let metadata={};
  if(metaLen) try {
    const s=text(metaBytes.map(v=>v^0x63));
    if(!s.startsWith("163 key(Don't modify):")) throw Error('元数据前缀无效');
    const b64=s.slice(22);if(!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw Error('元数据编码无效');
    const wa=CryptoJS.enc.Base64.parse(b64);
    const cipher=Uint8Array.from({length:wa.sigBytes},(_,i)=>(wa.words[i>>>2]>>>(24-(i%4)*8))&255);
    const decoded=text(aes(cipher,'2331346c6a6b5f215c5d2630553c2728'));
    const colon=decoded.indexOf(':');const label=decoded.slice(0,colon);
    if(!['music','dj'].includes(label)) throw Error('未知元数据类型');
    metadata=JSON.parse(decoded.slice(colon+1));if(label==='dj') metadata=metadata.mainMusic;
    if(!metadata||typeof metadata!=='object') throw Error('元数据结构异常');
  } catch { metadata={};warnings.push('元数据无法读取；已继续恢复音频。'); }
  take(5);const coverFrame=u32(),coverLen=u32();
  if(coverLen>coverFrame || coverFrame>16*1024**2) throw Error('NCM 封面区长度异常。');
  const cover=take(coverLen).slice();take(coverFrame-coverLen);
  const audio=take(data.length-offset).slice();
  const box=Uint8Array.from({length:256},(_,i)=>i);let j=0;
  for(let i=0;i<256;i++){j=(box[i]+j+key[i%key.length])&255;[box[i],box[j]]=[box[j],box[i]];}
  const stream=box.map((_,i)=>{const a=(i+1)&255;return box[(box[a]+box[(a+box[a])&255])&255];});
  return {audio,metadata,cover,warnings,mask:i=>stream[i&255]};
}
const seedMap=[[74,214,202,144,103,247,82],[94,149,35,159,19,17,126],[71,116,61,144,170,63,81],[198,9,213,159,250,102,249],[243,214,161,144,160,247,240],[29,149,222,159,132,17,244],[14,116,187,144,188,63,146],[0,9,91,159,98,102,161]];
function qmcMask() {
  let x=-1,y=8,dx=1,index=-1;
  return function next(){index++;let ret;if(x<0){dx=1;y=(8-y)%8;ret=195;}else if(x>6){dx=-1;y=7-y;ret=216;}else ret=seedMap[y][x];x+=dx;return index===32768||(index>32768&&(index+1)%32768===0)?next():ret;};
}
function sniff(b) {
  const extra=sniffExtra(b);if(extra)return extra;
  if(starts(b,'fLaC')) {
    if(b.length<=42 || (b[4]&127)!==0 || b[5]!==0 || b[6]!==0 || b[7]!==34)return;
    const minBlock=(b[8]<<8)|b[9],maxBlock=(b[10]<<8)|b[11];
    const sampleRate=(b[18]<<12)|(b[19]<<4)|(b[20]>>>4);
    if(minBlock<16||maxBlock<minBlock||!sampleRate)return;
    let p=4,last=false;
    while(!last){if(p+4>b.length)return;last=!!(b[p]&128);const type=b[p]&127,len=(b[p+1]<<16)|(b[p+2]<<8)|b[p+3];if(type===127||p+4+len>b.length)return;p+=4+len;}
    if(p+2>=b.length || b[p]!==255 || (b[p+1]&254)!==248)return;
    return 'flac';
  }
  let i=0;
  if(starts(b,'ID3')) {
    if(b.length<10 || b.slice(6,10).some(v=>v&128)) return;
    i=10+((b[6]<<21)|(b[7]<<14)|(b[8]<<7)|b[9]);
  }
  function frame(n){
    if(n+4>b.length||b[n]!==255||(b[n+1]&224)!==224)return;
    const version=(b[n+1]>>>3)&3,layer=(b[n+1]>>>1)&3,rateIdx=(b[n+2]>>>2)&3,bitIdx=b[n+2]>>>4;
    if(version===1||layer!==1||rateIdx===3||bitIdx===0||bitIdx===15)return;
    const bitrate=(version===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160])[bitIdx];
    const rate=[44100,48000,32000][rateIdx]/(version===3?1:version===2?2:4);
    return {length:Math.floor((version===3?144000:72000)*bitrate/rate)+((b[n+2]>>>1)&1),version,rate};
  }
  for(let n=i;n<Math.min(i+4096,b.length-4);n++){const a=frame(n);if(a){const next=frame(n+a.length);if(next&&next.version===a.version&&next.rate===a.rate)return 'mp3';}}
}
const concat=(...parts)=>{const out=new Uint8Array(parts.reduce((s,p)=>s+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;};
const num=(n,le=false)=>{const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,le);return b;};
function imageMime(cover){return starts(cover,'\x89PNG\r\n\x1a\n')?'image/png':cover[0]===255&&cover[1]===216?'image/jpeg':null;}
function flacTags(audio,metadata,cover,artists) {
  const blocks=[];let p=4,last=false;let comments=[];
  while(!last){if(p+4>audio.length)throw Error('FLAC 元数据截断。');last=!!(audio[p]&128);const type=audio[p]&127;const len=(audio[p+1]<<16)|(audio[p+2]<<8)|audio[p+3];if(p+4+len>audio.length)throw Error('FLAC 元数据长度无效。');const data=audio.slice(p+4,p+4+len);
    if(type===4){let off=0;const get=()=>{if(off+4>data.length)throw Error('FLAC 标签截断');const n=new DataView(data.buffer,data.byteOffset+off,4).getUint32(0,true);off+=4;return n;};const skip=n=>{if(off+n>data.length)throw Error('FLAC 标签越界');const s=text(data.subarray(off,off+n));off+=n;return s;};skip(get());const count=get();if(count>100000)throw Error('FLAC 标签过多');for(let k=0;k<count;k++)comments.push(skip(get()));}
    else blocks.push({type,data});p+=4+len;
  }
  const updates={TITLE:metadata.musicName,ALBUM:metadata.album,ARTIST:artists.join('; ')};
  for(const [k,v] of Object.entries(updates))if(typeof v==='string'&&v){comments=comments.filter(s=>!s.toUpperCase().startsWith(k+'='));comments.push(k+'='+v);}
  if(comments.length){const vendor=enc.encode('audio-converter-local');blocks.push({type:4,data:concat(num(vendor.length,true),vendor,num(comments.length,true),...comments.map(s=>{const b=enc.encode(s);return concat(num(b.length,true),b);}))});}
  const mime=imageMime(cover);
  if(mime){const m=enc.encode(mime);const png=mime==='image/png'&&cover.length>=24;const v=new DataView(cover.buffer,cover.byteOffset,cover.length);blocks.push({type:6,data:concat(num(3),num(m.length),m,num(0),num(png?v.getUint32(16):0),num(png?v.getUint32(20):0),num(0),num(0),num(cover.length),cover)});}
  return concat(enc.encode('fLaC'),...blocks.map(({type,data},i)=>{if(data.length>0xffffff)throw Error('FLAC 标签过大');return concat(Uint8Array.of(type|(i===blocks.length-1?128:0),data.length>>>16,(data.length>>>8)&255,data.length&255),data);}),audio.subarray(p));
}
function writeMetadata(audio,ext,metadata,cover) {
  const artist=metadata.artist;
  const artists=typeof artist==='string'?[artist]:Array.isArray(artist)?artist.map(a=>typeof a==='string'?a:Array.isArray(a)?a[0]:'').filter(a=>typeof a==='string'&&a):[];
  if(ext==='flac') return flacTags(audio,metadata,cover,artists);
  const writer=new ID3Writer(audio.buffer.slice(audio.byteOffset,audio.byteOffset+audio.byteLength));writer.padding=0;
  if(typeof metadata.musicName==='string')writer.setFrame('TIT2',metadata.musicName);
  if(typeof metadata.album==='string')writer.setFrame('TALB',metadata.album);
  if(artists.length)writer.setFrame('TPE1',artists);
  if(imageMime(cover))writer.setFrame('APIC',{type:3,data:cover,description:''});
  writer.addTag();return new Uint8Array(writer.arrayBuffer);
}
export async function convert(data,name,options={}) {
  validateInput({name,size:data.byteLength});
  const ncm=name.toLowerCase().endsWith('.ncm')&&!sniff(data);
  const result=ncm?{...unpackNcm(data),action:'recovered'}:{metadata:{},cover:new Uint8Array(),warnings:[],...await decodeExtended(data,name.split('.').at(-1).toLowerCase(),sniff,qmcMask)};
  if(ncm)for(let i=0;i<result.audio.length;i++){result.audio[i]^=result.mask(i);if(i%1048576===0)options.progress?.(Math.round(i/result.audio.length*85));}
  const ext=sniff(result.audio);
  if(!ext)throw Error('未识别到有效音频编码，文件可能损坏或版本不支持。');
  if(options.writeTags!==false && ncm && ['mp3','flac'].includes(ext) && (Object.keys(result.metadata).length||result.cover.length)) {
    if(ext==='mp3'&&starts(result.audio,'ID3'))result.warnings.push('已原样保留原音频 ID3 标签；NCM 标签和封面未覆盖。');
    else try{result.audio=writeMetadata(result.audio,ext,result.metadata,result.cover);}catch{result.warnings.push('标签写入失败，保留恢复的原音频。');}
  }
  delete result.mask;
  options.progress?.(100);
  const mime={mp3:'audio/mpeg',flac:'audio/flac',ogg:'audio/ogg',opus:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',wma:'audio/x-ms-wma',ape:'audio/ape',aiff:'audio/aiff',dff:'audio/dff'}[ext];
  return {...result,ext,mime,name:outputName(name,ext)};
}
