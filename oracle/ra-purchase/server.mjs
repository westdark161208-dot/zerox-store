// PROPOSED isolated gateway; not installed or started by this repository.
// Node >=22.13 with node:sqlite. Does not touch read-only 8790, 8789 or Zerito.
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import {dirname} from 'node:path';
import {Journal} from './store.mjs';
import {createGateway} from './gateway.mjs';
const fail=()=>{throw Error('RA_GATEWAY_CONFIGURATION_REQUIRED');};
const configPath=process.env.RA_PURCHASE_CONFIG_FILE;
if(!configPath)fail();const mode=fs.statSync(configPath).mode;if(mode&0o077)fail();
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
if(typeof config.enabled!=='boolean'||!config.apiKey||config.apiKey===config.proxySecret||!config.journalPath?.startsWith('/')||config.sourceAddress!=='10.0.1.170')fail();
if(fs.statSync(dirname(config.journalPath)).mode&0o077)fail();
if(fs.existsSync(config.journalPath)&&(fs.statSync(config.journalPath).mode&0o077))fail();
process.umask(0o077);
const store=new Journal(config.journalPath);
const paths=new Set(['/products/catalog','/wallet','/catalog/validate','/buy/catalog']);
async function upstream(path,method,body,idempotencyKey){
 if(!paths.has(path)&&!/^\/catalog\/orders\/[A-Za-z0-9_-]{1,120}$/.test(path))fail();
 return new Promise((resolve,reject)=>{
 const payload=body?JSON.stringify(body):null;
 const req=https.request({hostname:'panel.recargasamerica.com',path:'/api/v1'+path,method,localAddress:'10.0.1.170',headers:{Authorization:'Bearer '+config.apiKey,Accept:'application/json',...(payload?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}:{}),...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})}},res=>{
 let bytes=0,chunks=[];res.on('data',c=>{bytes+=c.length;if(bytes>3*1024*1024){res.destroy();reject(Error('UPSTREAM_UNAVAILABLE'));}else chunks.push(c);});
 res.on('error',()=>reject(Error('UPSTREAM_UNAVAILABLE')));res.on('end',()=>{try{if(res.statusCode<200||res.statusCode>=300)throw Error();resolve(JSON.parse(Buffer.concat(chunks)));}catch{reject(Error('UPSTREAM_UNAVAILABLE'));}});
 });req.setTimeout(6000,()=>req.destroy());req.on('error',()=>reject(Error('UPSTREAM_UNAVAILABLE')));if(payload)req.write(payload);req.end();
 });
}
const handle=createGateway({config,store,upstream});
const server=http.createServer(async(req,res)=>{
 try{
 if(req.method==='GET'&&req.url==='/healthz'){
  res.writeHead(200,{
   'Content-Type':'application/json',
   'Cache-Control':'no-store'
  });
  res.end(JSON.stringify({
   ok:true,
   service:'zerox-ra-purchase-ff110',
   purchasesEnabled:config.enabled===true
  }));
  return;
 }
 let size=0,parts=[];for await(const c of req){size+=c.length;if(size>16384){res.writeHead(413);res.end();return;}parts.push(c);}
 const r=await handle(new Request('http://127.0.0.1:8791'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})}));
 res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));
 }catch{res.writeHead(503,{'Cache-Control':'no-store'});res.end();}
});server.requestTimeout=30000;server.headersTimeout=10000;server.listen(8791,'127.0.0.1');
