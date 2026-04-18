-- ═══════════════════════════════════════════════════════════════
-- tryghost.dev — Supabase Database Schema
-- 
-- HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/amneaucklmuovnsnjrbi/sql/new
-- 2. Paste this entire file and click "Run"
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agent Wallets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_wallets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL,
  agent_name        TEXT NOT NULL,
  owner_public_key  TEXT NOT NULL DEFAULT '',
  pda_address       TEXT NOT NULL DEFAULT 'pending_deploy',
  pda_bump          INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  total_spent_today FLOAT DEFAULT 0,
  last_reset_at     TIMESTAMPTZ DEFAULT NOW(),
  policy            JSONB NOT NULL DEFAULT '{
    "maxSpendPerDay": 0.5,
    "allowedRecipients": [],
    "timeRestriction": {"enabled": false, "startHour": 0, "endHour": 23},
    "requireApprovalAbove": 1.0,
    "emergencyPaused": false
  }'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id         UUID,
  owner_id          UUID NOT NULL,
  agent_name        TEXT DEFAULT '',
  recipient_address TEXT NOT NULL,
  amount_sol        FLOAT NOT NULL,
  amount_lamports   BIGINT NOT NULL,
  description       TEXT DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason  TEXT,
  tx_signature      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── API Keys ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  key_mask      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallets_owner   ON agent_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_owner     ON audit_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_wallet    ON audit_logs(wallet_id);
CREATE INDEX IF NOT EXISTS idx_audit_status    ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_apikeys_owner   ON api_keys(owner_id);
CREATE INDEX IF NOT EXISTS idx_apikeys_hash    ON api_keys(key_hash);

-- ─── Seed demo data (runs only if table is empty) ─────────────────────────────
INSERT INTO agent_wallets (id, owner_id, agent_name, owner_public_key, pda_address, policy)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Demo: Trading Bot Alpha',
  'CjHkrQk9yB5eBtUW5jbzpzGgPw7RZ2R9YXmkGAgdGUTA',
  'pending_deploy',
  '{"maxSpendPerDay":0.5,"allowedRecipients":[],"timeRestriction":{"enabled":true,"startHour":9,"endHour":21},"requireApprovalAbove":1.0,"emergencyPaused":false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM agent_wallets LIMIT 1);

INSERT INTO audit_logs (wallet_id, owner_id, agent_name, recipient_address, amount_sol, amount_lamports, description, status, tx_signature)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Demo: Trading Bot Alpha',
  'CjHkrQk9yB5eBtUW5jbzpzGgPw7RZ2R9YXmkGAgdGUTA',
  0.01, 10000000,
  'API micropayment',
  'APPROVED',
  'ghost_demo_abc123'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs LIMIT 1);

INSERT INTO audit_logs (wallet_id, owner_id, agent_name, recipient_address, amount_sol, amount_lamports, description, status, rejection_reason)
SELECT
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Demo: Trading Bot Alpha',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv',
  2.0, 2000000000,
  'Attempted large payment',
  'REJECTED',
  'DAILY_LIMIT_EXCEEDED: Would spend 2.5 SOL today, limit is 0.5 SOL'
WHERE (SELECT COUNT(*) FROM audit_logs) < 2;
