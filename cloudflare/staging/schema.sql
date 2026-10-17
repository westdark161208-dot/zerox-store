-- Apply ONLY to the newly approved staging identity database.
CREATE TABLE IF NOT EXISTS zx_users(id TEXT PRIMARY KEY,status TEXT NOT NULL CHECK(status IN ('active','disabled')));
CREATE TABLE IF NOT EXISTS zx_sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES zx_users(id),token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT);
CREATE TABLE IF NOT EXISTS zx_login_grants(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES zx_users(id),expires_at TEXT NOT NULL);
INSERT OR IGNORE INTO zx_users(id,status) VALUES('d8573fe7-331f-4248-a0ad-d99288c9a472','active');
