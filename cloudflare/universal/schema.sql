CREATE TABLE IF NOT EXISTS zx_smart_sync(provider TEXT PRIMARY KEY, stamp INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS zx_smart_catalog(provider TEXT NOT NULL, sku TEXT NOT NULL, details TEXT NOT NULL, PRIMARY KEY(provider,sku));
CREATE TABLE IF NOT EXISTS zx_smart_events(id TEXT PRIMARY KEY, order_id TEXT NOT NULL, buyer_ref TEXT, status TEXT NOT NULL, is_test INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS zx_smart_mapping(
 provider TEXT NOT NULL, sku TEXT NOT NULL, product_id TEXT NOT NULL, region TEXT NOT NULL,
 server TEXT NOT NULL, delivery TEXT NOT NULL, PRIMARY KEY(provider,sku)
);
-- Monetary values are integer micro-units. Operators must refresh expiring quotes.
CREATE TABLE IF NOT EXISTS zx_smart_terms(
 provider TEXT NOT NULL,currency TEXT NOT NULL,fx INTEGER NOT NULL,source_fee INTEGER NOT NULL,
 balance INTEGER NOT NULL,fee_mxn INTEGER NOT NULL,expires_at INTEGER NOT NULL,PRIMARY KEY(provider,currency)
);
CREATE TABLE IF NOT EXISTS zx_smart_trials(
 reference TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, provider TEXT NOT NULL, sku TEXT NOT NULL
);
-- Curated public identities shared by the store games feed and the reseller mirror.
CREATE TABLE IF NOT EXISTS zx_smart_products(
 product_id TEXT PRIMARY KEY, name TEXT NOT NULL, section TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0
);
