// Closed customer wallet. MXN integer cents, separate from zx_r_ledger and provider funds.
// This service is internal: there is NO HTTP route to post arbitrary movements.
export async function walletSchema(db) {
  for (const sql of [
    `CREATE TABLE IF NOT EXISTS zx_wallet_ledger (
      id TEXT PRIMARY KEY,user_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('credit','purchase','refund')),
      amount_cents INTEGER NOT NULL CHECK(typeof(amount_cents)='integer' AND amount_cents!=0),
      currency TEXT NOT NULL CHECK(currency='MXN'),
      previous_balance INTEGER NOT NULL CHECK(typeof(previous_balance)='integer' AND previous_balance>=0),
      resulting_balance INTEGER NOT NULL CHECK(typeof(resulting_balance)='integer' AND resulting_balance>=0 AND resulting_balance<=9007199254740991),
      source TEXT NOT NULL,reference TEXT NOT NULL,request_key TEXT NOT NULL,
      order_id TEXT, reverses_id TEXT UNIQUE REFERENCES zx_wallet_ledger(id),
      actor TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status='confirmed'),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(source,reference),UNIQUE(user_id,request_key),
      CHECK(resulting_balance=previous_balance+amount_cents),
      CHECK((kind='purchase' AND amount_cents<0 AND order_id IS NOT NULL AND reverses_id IS NULL)
        OR (kind='credit' AND amount_cents>0 AND reverses_id IS NULL)
        OR (kind='refund' AND amount_cents>0 AND reverses_id IS NOT NULL))
    )`,
    'CREATE INDEX IF NOT EXISTS zx_wallet_user ON zx_wallet_ledger(user_id,created_at)',
    `CREATE TRIGGER IF NOT EXISTS zx_wallet_no_update BEFORE UPDATE ON zx_wallet_ledger
      BEGIN SELECT RAISE(ABORT,'WALLET_IMMUTABLE'); END`,
    `CREATE TRIGGER IF NOT EXISTS zx_wallet_no_delete BEFORE DELETE ON zx_wallet_ledger
      BEGIN SELECT RAISE(ABORT,'WALLET_IMMUTABLE'); END`
  ]) await db.prepare(sql).run();
}

function validate(m) {
  for(const key of ['userId','source','reference','requestKey','actor'])
    if(typeof m[key]!=='string'||!m[key].trim()||m[key].length>160)throw Error('WALLET_INVALID_MOVEMENT');
  if (m.currency!=='MXN'||!Number.isSafeInteger(m.amountCents)||m.amountCents<=0||
      !['credit','purchase','refund'].includes(m.kind))throw Error('WALLET_INVALID_MOVEMENT');
  if (m.orderId!=null && (typeof m.orderId!=='string'||!m.orderId||m.orderId.length>160))throw Error('WALLET_INVALID_MOVEMENT');
  if (m.kind==='purchase'&&!m.orderId)throw Error('WALLET_ORDER_REQUIRED');
  if (m.kind==='refund' ? typeof m.reversesId!=='string'||!m.reversesId : m.reversesId!=null)throw Error('WALLET_INVALID_REVERSAL');
}
function same(row,m,amount) {
  return row && row.user_id===m.userId && row.kind===m.kind && row.amount_cents===amount &&
    row.currency===m.currency && row.source===m.source && row.reference===m.reference &&
    row.request_key===m.requestKey && row.order_id===(m.orderId??null) &&
    row.reverses_id===(m.reversesId??null) && row.actor===m.actor;
}

export async function postMovement(db,m) {
  validate(m);
  const amount=m.kind==='purchase'?-m.amountCents:m.amountCents;
  const lookup=()=>db.prepare('SELECT * FROM zx_wallet_ledger WHERE source=? AND reference=?').bind(m.source,m.reference).first();
  const before=await lookup();
  if(before){if(!same(before,m,amount))throw Error('WALLET_IDEMPOTENCY_CONFLICT');return before}
  const id=crypto.randomUUID();
  // One atomic INSERT reads the current balance and conditionally debits it. No read-then-write balance field.
  // Purchase order must already have an immutable server-priced snapshot before calling this service.
  const statement=db.prepare(`INSERT INTO zx_wallet_ledger
    (id,user_id,kind,amount_cents,currency,previous_balance,resulting_balance,source,reference,request_key,order_id,reverses_id,actor)
    SELECT ?,?,?,?,'MXN',balance,balance+?,?,?,?,?,?,?
    FROM (SELECT COALESCE(SUM(amount_cents),0) balance FROM zx_wallet_ledger WHERE user_id=?)
    WHERE balance+? BETWEEN 0 AND 9007199254740991
      AND EXISTS(SELECT 1 FROM zx_users WHERE id=? AND status='active')
      AND (?!='refund' OR EXISTS(SELECT 1 FROM zx_wallet_ledger
        WHERE id=? AND user_id=? AND kind='purchase' AND amount_cents=? AND order_id=?))
    ON CONFLICT DO NOTHING`).bind(id,m.userId,m.kind,amount,amount,m.source,m.reference,m.requestKey,
      m.orderId??null,m.reversesId??null,m.actor,m.userId,amount,m.userId,m.kind,
      m.reversesId??null,m.userId,-m.amountCents,m.orderId??null);
  await statement.run();
  const saved=await lookup();
  if(!saved)throw Error('WALLET_MOVEMENT_REJECTED'); // insufficient balance, duplicate reversal/key or invalid owner/order
  if(!same(saved,m,amount))throw Error('WALLET_IDEMPOTENCY_CONFLICT');
  return saved;
}

export async function walletState(db,userId) {
  const row=await db.prepare('SELECT COALESCE(SUM(amount_cents),0) balance FROM zx_wallet_ledger WHERE user_id=?').bind(userId).first();
  const movements=await db.prepare(`SELECT id,kind,amount_cents AS amountCents,currency,
    previous_balance AS previousBalanceCents,resulting_balance AS resultingBalanceCents,
    order_id AS orderId,status,created_at AS createdAt FROM zx_wallet_ledger
    WHERE user_id=? ORDER BY rowid DESC LIMIT 50`).bind(userId).all();
  return {currency:'MXN',availableCents:row.balance,movements:movements.results};
}
