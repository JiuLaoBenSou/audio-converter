// Codex, 2026-10-22. Local language preference only; no remote translation service.
import {updateSeo} from './seo.mjs';
let language='zh';
const listeners=new Set();
const copy={
  stepsTitle:['如何转换音频','How to convert audio'],
  steps:['选择或拖入文件，等待队列处理完成，再单独下载或打包下载。无需注册，原文件不会被修改。','Choose or drop your files, wait for processing to finish, then download individual results or a ZIP. No sign-up is required and original files are not modified.'],
  faqTitle:['常见问题','Common questions'],
  faqOggTitle:['OGG、FLAC、WAV 可以转 MP3 吗？','Can I convert OGG, FLAC and WAV to MP3?'],
  faqOgg:['浏览器能够解码的普通音频会转为 192 kbps MP3，每个文件最长 20 分钟、最大 100 MB；已有 MP3 原样保留。转为 MP3 属于有损编码，不会提升原音质。','Everyday audio that your browser can decode is converted to 192 kbps MP3, up to 20 minutes and 100 MB per file. Existing MP3 files are kept as-is. MP3 encoding is lossy and does not improve source quality.'],
  faqNcmTitle:['NCM、QMC 处理后一定是 MP3 吗？','Will NCM and QMC always become MP3?'],
  faqNcm:['不一定。特殊格式恢复原音频，结果可能是 MP3、FLAC 或 OGG。需要额外密钥的版本暂不支持。','No. Special-format recovery preserves the original audio, which may be MP3, FLAC or OGG. Versions requiring an additional key are not supported.'],
  faqFailureTitle:['为什么有的文件处理失败？','Why do some files fail?'],
  faqFailure:['可能是文件版本不受支持、内容损坏，或当前浏览器无法解码。可换用新版浏览器重试；仅修改文件后缀不能完成格式转换。','A file may use an unsupported version, be damaged, or require decoding your browser does not support. Try a current browser. Renaming a file extension does not convert its contents.'],
  title:['NCM/QMC转Mp3','NCM/QMC to MP3'],
  brand:['音频转换工具','Audio Converter'],
  home:['音频转换工具首页','Audio Converter home'],
  description:['普通音频转 MP3，恢复 NCM、QMC、KWM、KGM 等特殊音频，支持本地批量处理。','Convert audio to MP3 and recover supported NCM, QMC, KWM and KGM files locally in your browser.'],
  intro:['普通音频转 MP3，特殊格式恢复为原音频。','Convert everyday audio to MP3. Recover supported special formats in their original audio format.'],
  dropLabel:['音乐文件拖放区','Audio file drop area'],
  dropTitle:['拖入音乐文件，或点击选择','Drop your audio files here, or choose files'],
  select:['选择文件','Choose files'],
  selectLabel:['选择音乐文件','Choose audio files'],
  limits:['OGG · NCM · QMC · KWM · KGM 等 · 每个文件不超过 100 MB','OGG · NCM · QMC · KWM · KGM and more · Up to 100 MB per file'],
  queue:['处理队列','Processing queue'],
  zip:['↓ 打包下载','↓ Download ZIP'],
  clear:['清空','Clear'],
  empty:['还没有文件，选好后即可开始。','No files yet. Choose some audio to get started.'],
  results:['文件处理结果','File processing results'],
  formats:['查看格式与说明','Supported formats & details'],
  ordinaryTitle:['普通音频 → MP3：','Everyday audio → MP3: '],
  ordinary:['OGG / OPUS、FLAC、WAV、M4A / MP4、AAC 等。MP3 原样保留；其他格式以 192 kbps 编码，最长 20 分钟。能否转码取决于浏览器能否解码，WMA / APE / AIFF / DFF 可能无法处理。','OGG / OPUS, FLAC, WAV, M4A / MP4, AAC and more. Existing MP3 files are kept as-is. Other audio is encoded at 192 kbps, up to 20 minutes per file. Decoding depends on your browser; WMA / APE / AIFF / DFF may not work.'],
  restoredTitle:['恢复原音频：','Recover original audio: '],
  restored:['NCM、QMC0 / 2 / 3 / 4 / 6 / 8 / FLAC / OGG、MFLAC / MFLAC0、MGG / MGG0 / MGG1 / MGGL、MMP4、TKM、BKC 系列、KWM、KGM / KGMA / VPR、UC、X2M / X3M、MG3D、XM、TM 系列。','NCM, QMC0 / 2 / 3 / 4 / 6 / 8 / FLAC / OGG, MFLAC / MFLAC0, MGG / MGG0 / MGG1 / MGGL, MMP4, TKM, BKC variants, KWM, KGM / KGMA / VPR, UC, X2M / X3M, MG3D, XM and TM variants.'],
  principles:['处理说明','How your files are handled'],
  privacyTitle:['隐私保护','Privacy first'],
  privacy:['本站不收集或保存你的音频文件。','We do not collect or store your audio files.'],
  perFileTitle:['按文件处理','The right format for each file'],
  perFile:['普通音频转 MP3，特殊格式保留原编码。','Everyday audio becomes MP3. Special formats keep their original audio encoding.'],
  originalsTitle:['原文件保留','Your originals stay yours'],
  originals:['下载处理结果，原文件不会被修改。','Download the results. Your original files remain unchanged.'],
  footer:['技术预览 · 特殊格式不同版本的兼容性仍待补充','Technical preview · Compatibility with special-format versions is still being expanded.'],
  licenses:['开源归属','Open-source credits'],
  noscript:['此工具需要启用 JavaScript，音频在你的浏览器内处理。','Enable JavaScript to use this tool. Audio is processed in your browser.'],
  supportEyebrow:['一盏茶，一份鼓励','A little support goes a long way'],
  supportTitle:['陛下，可还顺手？','Buy me a coffee'],
  supportDescription:['若用着顺手，赏老奴一杯茶可好？','Found this helpful? Buy me a coffee and help keep this little tool going.'],
  supportNote:['自愿打赏，不影响下载。','Your download is ready. Supporting is always optional.'],
  close:['朕已阅','Not now'],
  closeHint:['点击“朕已阅”可关闭弹窗。','Click “Not now” to close this window.'],
  alipay:['支付宝收款码','Alipay'],
  wechat:['微信收款码','WeChat Pay'],
  useWechat:['朕用微信','Use WeChat Pay'],
  useAlipay:['朕用支付宝','Use Alipay'],
  switchWechat:['切换至微信收款码','Switch to WeChat Pay QR code'],
  switchAlipay:['切换至支付宝收款码','Switch to Alipay QR code'],
  alipayAlt:['作者的支付宝收款码',"Creator's Alipay payment QR code"],
  wechatAlt:['作者的微信收款码',"Creator's WeChat Pay payment QR code"],
  download:['下载','Download'],
  downloadLabel:['下载 {name}','Download {name}'],
  cancel:['取消','Cancel'],
  preview:['试听 {name}','Preview {name}'],
  progress:['{name} 处理进度','Processing progress for {name}'],
  fileCount:['{count} 个文件','{count} files'],
  summary:['{done} 个成功 · {failed} 个失败','{done} completed · {failed} failed'],
  running:[' · 正在本地处理',' · Processing locally'],
  releaseMemory:[' · 下载完成后可清空释放内存',' · Clear the queue after downloading to free memory'],
  packing:['打包 {percent}%','Packing {percent}%'],
  zipName:['御用音乐包.zip','Music Pack.zip'],
};

