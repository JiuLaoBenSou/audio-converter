// Codex, 2026-10-22. Conversion dependencies are local; HTML also loads external AdSense.
import { build } from 'esbuild';
import { mkdir, copyFile, writeFile, readFile, readdir } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await mkdir('docs',{recursive:true});
await build({entryPoints:{app:'src/app.mjs',worker:'src/worker.mjs'},outdir:'dist',bundle:true,format:'esm',platform:'browser',target:['es2020'],minify:true,legalComments:'linked',metafile:true,plugins:[{name:'replaceable-lgpl-encoder',setup(build){build.onResolve({filter:/^@breezystack\/lamejs$/},()=>({path:'./vendor/lamejs.js',external:true}));}}]}).then(r=>writeFile('docs/build-meta.json',JSON.stringify(r.metafile,null,2)));
await mkdir('dist/vendor',{recursive:true});
await copyFile('node_modules/@breezystack/lamejs/dist/lamejs.js','dist/vendor/lamejs.js');
for(const name of ['index.html','style.css','THIRD_PARTY_NOTICES.md','CNAME'])await copyFile(name,`dist/${name}`);
await mkdir('dist/licenses',{recursive:true});
for(const name of await readdir('licenses'))await copyFile(`licenses/${name}`,`dist/licenses/${name}`);
await mkdir('dist/assets/support',{recursive:true});
for(const name of ['alipay.jpg','wechat.jpg'])await copyFile(`assets/support/${name}`,`dist/assets/support/${name}`);
console.log('Built dist/: conversion scripts, styles and licenses are local; Google AdSense loads externally.');
