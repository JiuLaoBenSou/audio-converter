// Codex, 2026-10-20. Independent fixture encoders, exclusively self-created tones.
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import {createHash} from 'node:crypto';
const root=new URL('../tests/generated/',import.meta.url);
const put=(n,b)=>writeFile(new URL(n,root),b),read=n=>readFile(new URL(n,root));
const tables=JSON.parse(await readFile(new URL('../src/format-tables.json',import.meta.url)));
const tone=await read('tone.mp3');
for(const ext of ['ogg','wav','m4a','aac','wma'])execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','sine=frequency=440:duration=3','-map_metadata','-1',fileURLToPath(new URL(`tone.${ext}`,root))]);
let a=Buffer.alloc(tone.length+1024);a.write('yeelion-kuwo-tme');a.writeBigUInt64LE(123456789n,24);
const digits='123456789'.repeat(4),base='MoOtOiTvINGwd2E6n0E1i7L5t2IoOoNk';
for(let i=0;i<tone.length;i++)a[i+1024]=tone[i]^digits.charCodeAt(i%32)^base.charCodeAt(i%32);await put('扩展.kwm',a);
await put('扩展.uc',tone.map(v=>v^163));
a=Buffer.alloc(tone.length+16);a.write('ifmt MP3');a.fill(254,8,12);a.writeUIntLE(18,12,3);a[15]=37;tone.copy(a,16);for(let i=34;i<a.length;i++)a[i]=((a[i]^255)+37)&255;await put('扩展.xm',a);
for(const ext of ['x2m','x3m']){a=await read('tone.m4a');const out=Buffer.from(a),key=tables[ext+'Key'],table=tables[ext+'ScrambleTable'];for(let i=0;i<1024;i++)out[table[i]]=a[i]^key[i%key.length];await put('扩展.'+ext,out);}
{const m=await read('tone.m4a'),n=m.readUInt32BE(),added=32-n;a=Buffer.concat([m.subarray(0,n),Buffer.alloc(added),m.subarray(n)]);a.writeUInt32BE(32);const pos=a.indexOf('stco');if(pos<0)throw Error('Missing stco');for(let i=0;i<a.readUInt32BE(pos+8);i++){const off=pos+12+i*4;a.writeUInt32BE(a.readUInt32BE(off)+added,off);}await put('tm.m4a',a);for(const ext of ['tm2','tm6']){const out=Buffer.from(a);out.fill(0,0,8);await put('扩展.'+ext,out);}}
// WAV with a genuine JUNK chunk gives the MG3D key discovery a zero-filled region.
const wav=await read('tone.wav'),junk=Buffer.alloc(1032);junk.write('JUNK');junk.writeUInt32LE(1024,4);
// Insert after fmt (FFmpeg WAV fmt is 16 bytes), before LIST/data.
a=Buffer.concat([wav.subarray(0,36),junk,wav.subarray(36)]);a.writeUInt32LE(a.length-8,4);await put('padded.wav',a);
const mgkey=Buffer.from('0123456789ABCDEF0123456789ABCDEF');await put('扩展.mg3d',a.map((v,i)=>(v+mgkey[i%32])&255));
const pub=inflateSync(Buffer.from(tables.kgmPublicDeflate,'base64')),own=Buffer.from(Array.from({length:17},(_,i)=>i===16?0:i*7+1));
for(const ext of ['kgm','kgma','vpr']){a=Buffer.alloc(1024+tone.length);Buffer.from(tables[ext==='vpr'?'vprMagic':'kgmMagic']).copy(a);a.writeUInt32LE(1024,16);a.writeUInt32LE(3,20);own.copy(a,28,0,16);
for(let i=0;i<tone.length;i++){const mask=(pub[i>>4]^tables.mendTable[i%272]),diff=[37,223,232,166,117,30,117,14,47,128,243,45,184,182,227,17,0];let v=tone[i]^(ext==='vpr'?diff[i%17]:0)^mask^((mask&15)<<4);v=v^((v&15)<<4);a[1024+i]=v^own[i%17];}await put('扩展.'+ext,a);}
{const md5=b=>{const d=createHash('md5').update(b).digest();return Buffer.from(Array.from({length:16},(_,i)=>d[14-(i&~1)+(i&1)]));};a=Buffer.alloc(1024+tone.length);Buffer.from(tables.kgmMagic).copy(a);a.writeUInt32LE(1024,16);a.writeUInt32LE(3,20);a.writeUInt32LE(1,24);a.fill(17,44,60);const slot=md5(Buffer.from([108,44,47,39])),key=Buffer.concat([md5(a.subarray(44,60)),Buffer.from([107])]);for(let i=0;i<tone.length;i++){let v=tone[i]^slot[i%16]^(i&255)^((i>>8)&255)^((i>>16)&255)^((i>>24)&255);v^=v<<4;a[1024+i]=v^key[i%17];}await put('槽位1.kgm',a);}
// TEA fixture encryption uses BigInt arithmetic rather than the decoder's u32 implementation.
function block(b,k){let l=BigInt(b.readUInt32BE()),r=BigInt(b.readUInt32BE(4)),s=0n;const w=[0,4,8,12].map(i=>BigInt(k.readUInt32BE(i))),m=0xffffffffn;for(let i=0;i<16;i++){s=(s+0x9e3779b9n)&m;l=(l+(((r<<4n)+w[0])^(r+s)^((r>>5n)+w[1])))&m;r=(r+(((l<<4n)+w[2])^(l+s)^((l>>5n)+w[3])))&m;}const o=Buffer.alloc(8);o.writeUInt32BE(Number(l));o.writeUInt32BE(Number(r),4);return o;}
function tea(b,k){const pad=(8-(b.length+10)%8)%8,p=Buffer.concat([Buffer.from([pad]),Buffer.alloc(pad+2,99),b,Buffer.alloc(7)]),out=Buffer.alloc(p.length);let prev=Buffer.alloc(8),mix=Buffer.alloc(8);for(let off=0;off<p.length;off+=8){const x=p.subarray(off,off+8).map((v,i)=>v^prev[i]);const c=block(x,k).map((v,i)=>v^mix[i]);c.copy(out,off);prev=c;mix=x;}return out;}
function ekey(k){const key=Buffer.alloc(16),salt=[105,86,70,56,43,32,21,11];for(let i=0;i<8;i++){key[i*2]=salt[i];key[i*2+1]=k[i];}return Buffer.concat([k.subarray(0,8),tea(k.subarray(8),key)]).toString('base64');}
function encrypt(data,key){const out=Buffer.from(data),n=key.length;
if(n<=300){for(let i=0;i<out.length;i++){const p=i>32767?i%32767:i,j=(p*p+71214)%n,r=(j%8+4)%8;out[i]^=((key[j]<<r)|(key[j]>>r))&255;}return out;}
const state=Uint8Array.from({length:n},(_,i)=>i&255);let j=0;for(let i=0;i<n;i++){j=(j+state[i]+key[i])%n;[state[i],state[j]]=[state[j],state[i]];}let hash=1;for(const v of key){if(!v)continue;const next=(hash*v)>>>0;if(!next||next<=hash)break;hash=next;}const skip=id=>Math.floor(hash/((id+1)*key[id%n])*100)%n;
for(let i=0;i<Math.min(128,out.length);i++)out[i]^=key[skip(i)];for(let off=128;off<out.length;){const end=Math.min(out.length,(Math.floor(off/5120)+1)*5120),s=state.slice();let x=0,y=0;const count=off%5120+skip(Math.floor(off/5120));for(let p=-count;p<end-off;p++){x=(x+1)%n;y=(y+s[x])%n;[s[x],s[y]]=[s[y],s[x]];if(p>=0)out[off+p]^=s[(s[x]+s[y])%n];}off=end;}return out;}
const keys={};
for(const [label,n]of [['map',256],['rc4',512]]){const key=Buffer.from(Array.from({length:n},(_,i)=>(i*19+7)%255+1)),encoded=ekey(key),data=encrypt(tone,key);keys[label]=encoded;
const tail=Buffer.from(encoded),size=Buffer.alloc(4);size.writeUInt32LE(tail.length);await put(`扩展-${label}.mflac`,Buffer.concat([data,tail,size]));
const qtag=Buffer.from(encoded+',12345,2'),be=Buffer.alloc(4);be.writeUInt32BE(qtag.length);await put(`扩展-${label}.mgg`,Buffer.concat([data,qtag,be,Buffer.from('QTag')]));
await put(`外部密钥-${label}.mgg`,data);
const header=Buffer.alloc(1024);Buffer.from(tables.kgmMagic).copy(header);header.writeUInt32LE(1024,16);header.writeUInt32LE(5,20);header.writeUInt32LE(8,68);header.write('hash0001',72);await put(`扩展-${label}.kgg`,Buffer.concat([header,data]));
}
await put('fixture-keys.json',JSON.stringify(keys,null,2));
console.log('Generated extended synthetic codec/container/TEA/map/RC4 fixtures.');