export function getLanguage(){return language;}
export function t(key,values={}){
  if(key==='fileCount'&&language==='en'&&Number(values.count)===1)return '1 file';
  const value=copy[key]?.[language==='en'?1:0]??key;
  return value.replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
}
export function staticText(key,lang){return copy[key]?.[lang==='en'?1:0]??key;}

const messages=new Map([
  ['不支持此扩展名。请查看页面中的格式列表。','Unsupported file extension. See the supported formats below.'],
  ['文件为空。','This file is empty.'],
  ['超过每个文件 100 MB 的当前限制，请使用桌面工具处理。','This file exceeds the 100 MB limit. Please use a desktop converter.'],
  ['队列最多保留 20 个文件，请下载后清空再添加。','The queue holds up to 20 files. Download and clear it before adding more.'],
  ['队列总输入不能超过 250 MB，请分批处理。','The total input limit is 250 MB. Please process smaller batches.'],
  ['正在打包，请完成后再添加文件。','Please wait for the ZIP to finish before adding more files.'],
  ['此浏览器不支持本地处理线程。请使用新版 Chrome、Edge、Firefox 或 Safari。','This browser does not support local processing workers. Use a recent Chrome, Edge, Firefox or Safari.'],
  ['当前浏览器无法启动本地处理线程。请通过 localhost 或 HTTPS 在现代浏览器打开。','Could not start a local processing worker. Open this page over localhost or HTTPS in a modern browser.'],
  ['处理超过 180 秒，已停止。请分批或使用桌面工具。','Processing stopped after 180 seconds. Try a smaller batch or a desktop converter.'],
  ['处理线程异常退出，可能内存不足或浏览器不兼容。','The processing worker stopped unexpectedly. Your browser may be incompatible or low on memory.'],
  ['结果总量超过 270 MB，请下载并清空后分批处理。','Results exceed 270 MB. Download and clear the queue before processing more files.'],
  ['打包总量超过 150 MB，请逐个下载，或清空后分批处理。','The ZIP limit is 150 MB. Download files individually or process smaller batches.'],
  ['打包失败，可能内存不足。已转换的文件仍可逐个下载。','Could not create the ZIP, possibly due to low memory. You can still download completed files individually.'],
  ['请通过本地 HTTP 服务打开此页面，直接双击 HTML 无法启动处理线程。','Open this page through a local HTTP server. Opening the HTML file directly cannot start processing workers.'],
  ['已取消。','Cancelled.'],['等待本地处理','Waiting to process locally'],['正在读取本地文件','Reading local file'],
  ['正在恢复原音频','Recovering original audio'],['正在编码 MP3','Encoding MP3'],['正在解码，准备转为 MP3','Decoding audio for MP3 conversion'],
  ['转换失败。','Conversion failed.'],['编码任务已失效。','The encoding task is no longer available.'],
  ['读取音频时长超时。','Timed out while reading the audio duration.'],
  ['浏览器无法解码此音频，请使用支持该编码的桌面转换工具。','Your browser cannot decode this audio. Use a desktop converter that supports its encoding.'],
  ['浏览器无法解码此音频，不能转换为 MP3。','Your browser cannot decode this audio for MP3 conversion.'],
  ['普通音频转 MP3 当前支持 20 分钟以内的文件。','MP3 conversion currently supports files up to 20 minutes long.'],
  ['解码后音频超过 256 MB，请缩短音频后重试。','Decoded audio exceeds 256 MB. Try a shorter file.'],
  ['解码音频超过 256 MB，请缩短音频后重试。','Decoded audio exceeds 256 MB. Try a shorter file.'],
  ['解码音频超过 256 MB。','Decoded audio exceeds 256 MB.'],
  ['MP3 编码需要 44.1 kHz 单声道或双声道音频。','MP3 encoding requires 44.1 kHz mono or stereo audio.'],
  ['已转为 192 kbps MP3；重新编码有损，原文件未修改。','Converted to 192 kbps MP3. Re-encoding is lossy; your original file is unchanged.'],
  ['元数据无法读取；已继续恢复音频。','Metadata could not be read. Audio recovery continued.'],
  ['已原样保留原音频 ID3 标签；NCM 标签和封面未覆盖。','Existing ID3 tags were kept. NCM tags and artwork did not overwrite them.'],
  ['标签写入失败，保留恢复的原音频。','Metadata could not be written. The recovered audio was kept.'],
  ['未识别到有效音频编码，文件可能损坏或版本不支持。','No valid audio encoding was found. The file may be damaged or its version unsupported.'],
  ['未识别到有效音频编码，文件损坏或实际为加密版本。','No valid audio encoding was found. The file may be damaged or encrypted.'],
  ['此文件版本暂不支持。','This file version is not supported yet.'],
  ['此酷狗加密版本暂不支持。','This Kugou encrypted-file version is not supported yet.'],
  ['JOOX OFL_EN 已识别；当前未接入可验证的恢复引擎，暂不能转换。','JOOX OFL_EN was recognized, but recovery is not supported yet.'],
  ['恢复后未识别到有效音频编码：密钥不匹配、文件损坏或此版本暂不支持。','Recovered data is not valid audio. The key may not match, the file may be damaged, or its version may be unsupported.'],
  ['文件字段截断。','A file data field is truncated.'],
  ['音频密钥不是有效 Base64。','The audio key is not valid Base64.'],['音频密钥编码无效。','The audio key encoding is invalid.'],
  ['音频密钥 TEA 长度无效。','The audio key has an invalid TEA block length.'],['音频密钥校验失败。','Audio key validation failed.'],
  ['音频密钥过短。','The audio key is too short.'],['音频密钥长度异常。','The audio key has an unexpected length.'],['音频密钥长度无效。','The audio key length is invalid.'],
  ['QMC 尾部长度异常。','The QMC footer has an invalid length.'],['QMC QTag 结构无效。','The QMC QTag structure is invalid.'],
  ['QMC musicex 尾部截断。','The QMC musicex footer is truncated.'],['QMC musicex 尾部长度异常。','The QMC musicex footer has an invalid length.'],
  ['酷狗恢复表损坏。','The Kugou recovery table is damaged.'],['酷狗 KGM/VPR/KGG 文件头无效。','The Kugou KGM/VPR/KGG header is invalid.'],
  ['酷狗音频偏移越界。','The Kugou audio offset is out of bounds.'],['旧版酷狗文件头过短。','The legacy Kugou header is too short.'],
  ['KWM 文件头无效或截断。','The KWM header is invalid or truncated.'],['XM 文件头无效。','The XM header is invalid.'],
  ['XM 音频偏移越界。','The XM audio offset is out of bounds.'],['喜马拉雅文件头截断。','The Ximalaya header is truncated.'],['TM 文件截断。','The TM file is truncated.'],
  ['MG3D 未找到有效的 WAV 恢复密钥，文件可能不属于此版本。','No valid MG3D WAV recovery key was found. This may be a different file version.'],
  ['NCM 加密块长度异常。','The NCM encrypted block length is invalid.'],['NCM 密钥或填充无效，可能为不支持的版本。','The NCM key or padding is invalid. This may be an unsupported version.'],
  ['NCM 文件头无效或文件已截断。','The NCM header is invalid or the file is truncated.'],['NCM 字段长度越界，文件已截断。','An NCM field is out of bounds. The file is truncated.'],
  ['NCM 密钥长度异常。','The NCM key length is invalid.'],['NCM 音频密钥无效。','The NCM audio key is invalid.'],['NCM 元数据长度超过 4 MB。','NCM metadata exceeds 4 MB.'],
  ['NCM 封面区长度异常。','The NCM artwork area has an invalid length.'],['元数据前缀无效','The metadata prefix is invalid.'],['元数据编码无效','The metadata encoding is invalid.'],
  ['未知元数据类型','Unknown metadata type.'],['元数据结构异常','The metadata structure is invalid.'],
  ['FLAC 元数据截断。','FLAC metadata is truncated.'],['FLAC 元数据长度无效。','The FLAC metadata length is invalid.'],
  ['FLAC 标签截断','FLAC tags are truncated.'],['FLAC 标签越界','FLAC tags are out of bounds.'],['FLAC 标签过多','There are too many FLAC tags.'],['FLAC 标签过大','FLAC tags are too large.'],
]);

