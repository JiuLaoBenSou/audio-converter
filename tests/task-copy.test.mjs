import test from 'node:test';
import assert from 'node:assert/strict';
import {inputExpectation,errorCategory} from '../src/task-copy.mjs';
test('input hints separate extension from detected encoding and keep recovery output unknown',()=>{
  assert.match(inputExpectation('song.ogg','zh'),/后缀.*OGG.*MP3/);
  assert.match(inputExpectation('song.mp3','en'),/kept as-is/);
  assert.match(inputExpectation('song.ncm','en'),/not known yet/);
  assert.doesNotMatch(inputExpectation('song.ncm','en'),/→ MP3/);
  assert.match(inputExpectation('song.UNKNOWN','en'),/not supported/i);
});
test('error categories preserve uncertainty and distinguish browser, limits and cancellation',()=>{
  assert.match(errorCategory('此文件版本暂不支持。','en'),/Unsupported/);
  assert.match(errorCategory('浏览器无法解码此音频，不能转换为 MP3。','en'),/Browser/);
  assert.match(errorCategory('NCM 字段长度越界，文件已截断。','en'),/Invalid or unsupported/);
  assert.match(errorCategory('普通音频转 MP3 当前支持 20 分钟以内的文件。','en'),/Limit/);
  assert.match(errorCategory('已取消。','zh'),/取消/);
});
