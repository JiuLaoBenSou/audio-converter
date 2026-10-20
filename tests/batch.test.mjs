import test from 'node:test';
import assert from 'node:assert/strict';
let batch={};try{batch=await import('../src/batch.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
test('ZIP names remain unique even when input already contains numbered names',()=>{
  assert.equal(typeof batch.uniqueName,'function');const used=new Set();
  assert.deepEqual(['a.mp3','a.mp3','a (2).mp3','A.MP3'].map(n=>batch.uniqueName(n,used)),['a.mp3','a (2).mp3','a (2) (2).mp3','A (3).MP3']);
});
test('queue caps retained inputs and file count before processing',()=>{
  assert.equal(typeof batch.admit,'function');
  assert.match(batch.admit([{size:1}].concat(Array(19).fill({size:1})), {size:1}),/20/);
  assert.match(batch.admit([{size:200*1024**2}],{size:100*1024**2}),/250 MB/);
  assert.equal(batch.admit([],{size:100}),null);
});
