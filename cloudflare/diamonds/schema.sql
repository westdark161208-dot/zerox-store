CREATE TABLE IF NOT EXISTS zx_diamond_orders (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, request_key TEXT NOT NULL,
 product_id TEXT NOT NULL, player_id TEXT NOT NULL, diamonds INTEGER NOT NULL,
 sale_price_cents INTEGER NOT NULL, provider_cost_cents INTEGER NOT NULL,
 snapshot_json TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
 payment_reference TEXT UNIQUE, paid_at TEXT, delivered INTEGER NOT NULL DEFAULT 0,
 lock_token TEXT, lock_until INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(user_id,request_key)
);
CREATE TABLE IF NOT EXISTS zx_diamond_operations (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES zx_diamond_orders(id),
 sequence INTEGER NOT NULL, diamonds INTEGER NOT NULL, player_id TEXT NOT NULL,
 provider_cost_cents INTEGER NOT NULL, provider_name TEXT, provider_sku TEXT,
 state TEXT NOT NULL DEFAULT 'PENDING', attempts INTEGER NOT NULL DEFAULT 0,
 actual_cost_cents INTEGER, provider_reference TEXT, receipt_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(order_id,sequence)
);
CREATE TABLE IF NOT EXISTS zx_diamond_events (
 id TEXT PRIMARY KEY, operation_id TEXT NOT NULL, event TEXT NOT NULL,
 payload_json TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS zx_diamond_operation_order ON zx_diamond_operations(order_id,sequence);
