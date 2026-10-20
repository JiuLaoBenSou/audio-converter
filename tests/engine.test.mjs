// Codex, 2026-10-20. Synthetic fixtures are generated from a self-created sine wave.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
let engine = {};
try { engine = await import('../src/engine.mjs'); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
const read = async name => new Uint8Array(await readFile(new URL(`generated/${name}`, import.meta.url)));
test('engine exposes a local decoder', () => assert.equal(typeof engine.convert, 'function'));
for (const [input, output] of [['合成测试.ncm','tone.mp3'],['无损测试.ncm','tone.flac'],['旧版.qmc0','tone.mp3'],['旧版.qmc3','tone.mp3'],['旧版.qmcflac','tone.flac']]) {
  test(`restores exact encoded audio: ${input}`, async () => {
    assert.equal(typeof engine.convert, 'function');
    const result = await engine.convert(await read(input), input, { writeTags: false });
    assert.deepEqual(result.audio, await read(output));
    assert.equal(result.ext, output.split('.').at(-1));
  });
}
test('NCM reads Chinese metadata and embedded cover without URL fetch', async () => {
  assert.equal(typeof engine.convert, 'function');
  const result = await engine.convert(await read('合成测试.ncm'), '合成测试.ncm');
  assert.equal(result.metadata.musicName, '中文合成音');
  assert.equal(result.metadata.album, '本地测试专辑');
  assert.ok(result.audio.byteLength > (await read('tone.mp3')).byteLength);
  assert.equal(result.cover.byteLength, (await read('cover.png')).byteLength);
});
test('rejects unsupported extensions, malformed lengths and undecodable payload', async () => {
  assert.equal(typeof engine.convert, 'function');
  await assert.rejects(() => engine.convert(new Uint8Array(30), 'x.unknown'), /不支持/);
  await assert.rejects(() => engine.convert(new Uint8Array(4), 'x.ncm'), /NCM|截断/);
  const damaged = await read('合成测试.ncm'); damaged.fill(255, 10, 14);
  await assert.rejects(() => engine.convert(damaged, 'x.ncm'), /截断|长度/);
  await assert.rejects(() => engine.convert(new Uint8Array(80), 'x.qmc0'), /旧版|编码|暂不支持/);
});
test('filename and per-file memory limits are enforced', () => {
  assert.equal(typeof engine.outputName, 'function');
  assert.equal(engine.outputName('../中文:歌曲.ncm','flac'), '_中文_歌曲.flac');
  assert.throws(() => engine.validateInput({ name: '大.ncm', size: 101 * 1024 ** 2 }), /100 MB/);
  assert.throws(() => engine.validateInput({ name: '空.ncm', size: 0 }), /空/);
});
test('codec detection rejects a fake FLAC header after legacy QMC decoding', async()=>{
  const source=await read('旧版.qmcflac'),plain=await read('tone.flac');
  const fake=source.slice();for(let i=4;i<fake.length;i++)fake[i]^=plain[i];
  await assert.rejects(()=>engine.convert(fake,'伪音频.qmcflac'),/编码|旧版|暂不支持/);
});
test('preserves existing ID3 tags without losing comments to a tag rewrite',async()=>{
  const r=await engine.convert(await read('已有标签.ncm'),'已有标签.ncm');
  assert.ok(Buffer.from(r.audio).equals(Buffer.from(await read('tagged.mp3'))),'existing tagged audio must remain byte-identical');
  assert.match(r.warnings.join(' '),/保留.*ID3/);
});
