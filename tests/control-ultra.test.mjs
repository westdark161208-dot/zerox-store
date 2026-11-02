import test from 'node:test';
import assert from 'node:assert/strict';
import {controlBalances} from '../cloudflare/providers/control-balances.mjs';
const req=new Request('https://test.invalid/control');
const founder={isFounder:true,status:'active'};
const reply=(body,status=200)=>({body,status});
test('private three-provider summary converts zero and isolates failures',async()=>{
  const env={RECHARGEGAMES_API_KEY:'test',DB:{prepare:()=>({first:async()=>({settings_json:'{"usdMxn":19}'})})}};
  for(const balance of ['0','10']){
    const {body}=await controlBalances(req,env,founder,reply,async(url,opts)=>{
      assert.equal(url,'https://api.rechargegame.games/v1/balance');
      assert.equal(opts.headers['X-API-Key'],'test');
      return Response.json({balance_usdt:balance,ledger:[]});
    });
    assert.equal(body.balances.rg.mxn,Number(balance)*19);
    assert.equal(body.balances.ra.state,'Sin conexión');
    assert.equal(body.balances.sf.state,'Consulta no disponible');
  }
  assert.equal((await controlBalances(req,env,{},reply)).status,403);
});
