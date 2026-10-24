import http from 'node:http';
import {createGateway} from '../../oracle/ra-purchase/gateway.mjs';
import {Journal} from '../../oracle/ra-purchase/store.mjs';
import {validSecret} from '../../cloudflare/ra-purchase/protocol.mjs';
import {product,simulatedUpstream} from './fixture.mjs';
// No upstream URL, API key or configuration-file parameter is accepted.
export function createHarness({journalPath,proxySecret,mode='success'}){
 if(!validSecret(proxySecret)||!journalPath)throw Error('STAGING_CONFIGURATION_REQUIRED');
 const sim=simulatedUpstream(mode),store=new Journal(journalPath);
 const handler=createGateway({store,upstream:sim.upstream,config:{enabled:true,proxySecret,product:{verified:true,productId:product.id,sku:product.sku,name:product.name,field:'player_id',baseDiamonds:100,bonusDiamonds:10,region:'US',bonusEvidence:'SIMULATION ONLY',maxPriceUsd:1}}});
 const server=http.createServer(async(req,res)=>{
 try{
 let size=0,parts=[];for await(const c of req){size+=c.length;if(size>16384){res.writeHead(413);res.end();return;}parts.push(c);}
 const response=await handler(new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(parts)}:{})}));
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(503);res.end();}
 });
 server.requestTimeout=10000;server.headersTimeout=5000;
 return {handler,calls:sim.calls,async listen(port=0){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});return server.address().port;},async close(){await new Promise(resolve=>server.close(resolve));store.close();}};
}
