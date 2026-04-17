// Run this once to create all tables in your Supabase project
// Usage: node apps/api/scripts/setup-db.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agent Wallets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  owner_public_key TEXT NOT NULL DEFAULT '',
  pda_address TEXT NOT NULL DEFAULT 'pending_deploy',
  pda_bump INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  total_spent_today FLOAT DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  policy JSONB NOT NULL DEFAULT '{"maxSpendPerDay":0.5,"allowedRecipients":[],"timeRestriction":{"enabled":false,"startHour":0,"endHour":23},"requireApprovalAbove":1.0,"emergencyPaused":false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID,
  owner_id UUID NOT NULL,
  agent_name TEXT DEFAULT '',
  recipient_address TEXT NOT NULL,
  amount_sol FLOAT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON agent_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_owner ON audit_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_wallet ON audit_logs(wallet_id);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
`;

async function setupDb() {
  console.log('🗄️  Setting up Supabase schema...');
  console.log(`📡 Connecting to: ${process.env.SUPABASE_URL}`);

  // Split on semicolons, run each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      // Supabase doesn't expose raw SQL via JS — instruct user to run in SQL editor
      if (error) console.warn('Note:', error.message);
    } catch (e) {
        console.warn('Note:', e.message);
    }
  }

  // Test connection with a simple select
  const { data, error } = await supabase.from('agent_wallets').select('count').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.log('\n⚡ Tables not yet created. Please run the SQL in apps/api/supabase/schema.sql');
      console.log('   in your Supabase SQL Editor at: https://supabase.com/dashboard/project/amneaucklmuovnsnjrbi/sql\n');
    } else {
      console.error('❌ DB Error:', error.message);
    }
  } else {
    console.log('✅ Supabase connection OK! Tables are ready.');
  }
}

setupDb().catch(console.error);
