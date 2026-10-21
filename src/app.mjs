// Codex, 2026-10-20. Files never leave this browser; no remote dependencies.
import JSZip from 'jszip';
import { validateInput, SUPPORTED } from './engine.mjs';
import { uniqueName, admit } from './batch.mjs';
import { decodeAudio } from './decode-audio.mjs';
import { setupSupportDialog } from './support.mjs';
const $=id=>document.getElementById(id);
const showSupport = setupSupportDialog();
$('files').accept=SUPPORTED.map(ext=>'.'+ext).join(',');
let items=[],running=false,generation=0,activeWorker=null,zipBusy=false,zipUrl=null;
const bytes=n=>n<1024**2?`${(n/1024).toFixed(1)} KB`:`${(n/1024**2).toFixed(1)} MB`;
function notice(message){$('notice').textContent=message;$('notice').hidden=!message;}
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function refresh(){
  $('empty').hidden=items.length>0;$('count').textContent=`${items.length} 个文件`;
  const done=items.filter(x=>x.state==='done').length,failed=items.filter(x=>x.state==='failed').length;
  $('zip').disabled=!done||running||zipBusy;$('clear').disabled=!items.length||zipBusy;
  $('select').disabled=zipBusy;
  $('summary').hidden=!items.length;$('summary').textContent=`${done} 个成功 · ${failed} 个失败${running?' · 正在本地处理':' · 下载完成后可清空释放内存'}`;
}
function renderItem(item){
  const row=el('li');row.className=item.state;row.dataset.state=item.state;
  const main=el('div');main.append(el('div','file-name',item.name),el('div','file-detail',`${bytes(item.size)}${item.outputName?` → ${item.outputName} · ${bytes(item.blob.size)}`:''}`));
  const state=el('div','file-state',item.message);main.append(state);
  if(item.state==='processing'){const progress=el('progress','file-progress');progress.max=100;progress.value=item.progress||0;progress.setAttribute('aria-label',`${item.name} 处理进度`);main.append(progress);}
  if(item.warnings?.length)main.append(el('div','file-detail',item.warnings.join(' ')));
  const actions=el('div','file-buttons');
  if(item.state==='done'){const a=el('a','', '下载');a.href=item.url;a.download=item.outputName;a.setAttribute('aria-label',`下载 ${item.outputName}`);actions.append(a);}
  if(item.state==='processing'||item.state==='queued'){const cancel=el('button','','取消');cancel.addEventListener('click',()=>{item.state='failed';item.message='已取消。';item.file=null;if(item.cancel)item.cancel();renderItem(item);refresh();});actions.append(cancel);}
  row.append(main,actions);
  if(item.state==='done'){const audio=el('audio','file-preview');audio.controls=true;audio.preload='none';audio.src=item.url;audio.setAttribute('aria-label',`试听 ${item.outputName}`);row.append(audio);}
  if(item.row)item.row.replaceWith(row);else $('list').append(row);item.row=row;
}
function convertInWorker(item){
  return new Promise((resolve,reject)=>{
    let worker,timer,finished=false;
    const finish=()=>{finished=true;clearTimeout(timer);worker?.terminate();if(activeWorker===worker)activeWorker=null;item.cancel=null;};
    item.cancel=()=>{finish();reject(Error('已取消。'));};
    try{worker=new Worker('./worker.js',{type:'module'});activeWorker=worker;}catch{finish();reject(Error('当前浏览器无法启动本地处理线程。请通过 localhost 或 HTTPS 在现代浏览器打开。'));return;}
    timer=setTimeout(()=>{finish();reject(Error('处理超过 180 秒，已停止。请分批或使用桌面工具。'));},180000);
    worker.onerror=()=>{finish();reject(Error('处理线程异常退出，可能内存不足或浏览器不兼容。'));};
    worker.onmessage=async({data})=>{if(finished)return;if(data.type==='progress'){item.progress=data.value;item.message=`${data.label} · ${data.value}%`;const p=item.row.querySelector('progress');if(p)p.value=data.value;item.row.querySelector('.file-state').textContent=item.message;}else if(data.type==='decode'){item.message='正在解码，准备转为 MP3';renderItem(item);try{const pcm=await decodeAudio(data.audio,data.mime,()=>!finished);if(!finished)worker.postMessage({type:'encode',...pcm},pcm.channels.map(c=>c.buffer));}catch(e){if(!finished){finish();reject(e);}}}else if(data.type==='done'){finish();resolve(data);}else if(data.type==='error'){finish();reject(Error(data.message));}};
    worker.postMessage({file:item.file});
  });
}
async function pump(){
  if(running)return;running=true;const current=generation;refresh();
  for(const item of items){
    if(current!==generation)break;if(item.state!=='queued')continue;
    item.state='processing';item.message='正在读取本地文件';renderItem(item);refresh();
    try{
      const result=await convertInWorker(item);if(current!==generation)break;
      const blob=new Blob([result.audio],{type:result.mime});
      const total=items.reduce((n,i)=>n+(i.blob?.size||0),0);
      if(total+blob.size>270*1024**2)throw Error('结果总量超过 270 MB，请下载并清空后分批处理。');
      const used=new Set(items.filter(i=>i.outputName).map(i=>i.outputName.toLowerCase()));
      item.outputName=uniqueName(result.name,used);item.blob=blob;item.url=URL.createObjectURL(blob);item.state='done';item.message=`${result.action==='transcoded'?'已转换':result.action==='original'?'已是 MP3':'已恢复'} · ${result.ext.toUpperCase()}`;item.warnings=result.warnings;
    }catch(e){if(current!==generation)break;item.state='failed';item.message=e.message;}
    item.file=null;renderItem(item);refresh();
  }
  running=false;refresh();if(items.some(i=>i.state==='queued'))pump();
}
function addFiles(files){
  if(zipBusy){notice('正在打包，请完成后再添加文件。');return;}
  if(!window.Worker){notice('此浏览器不支持本地处理线程。请使用新版 Chrome、Edge、Firefox 或 Safari。');return;}
  const messages=[];
  for(const file of files){
    let error;try{validateInput(file);}catch(e){error=e.message;}
    const limit=admit(items,file);if(limit){messages.push(limit);break;}
    const item={file:error?null:file,size:file.size,name:file.name,state:error?'failed':'queued',message:error||'等待本地处理'};items.push(item);renderItem(item);
  }
  notice(messages.join(' '));refresh();pump();
}
$('select').addEventListener('click',()=>$('files').click());
$('files').addEventListener('change',e=>{addFiles(e.target.files);e.target.value='';});
const zone=$('drop');let dragDepth=0;
document.addEventListener('dragover',e=>e.preventDefault());document.addEventListener('drop',e=>e.preventDefault());
zone.addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;zone.classList.add('dragging');});
zone.addEventListener('dragover',e=>e.preventDefault());
zone.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;zone.classList.remove('dragging');}});
zone.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;zone.classList.remove('dragging');addFiles(e.dataTransfer.files);});
$('clear').addEventListener('click',()=>{generation++;for(const i of items){i.cancel?.();if(i.url)URL.revokeObjectURL(i.url);}activeWorker?.terminate();items=[];$('list').replaceChildren();notice('');if(zipUrl){URL.revokeObjectURL(zipUrl);zipUrl=null;}refresh();});
$('zip').addEventListener('click',async()=>{
  const done=items.filter(i=>i.state==='done');
  if(done.reduce((n,i)=>n+i.blob.size,0)>150*1024**2){notice('打包总量超过 150 MB，请逐个下载，或清空后分批处理。');return;}
  zipBusy=true;refresh();const zip=new JSZip();let downloaded=false;
  try{
    for(const i of done)zip.file(i.outputName,await i.blob.arrayBuffer());
    const result=await zip.generateAsync({type:'blob',compression:'STORE'},({percent})=>$('zip').textContent=`打包 ${Math.round(percent)}%`);
    if(zipUrl)URL.revokeObjectURL(zipUrl);zipUrl=URL.createObjectURL(result);
    const a=el('a');a.href=zipUrl;a.download='本地音频.zip';document.body.append(a);a.click();a.remove();notice(`已生成 ${done.length} 个文件的 ZIP；下载由浏览器保存。`);
    downloaded=true;
  }catch{notice('打包失败，可能内存不足。已转换的文件仍可逐个下载。');}
  finally{zipBusy=false;$('zip').textContent='↓ 打包下载';refresh();}
  if(downloaded)showSupport();
});
if(location.protocol==='file:')notice('请通过本地 HTTP 服务打开此页面，直接双击 HTML 无法启动处理线程。');
