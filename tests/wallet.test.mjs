import test from 'node:test';
import assert from 'node:assert/strict';
import {database} from './helpers/d1.mjs';
import {postMovement,walletSchema,walletState} from '../cloudflare/wallet/ledger.mjs';
import {walletRoute} from '../cloudflare/wallet/routes.mjs';
async function setup(){const db=database();db.sql.exec("CREATE TABLE zx_users(id TEXT PRIMARY KEY,status TEXT); INSERT INTO zx_users VALUES('a','active'),('b','active')");await walletSchema(db);return db}
const credit=(patch={})=>({userId:'a',kind:'credit',amountCents:10000,currency:'MXN',source:'test',reference:'payment-1',requestKey:'key-1',actor:'test-verifier',...patch});
test('a repeated provider payment credits only once; changed payload or owner is rejected',async()=>{
  const db=await setup();
  const rows=await Promise.all([postMovement(db,credit()),postMovement(db,credit())]);
  assert.equal(rows[0].id,rows[1].id);assert.equal((await walletState(db,'a')).availableCents,10000);
  await assert.rejects(postMovement(db,credit({amountCents:10001})),/CONFLICT/);
  await assert.rejects(postMovement(db,credit({userId:'b'})),/CONFLICT/);
  assert.equal((await walletState(db,'b')).availableCents,0);
});
test('competing debits cannot overspend; refund restores once and ledger stays immutable',async()=>{
  const db=await setup();await postMovement(db,credit());
  const buy=n=>credit({kind:'purchase',amountCents:7000,reference:'purchase-'+n,requestKey:'buy-'+n,orderId:'order-'+n});
  const out=await Promise.allSettled([postMovement(db,buy(1)),postMovement(db,buy(2))]);
  assert.equal(out.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await walletState(db,'a')).availableCents,3000);
  const purchase=out.find(r=>r.status==='fulfilled').value;
  const refund=credit({kind:'refund',amountCents:7000,reference:'refund-1',requestKey:'refund-key',orderId:purchase.order_id,reversesId:purchase.id});
  await postMovement(db,refund);await postMovement(db,refund);
  await assert.rejects(postMovement(db,{...refund,reference:'refund-2',requestKey:'different'}),/REJECTED/);
  assert.equal((await walletState(db,'a')).availableCents,10000);
  assert.throws(()=>db.sql.exec('UPDATE zx_wallet_ledger SET amount_cents=1'),/IMMUTABLE/);
  assert.throws(()=>db.sql.exec('DELETE FROM zx_wallet_ledger'),/IMMUTABLE/);
});
test('integer MXN, active owner, original order and refund amount are enforced',async()=>{
  const db=await setup();
  for(const patch of [{currency:'USDT'},{amountCents:1.5},{amountCents:-5},{amountCents:NaN},{amountCents:Number.MAX_SAFE_INTEGER+1}])await assert.rejects(postMovement(db,credit(patch)),/INVALID/);
  await assert.rejects(postMovement(db,credit({userId:'missing'})),/REJECTED/);
  await postMovement(db,credit());
  const p=await postMovement(db,credit({kind:'purchase',amountCents:2000,orderId:'o',reference:'p',requestKey:'p'}));
  for(const patch of [{amountCents:2001},{userId:'b'},{orderId:'other'}])await assert.rejects(postMovement(db,credit({kind:'refund',amountCents:2000,orderId:'o',reference:'r',requestKey:'r',reversesId:p.id,...patch})),/REJECTED/);
});
test('wallet HTTP is own-user read-only and disabled by default',async()=>{
  const DB=await setup(),url=new URL('https://test/api/wallet/me?userId=b'),json=(body,status=200)=>({body,status}),user={id:'a',status:'active'};
  await postMovement(DB,credit());
  assert.equal((await walletRoute(new Request(url),{DB},url,user,json)).status,503);
  assert.equal((await walletRoute(new Request(url),{DB,WALLET_READ_ENABLED:'true'},url,null,json)).status,401);
  const own=await walletRoute(new Request(url),{DB,WALLET_READ_ENABLED:'true'},url,user,json);
  assert.equal(own.body.availableCents,10000);
  assert.equal((await walletRoute(new Request(url,{method:'POST',body:JSON.stringify({amountCents:99999})}),{DB,WALLET_READ_ENABLED:'true'},url,user,json)).status,405);
});
