// Codex, 2026-10-20.
export function uniqueName(name,used) {
  const dot=name.lastIndexOf('.'),stem=dot<0?name:name.slice(0,dot),ext=dot<0?'':name.slice(dot);
  let candidate=name,n=2;while(used.has(candidate.toLowerCase()))candidate=`${stem} (${n++})${ext}`;
  used.add(candidate.toLowerCase());return candidate;
}
export function admit(items,file) {
  if(items.length>=20)return '队列最多保留 20 个文件，请下载后清空再添加。';
  if(items.reduce((sum,item)=>sum+item.size,0)+file.size>250*1024**2)return '队列总输入不能超过 250 MB，请分批处理。';
  return null;
}
