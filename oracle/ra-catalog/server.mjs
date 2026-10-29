// Dedicated loopback service; installation starts with enabled:false.
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import {isIP} from 'node:net';
import {Journal} from '../ra-purchase/store.mjs';
import {validSecret} from '../../cloudflare/ra-purchase/protocol.mjs';
import {createCatalogHandler} from './handler.mjs';
const configPath=process.env.RA_CATALOG_CONFIG_FILE;
if(!configPath||!path.isAbsolute(configPath)||fs.statSync(configPath).mode&0o077)throw Error('PRIVATE_CONFIG_REQUIRED');
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
if(typeof config.enabled!=='boolean'||!path.isAbsolute(config.journalPath||'')||fs.statSync(path.dirname(config.journalPath)).mode&0o077)throw Error('INVALID_CONFIGURATION');
if(config.enabled&&(!validSecret(config.proxySecret)||typeof config.apiKey!=='string'||!config.apiKey||config.apiKey===config.proxySecret||!isIP(config.sourceAddress)))throw Error('PURCHASE_CONFIGURATION_REQUIRED');
if(fs.existsSync(config.journalPath)&&fs.statSync(config.journalPath).mode&0o077)throw Error('PRIVATE_JOURNAL_REQUIRED');
process.umask(0o077);
const store=new Journal(config.journalPath);
function upstream(route,method,body){
 if(!(['/products/catalog','/wallet'].includes(route)&&method==='GET'||['/catalog/validate','/buy/catalog'].includes(route)&&method==='POST'||/^\/catalog\/orders\/[A-Za-z0-9_-]{1,120}$/.test(route)&&method==='GET'))throw Error('ROUTE_NOT_ALLOWED');
 if(!config.enabled)throw Error('DISABLED');
 return new Promise((resolve,reject)=>{
  const payload=body?JSON.stringify(body):null;
  const req=https.request({hostname:'panel.recargasamerica.com',path:'/api/v1'+route,method,localAddress:config.sourceAddress,headers:{Authorization:'Bearer '+config.apiKey,Accept:'application/json',...(payload?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}:{})}},res=>{
   let bytes=0,chunks=[];res.on('data',c=>{bytes+=c.length;if(bytes>3*1024*1024){res.destroy();reject(Error('BODY_TOO_LARGE'));}else chunks.push(c);});res.on('error',()=>reject(Error('PROVIDER_UNAVAILABLE')));res.on('end',()=>{try{resolve({httpStatus:res.statusCode,body:JSON.parse(Buffer.concat(chunks))});}catch{reject(Error('INVALID_PROVIDER_RESPONSE'));}});
  });
  req.setTimeout(10000,()=>req.destroy());req.on('error',()=>reject(Error('PROVIDER_UNAVAILABLE')));if(payload)req.write(payload);req.end();
 });
}
const handle=createCatalogHandler({config,store,upstream});
const server=http.createServer(async(req,res)=>{
 try{
  let size=0,parts=[];for await(const c of req){size+=c.length;if(size>16384){res.writeHead(413);res.end();return;}parts.push(c);}
  const r=await handle(new Request('http://127.0.0.1:8791'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})}));
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
 }catch{res.writeHead(503,{'Cache-Control':'no-store'});res.end();}
});
server.requestTimeout=45000;server.headersTimeout=10000;server.listen(8791,'127.0.0.1');
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{store.close();process.exit(0);}));
