// Codex, 2026-10-20. Generates only original 440 Hz tones, never downloaded music.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createCipheriv } from 'node:crypto';
const dir = new URL('../tests/generated/', import.meta.url);
await mkdir(dir, { recursive: true });
const path = name => decodeURIComponent(new URL(name, dir).pathname).replace(/^\/(\w:)/, '$1');
for (const ext of ['mp3','flac']) execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','sine=frequency=440:duration=3','-map_metadata','-1',...(ext==='mp3'?['-id3v2_version','0','-write_id3v1','0']:[]), path(`tone.${ext}`)]);
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path('tone.mp3'),'-c','copy','-metadata','title=原有中文标题','-metadata','comment=应当保留的备注',path('tagged.mp3')]);
execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=green:s=32x32','-frames:v','1',path('cover.png')]);
const u32 = value => { const b = Buffer.alloc(4); b.writeUInt32LE(value); return b; };
function aes(data, hex) { const c = createCipheriv('aes-128-ecb', Buffer.from(hex,'hex'), null); return Buffer.concat([c.update(data),c.final()]); }
const key = Buffer.from('original-fixture-stream-key');
// Independent NCM fixture encoder using node:crypto, not the browser decoder.
const box = Uint8Array.from({ length: 256 }, (_, i) => i);
let last = 0;
for (let i=0; i<256; i++) { const c = (box[i]+last+key[i%key.length]) & 255; [box[i],box[c]]=[box[c],box[i]]; last=c; }
for (const [ext,name,source] of [['mp3','合成测试.ncm','tone.mp3'],['flac','无损测试.ncm','tone.flac'],['mp3','已有标签.ncm','tagged.mp3']]) {
  const audio = await readFile(new URL(source,dir));
  const cover = await readFile(new URL('cover.png',dir));
  const kd = aes(Buffer.concat([Buffer.from('neteasecloudmusic'),key]),'687a4852416d736f356b496e62617857').map(v=>v^0x64);
  const json = { musicName:'中文合成音', album:'本地测试专辑', artist:[['测试作者',1]], format: ext, albumPic:'https://cover.invalid/must-never-fetch.png' };
  const md = Buffer.from("163 key(Don't modify):"+aes(Buffer.from('music:'+JSON.stringify(json)),'2331346c6a6b5f215c5d2630553c2728').toString('base64')).map(v=>v^0x63);
  for (let i=0; i<audio.length; i++) { const j=(i+1)&255; audio[i]^=box[(box[j]+box[(box[j]+j)&255])&255]; }
  // Cover frame contains 16 bytes of unused allocation to test actual frame length.
  const out=Buffer.concat([Buffer.from('CTENFDAM'),Buffer.alloc(2),u32(kd.length),kd,u32(md.length),md,Buffer.alloc(5),u32(cover.length+16),u32(cover.length),cover,Buffer.alloc(16),audio]);
  await writeFile(new URL(name,dir),out);
}
// Independent legacy QMC encoder, translating the state machine in presburger seed.hpp.
const rows=[[74,214,202,144,103,247,82],[94,149,35,159,19,17,126],[71,116,61,144,170,63,81],[198,9,213,159,250,102,249],[243,214,161,144,160,247,240],[29,149,222,159,132,17,244],[14,116,187,144,188,63,146],[0,9,91,159,98,102,161]];
for (const [ext,source] of [['qmc0','mp3'],['qmc3','mp3'],['qmcflac','flac']]) {
  let x=-1,y=8,dx=1,index=-1;
  function next() { index++; let mask; if(x<0){dx=1;y=(8-y)%8;mask=195;}else if(x>6){dx=-1;y=7-y;mask=216;}else{mask=rows[y][x];}x+=dx;return index===32768||(index>32768&&(index+1)%32768===0)?next():mask; }
  const data=await readFile(new URL(`tone.${source}`,dir));
  for(let i=0;i<data.length;i++) data[i]^=next();
  await writeFile(new URL(`旧版.${ext}`,dir),data);
}
console.log('Generated 6 encrypted fixtures + original MP3/FLAC/PNG; duration=3s; source=synthetic 440Hz sine');
