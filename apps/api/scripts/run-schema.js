// One-time Supabase schema setup using raw SQL via Postgres REST
// Run: node apps/api/scripts/run-schema.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_wallets_owner ON agent_wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_owner ON audit_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_wallet ON audit_logs(wallet_id);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
`;

function pgRestQuery(sqlStr) {
  return new Promise((resolve, reject) => {
    const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const body = JSON.stringify({ query: sqlStr });
    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('🗄️  Running schema against Supabase...');
  console.log('📡 Project:', SUPABASE_URL);

  const result = await pgRestQuery(sql);
  if (result.status >= 200 && result.status < 300) {
    console.log('✅ Schema ran successfully!');
  } else {
    console.log('ℹ️  Response:', result.status, result.data.slice(0, 200));
    console.log('\n📋 Please run the SQL manually in the Supabase SQL editor:');
    console.log(`   https://supabase.com/dashboard/project/amneaucklmuovnsnjrbi/sql/new`);
    console.log('   File: apps/api/supabase/schema.sql\n');
  }
}

run().catch(console.error);
