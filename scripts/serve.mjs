// Codex, 2026-10-20. Loopback-only static preview, GET/HEAD only, dist only.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('dist');const log=[];await mkdir('docs/verification',{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const server=createServer(async(req,res)=>{
  log.push({method:req.method,url:req.url});await writeFile('docs/verification/server-requests.json',JSON.stringify(log,null,2));
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read only');return;}
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const data=await readFile(file),headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
    // Use the HTML policy as the single source of truth; workers stay offline.
    if(extname(file)==='.html'){
      const policy=data.toString().match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
      if(policy)headers['Content-Security-Policy']=policy[1];
    }else headers['Content-Security-Policy']="default-src 'none'; script-src 'self'; connect-src 'none'; object-src 'none'";
    res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
});
const port=Number(process.env.AUDIO_PREVIEW_PORT||4317);
server.listen(port,'127.0.0.1',()=>console.log(`Local preview: http://127.0.0.1:${port} (loopback only; Ctrl+C to stop)`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
