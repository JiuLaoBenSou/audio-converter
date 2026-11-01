import {ORDINARY,QMC,EXTRA} from './extended.mjs';
export function inputExpectation(name,lang='zh') {
  const en=lang==='en',ext=name.split('.').at(-1).toLowerCase();
  const known=['ncm',...ORDINARY,...QMC,...EXTRA].includes(ext);
  const label=known?ext.toUpperCase():(en?'unknown':'未知');
  const plan=!known?(en?'Extension not supported':'此后缀暂不支持'):ext==='mp3'?(en?'MP3 kept as-is after validation':'校验后保留 MP3 原文件'):ORDINARY.includes(ext)?(en?'→ 192 kbps MP3 if your browser can decode it':'→ 192 kbps MP3（需浏览器能够解码）'):(en?'Recover original audio; output not known yet':'尝试恢复原编码，实际输出待识别');
  return `${en?'File extension':'文件后缀'}: ${label} · ${plan}`;
}
export function errorCategory(message,lang='zh') {
  const categories=[[/取消/,['已取消','Cancelled']],[/超过|超时|限制|以内|过大|过多|内存/,['处理限制','Limit or resource issue']],[/浏览器|线程异常|处理线程/,['浏览器支持','Browser support issue']],[/暂不支持|不支持此扩展名|不能恢复|暂不能转换/,['暂不支持','Unsupported format or version']],[/损坏|截断|无效|为空|未识别|越界|密钥|编码/,['文件无效或版本不兼容','Invalid or unsupported file']]];
  return (categories.find(([pattern])=>pattern.test(message))?.[1]||['处理失败','Processing failed'])[lang==='en'?1:0];
}
export function inputGroup(name){const ext=name.split('.').at(-1).toLowerCase();return ext==='mp3'?'existing_mp3':ORDINARY.includes(ext)?'ordinary':['ncm',...QMC,...EXTRA].includes(ext)?'special':'unknown';}
export function failureOutcome(message){return ({'Cancelled':'cancel','Limit or resource issue':'limit','Browser support issue':'browser_decode','Unsupported format or version':'unsupported','Invalid or unsupported file':'invalid_or_unknown'})[errorCategory(message,'en')]||'other';}
