// Codex, 2026-10-28. One metadata source for static pages and in-place language changes.
const origin='https://zhuanmp3.com';
export const seo={
  zh:{url:origin+'/',title:'OGG、FLAC、WAV 转 MP3｜NCM/QMC 音频恢复 - 转MP3',description:'免费在线音频转换工具，支持 OGG、FLAC、WAV、M4A 等转 MP3，批量恢复受支持的 NCM/QMC 文件。音频在设备上处理，无需注册；特殊格式保留原编码，部分版本暂不支持。',locale:'zh_CN'},
  en:{url:origin+'/en.html',title:'OGG, FLAC & WAV to MP3 | NCM/QMC Audio Recovery - ZhuanMP3',description:'Convert OGG, FLAC, WAV and M4A to MP3 in your browser, or recover supported NCM/QMC files in batches. No sign-up or audio upload. Special formats keep their original encoding; version support varies.',locale:'en_US'}
};
export function updateSeo(lang){
  const entry=seo[lang];document.title=entry.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content',entry.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href',entry.url);
  for(const [key,value] of Object.entries({'og:title':entry.title,'og:description':entry.description,'og:url':entry.url,'og:locale':entry.locale}))document.querySelector(`meta[property="${key}"]`)?.setAttribute('content',value);
  for(const [key,value] of Object.entries({'twitter:title':entry.title,'twitter:description':entry.description}))document.querySelector(`meta[name="${key}"]`)?.setAttribute('content',value);
}
