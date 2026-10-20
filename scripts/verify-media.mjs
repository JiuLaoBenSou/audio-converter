// Codex, 2026-10-20. Independent FFmpeg/FFprobe verification of synthetic results.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { convert } from '../src/engine.mjs';
await mkdir('tests/output',{recursive:true});await mkdir('docs/verification',{recursive:true});
const outputs=[];
const cmd=(bin,args)=>execFileSync(bin,args,{encoding:'utf8'}).trim();
for(const input of ['合成测试.ncm','无损测试.ncm','旧版.qmc0','旧版.qmc3','旧版.qmcflac','已有标签.ncm']) {
  const result=await convert(new Uint8Array(await readFile(`tests/generated/${input}`)),input);
  const file=`tests/output/${result.name}`;await writeFile(file,result.audio);
  const probe=JSON.parse(cmd('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]));
  const audio=probe.streams.find(s=>s.codec_type==='audio');assert.equal(audio.codec_name,result.ext);
  assert.ok(Number(audio.duration||probe.format.duration)>=2.9);
  const decoded=cmd('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-f','md5','-']);
  const original=cmd('ffmpeg',['-v','error','-i',`tests/generated/${input==='已有标签.ncm'?'tagged.mp3':`tone.${result.ext}`}`,'-map','0:a:0','-f','md5','-']);
  assert.equal(decoded,original,'decoded PCM must match original');
  const tags=probe.format.tags||{};
  if(['合成测试.ncm','无损测试.ncm'].includes(input)){
    assert.equal(tags.title||tags.TITLE,'中文合成音');assert.equal(tags.album||tags.ALBUM,'本地测试专辑');
    assert.ok(probe.streams.some(s=>s.disposition?.attached_pic===1),'embedded cover should be readable');
    const cover=cmd('ffmpeg',['-v','error','-i',file,'-map','0:v:0','-f','md5','-']);
    const originalCover=cmd('ffmpeg',['-v','error','-i','tests/generated/cover.png','-f','md5','-']);assert.equal(cover,originalCover);
  }
  if(input==='已有标签.ncm')assert.equal(tags.title,'原有中文标题');
  outputs.push({input,output:file,bytes:result.audio.length,codec:audio.codec_name,duration:Number(audio.duration||probe.format.duration),pcm:decoded,title:tags.title||tags.TITLE,album:tags.album||tags.ALBUM,cover:probe.streams.some(s=>s.disposition?.attached_pic===1),warnings:result.warnings});
}
await writeFile('docs/verification/media.json',JSON.stringify(outputs,null,2));
console.log(`PASS ${outputs.length}/6: codec, duration, full PCM equality; Chinese tags and embedded cover (2 NCM); existing ID3 retained (1 NCM).`);
