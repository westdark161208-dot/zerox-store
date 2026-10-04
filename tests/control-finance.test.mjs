import {test} from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {controlRoute} from '../cloudflare/control/routes.mjs';
import {walletSchema} from '../cloudflare/wallet/ledger.mjs';
const owner={id:'owner',status:'active',isFounder:true};
const call=(db,path='',user=owner,method='GET')=>{
  const request=new Request('https://test/api/admin/control/wallet'+path,{method});
  return controlRoute(request,{DB:db},new URL(request.url),user,(body,status=200)=>new Response(JSON.stringify(body),{status}));
};
test('wallet audit denies unauthorized users and writes before DB access; private responses no-store',async()=>{
  const db={prepare(){throw Error('must not query');}};
  for(const user of [null,{status:'active',isFounder:false},{...owner,status:'disabled'}]){
    const r=await call(db,'',user);assert.equal(r.status,403);assert.equal(r.headers.get('Cache-Control'),'no-store');
  }
  assert.equal((await call(db,'',owner,'POST')).status,405);
});
test('audit does not initialize absent wallet tables and rejects invalid cursors',async()=>{
  const db=database();const data=await (await call(db)).json();assert.equal(data.available,false);assert.deepEqual(data.movements,[]);
  assert.equal(db.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table'").get().n,0);
  for(const cursor of ['0','-1','1.5','abc','9007199254740992'])assert.equal((await call(db,'?before='+cursor)).status,400);
});
test('audit paginates stable rowids without exposing user IDs, actors or payment references',async()=>{
  const db=database();await walletSchema(db);
  const insert=db.sql.prepare("INSERT INTO zx_wallet_ledger(id,user_id,kind,amount_cents,currency,previous_balance,resulting_balance,source,reference,request_key,actor) VALUES(?,'private-user','credit',100,'MXN',?,?, 'private-source',?,?,'private-actor')");
  for(let i=1;i<=25;i++)insert.run('movement-'+i,(i-1)*100,i*100,'private-reference-'+i,'private-key-'+i);
  const first=await (await call(db)).json();assert.equal(first.movements.length,20);assert.equal(first.nextCursor,'6');
  assert.equal(first.movements[0].id,'movement-25');assert.equal(first.movements[0].resultingBalanceCents,2500);
  const second=await (await call(db,'?before='+first.nextCursor)).json();assert.equal(second.movements.length,5);assert.equal(second.nextCursor,null);
  assert.equal(second.movements[0].id,'movement-5');
  assert.ok(!JSON.stringify(first).includes('private-'));assert.ok(!('cursor' in first.movements[0]));
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM zx_wallet_ledger').get().n,25);
});
