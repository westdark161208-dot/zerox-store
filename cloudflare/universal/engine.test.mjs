import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {selectOffer,verifyRechargeEvent} from './engine.mjs';
const order = {productId:'fixture',region:'MX',server:'global',delivery:'code',saleMxn:120,marginBps:1000};
const offer = {...order,provider:'a',key:'1',approved:true,enabled:true,available:true,expiresAt:2,sourceCost:50,sourceFee:1,fx:2000000,balance:51,feeMxn:3};
test('compare fully loaded costs at the actual channel sale price', () => {
  const b = {...offer,provider:'b',fx:1999999,feeMxn:2};
  assert.deepEqual(selectOffer(order,[offer,b],1),{provider:'b',key:'1',costMxn:104});
  for(const change of [{balance:50},{feeMxn:7},{region:'BR'},{approved:false},{expiresAt:1},{fx:null}])
    assert.equal(selectOffer(order,[{...offer,...change}],1),null);
});
test('signed raw bytes, altered payload, and expired delivery',async () => {
  const raw = new TextEncoder().encode('{"a":1}');
  const sig = createHmac('sha256','fixture').update('evt.1000.').update(raw).digest('base64');
  const headers = new Headers({'webhook-id':'evt','webhook-timestamp':'1000','webhook-signature':'v1,'+sig});
  const secret = 'whsec_'+btoa('fixture');
  assert.equal(await verifyRechargeEvent(headers,raw,secret,1000000),'evt');
  await assert.rejects(verifyRechargeEvent(headers,raw.slice(1),secret,1000000));
  await assert.rejects(verifyRechargeEvent(headers,raw,secret,1400000));
});
