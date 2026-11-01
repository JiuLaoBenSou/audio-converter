import test from 'node:test';
import assert from 'node:assert/strict';
import {englishPages,contentNav,renderContentPage} from '../src/content-pages.mjs';
test('all six English help pages have independent canonical and Chinese counterparts',()=>{
  assert.equal(englishPages.length,6);
  for(const page of englishPages){const html=renderContentPage(page,"default-src 'none'",true);assert.match(html,new RegExp(`rel="canonical" href="https://zhuanmp3.com/en/${page.slug}.html"`));assert.ok(html.includes(`hreflang="zh-CN" href="https://zhuanmp3.com/${page.slug}.html"`));assert.doesNotMatch(page.body,/[\u3400-\u9fff]/);assert.ok(html.includes('<!--email_off--><a href="mailto:fanghong1994@gmail.com"'));}
  const nav=contentNav(true);for(const slug of ['about','contact','privacy','how-to-use','ncm-qmc','mp3-quality'])assert.ok(nav.includes(`href="./en/${slug}.html"`));assert.doesNotMatch(nav,/中文/);
});
test('technical English copy keeps recovery and lossy encoding distinct',()=>{
  const formats=englishPages.find(p=>p.slug==='ncm-qmc');assert.ok(formats);assert.match(formats.body,/extra keys/i);assert.match(formats.body,/original.*encoding/i);
  const quality=englishPages.find(p=>p.slug==='mp3-quality');assert.ok(quality);assert.match(quality.body,/192 kbps/);assert.match(quality.body,/cannot restore/i);assert.match(quality.body,/1\.44 MB/);
});