export function translateMessage(message){
  if(language!=='en'||!message)return message;
  if(messages.has(message))return messages.get(message);
  let match=message.match(/^(已转换|已是 MP3|已恢复) · (.+)$/);
  if(match)return `${({'已转换':'Converted','已是 MP3':'Already MP3','已恢复':'Recovered'})[match[1]]} · ${match[2]}`;
  match=message.match(/^(.+) · (\d+)%$/);
  if(match)return `${translateMessage(match[1])} · ${match[2]}%`;
  match=message.match(/^已生成 (\d+) 个文件的 ZIP；下载由浏览器保存。$/);
  if(match)return `ZIP created with ${match[1]} ${match[1]==='1'?'file':'files'}. Your browser will save the download.`;
  return /[\u3400-\u9fff]/.test(message)?'This file could not be processed. Its format or version may not be supported.':message;
}

export function onLanguageChange(listener){listeners.add(listener);return()=>listeners.delete(listener);}
function applyLanguage(){
  document.documentElement.lang=language==='en'?'en':'zh-CN';
  updateSeo(language);
  document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=t(node.dataset.i18n);});
  document.querySelectorAll('[data-i18n-aria]').forEach(node=>node.setAttribute('aria-label',t(node.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-alt]').forEach(node=>node.setAttribute('alt',t(node.dataset.i18nAlt)));
  const selector=document.getElementById('language');if(selector)selector.value=language;
}
export function setupLanguage(){
  const selector=document.getElementById('language');
  let saved;try{saved=localStorage.getItem('audio-converter-language');}catch{}
  const query=new URL(location.href).searchParams.get('lang');
  language=['en','zh'].includes(query)?query:location.pathname.endsWith('/en.html')?'en':saved==='en'?'en':'zh';
  function syncUrl(){try{const url=new URL(location.href);url.pathname=new URL(language==='en'?'en.html':'./',url).pathname;url.searchParams.delete('lang');history.replaceState(null,'',url);}catch{}}
  syncUrl();
  try{localStorage.setItem('audio-converter-language',language);}catch{}
  applyLanguage();
  selector?.addEventListener('change',()=>{
    language=selector.value==='en'?'en':'zh';
    try{localStorage.setItem('audio-converter-language',language);}catch{}
    syncUrl();
    applyLanguage();for(const listener of listeners)listener();
  });
}
