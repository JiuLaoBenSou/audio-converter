// Codex, 2026-10-22. Conversion dependencies are local; HTML also loads external AdSense.
import { build } from 'esbuild';
import { mkdir, copyFile, writeFile, readFile, readdir } from 'node:fs/promises';
import {staticText} from '../src/i18n.mjs';
import {seo} from '../src/seo.mjs';
import {contentPages,contentNav,renderContentPage} from '../src/content-pages.mjs';
await mkdir('dist',{recursive:true});
await mkdir('docs',{recursive:true});
await build({entryPoints:{app:'src/app.mjs',worker:'src/worker.mjs'},outdir:'dist',bundle:true,format:'esm',platform:'browser',target:['es2020'],minify:true,legalComments:'linked',metafile:true,plugins:[{name:'replaceable-lgpl-encoder',setup(build){build.onResolve({filter:/^@breezystack\/lamejs$/},()=>({path:'./vendor/lamejs.js',external:true}));}}]}).then(r=>writeFile('docs/build-meta.json',JSON.stringify(r.metafile,null,2)));
await mkdir('dist/vendor',{recursive:true});
await copyFile('node_modules/@breezystack/lamejs/dist/lamejs.js','dist/vendor/lamejs.js');
for(const name of ['index.html','style.css','content.css','favicon.svg','ads.txt','robots.txt','sitemap.xml','THIRD_PARTY_NOTICES.md','CNAME'])await copyFile(name,`dist/${name}`);
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const template=await readFile('index.html','utf8');
for(const [lang,filename] of [['zh','index.html'],['en','en.html']]){
  const entry=seo[lang];let html=template.replace('<html lang="zh-CN">',`<html lang="${lang==='en'?'en':'zh-CN'}">`);
  html=html.replace(/<([a-z0-9]+)([^>]*\bdata-i18n="([^"]+)"[^>]*)>[^<]*<\/\1>/g,(_,tag,attrs,key)=>`<${tag}${attrs}>${escape(staticText(key,lang))}</${tag}>`);
  for(const [marker,attr] of [['aria','aria-label'],['alt','alt']])html=html.replace(/<[^>]+>/g,tag=>{const key=tag.match(new RegExp(`data-i18n-${marker}="([^"]+)"`))?.[1];return key?tag.replace(new RegExp(`${attr}="[^"]*"`),`${attr}="${escape(staticText(key,lang))}"`):tag;});
  html=html.replace(/<title>[^<]*<\/title>/,`<title>${escape(entry.title)}</title>`);
  for(const [attr,key,value] of [['name','description',entry.description],['property','og:title',entry.title],['property','og:description',entry.description],['property','og:url',entry.url],['property','og:locale',entry.locale],['name','twitter:title',entry.title],['name','twitter:description',entry.description]])html=html.replace(new RegExp(`<meta ${attr}="${key}" content="[^"]*">`),`<meta ${attr}="${key}" content="${escape(value)}">`);
  html=html.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${entry.url}">`);
  html=html.replace('<!-- CONTENT_NAV -->',contentNav(lang==='en'));
  if(lang==='en')html=html.replace('id="count">0 个文件','id="count">0 files').replace('id="support-method" aria-live="polite">支付宝收款码','id="support-method" aria-live="polite">Alipay').replace('aria-label="切换至微信收款码">朕用微信','aria-label="Switch to WeChat Pay QR code">Use WeChat Pay').replace('<option value="en"','<option value="en" selected');
  await writeFile(`dist/${filename}`,html);
}
const policy=template.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
for(const page of contentPages)await writeFile(`dist/${page.slug}.html`,renderContentPage(page,policy));
await mkdir('dist/assets/help',{recursive:true});
for(const name of ['select.svg','queue.svg','download.svg'])await copyFile(`assets/help/${name}`,`dist/assets/help/${name}`);
await mkdir('dist/licenses',{recursive:true});
for(const name of await readdir('licenses'))await copyFile(`licenses/${name}`,`dist/licenses/${name}`);
await mkdir('dist/assets/support',{recursive:true});
for(const name of ['alipay.jpg','wechat.jpg'])await copyFile(`assets/support/${name}`,`dist/assets/support/${name}`);
console.log('Built dist/: conversion scripts, styles and licenses are local; Google AdSense loads externally.');
