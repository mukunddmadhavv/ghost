const express = require('express');
const { z } = require('zod');
const { LAMPORTS_PER_SOL } = require('@solana/web3.js');
const supabase = require('../lib/supabase');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const ExecutePaymentSchema = z.object({
  walletId:         z.string().uuid(),
  recipientAddress: z.string().min(32).max(44),
  amountSol:        z.number().positive(),
  description:      z.string().max(200).optional().default(''),
});

// ─── Policy validation (off-chain mirror of on-chain logic) ───────────────────
function validatePolicy(wallet, amountSol, recipientAddress) {
  const { policy, total_spent_today, last_reset_at } = wallet;

  // Reset daily counter if 24h passed
  const hoursSinceReset = (Date.now() - new Date(last_reset_at).getTime()) / 3_600_000;
  const spentToday = hoursSinceReset > 24 ? 0 : (total_spent_today || 0);

  if (policy.emergencyPaused) {
    return { allowed: false, rejectionReason: 'EMERGENCY_PAUSED: Wallet is frozen by owner' };
  }

  const newTotal = spentToday + amountSol;
  if (newTotal > policy.maxSpendPerDay) {
    return {
      allowed: false,
      rejectionReason: `DAILY_LIMIT_EXCEEDED: Would spend ${newTotal.toFixed(4)} SOL — limit is ${policy.maxSpendPerDay} SOL/day`,
    };
  }

  if (policy.allowedRecipients?.length > 0) {
    if (!policy.allowedRecipients.includes(recipientAddress)) {
      return {
        allowed: false,
        rejectionReason: `RECIPIENT_NOT_ALLOWED: ${recipientAddress.slice(0,8)}... not in allowlist`,
      };
    }
  }

  if (policy.timeRestriction?.enabled) {
    const currentHour = new Date().getUTCHours();
    const { startHour, endHour } = policy.timeRestriction;
    const inWindow = startHour <= endHour
      ? currentHour >= startHour && currentHour < endHour
      : currentHour >= startHour || currentHour < endHour;
    if (!inWindow) {
      return {
        allowed: false,
        rejectionReason: `TIME_RESTRICTED: Payments only allowed ${startHour}:00–${endHour}:00 UTC`,
      };
    }
  }

  if (amountSol > policy.requireApprovalAbove) {
    return {
      allowed: false,
      rejectionReason: `APPROVAL_REQUIRED: ${amountSol} SOL > threshold of ${policy.requireApprovalAbove} SOL`,
    };
  }

  return { allowed: true, rejectionReason: null };
}

// ─── POST /api/payments/execute ───────────────────────────────────────────────
router.post('/execute', optionalAuth, async (req, res) => {
  try {
    const body = ExecutePaymentSchema.parse(req.body);

    // Fetch wallet (no auth check for demo mode)
    const query = supabase
      .from('agent_wallets')
      .select('*')
      .eq('id', body.walletId);

    if (req.user) query.eq('owner_id', req.user.id);

    const { data: wallet, error: walletErr } = await query.single();

    if (walletErr || !wallet) {
      // Demo mode: simulate with default policy
      const demoPolicy = {
        maxSpendPerDay: 0.5,
        allowedRecipients: [],
        timeRestriction: { enabled: false },
        requireApprovalAbove: 1.0,
        emergencyPaused: false,
      };
      const demoWallet = { policy: demoPolicy, total_spent_today: 0, last_reset_at: new Date().toISOString(), agent_name: 'Demo Agent' };
      const { allowed, rejectionReason } = validatePolicy(demoWallet, body.amountSol, body.recipientAddress);

      if (!allowed) {
        return res.status(403).json({ status: 'REJECTED', reason: rejectionReason, message: '❌ Transaction rejected by policy engine' });
      }
      return res.json({ status: 'APPROVED', txSignature: `demo_${Date.now()}`, message: '✅ Payment executed (demo mode)' });
    }

    if (!wallet.is_active) return res.status(400).json({ error: 'Wallet is inactive' });

    // Policy validation
    const { allowed, rejectionReason } = validatePolicy(wallet, body.amountSol, body.recipientAddress);

    const auditEntry = {
      wallet_id:        body.walletId,
      owner_id:         wallet.owner_id,
      agent_name:       wallet.agent_name,
      recipient_address: body.recipientAddress,
      amount_sol:       body.amountSol,
      amount_lamports:  Math.floor(body.amountSol * LAMPORTS_PER_SOL),
      description:      body.description,
      status:           allowed ? 'APPROVED' : 'REJECTED',
      rejection_reason: rejectionReason,
      tx_signature:     null,
    };

    if (!allowed) {
      await supabase.from('audit_logs').insert(auditEntry);
      return res.status(403).json({
        status: 'REJECTED',
        reason: rejectionReason,
        message: '❌ Transaction rejected by policy engine',
      });
    }

    // ── On-chain execution placeholder ──────────────────────────────────────
    // When anchor deployed + wallet funded, send real tx:
    // const program = loadProgram();
    // const txSig = await program.methods.executePayment(new BN(amountLamports))
    //   .accounts({ wallet: pdaPublicKey, recipient: new PublicKey(body.recipientAddress) })
    //   .rpc();
    const mockTxSig = `ghost_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    auditEntry.tx_signature = mockTxSig;

    // Update daily spend counter (reset if 24h passed)
    const hoursSinceReset = (Date.now() - new Date(wallet.last_reset_at).getTime()) / 3_600_000;
    const spentToday = hoursSinceReset > 24 ? 0 : (wallet.total_spent_today || 0);

    await supabase.from('agent_wallets').update({
      total_spent_today: spentToday + body.amountSol,
      last_reset_at:     hoursSinceReset > 24 ? new Date().toISOString() : wallet.last_reset_at,
    }).eq('id', body.walletId);

    await supabase.from('audit_logs').insert(auditEntry);

    res.json({
      status:       'APPROVED',
      txSignature:  mockTxSig,
      message:      '✅ Payment executed successfully',
      amountSol:    body.amountSol,
      recipient:    body.recipientAddress,
      solscanUrl:   `https://solscan.io/tx/${mockTxSig}?cluster=devnet`,
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    console.error('Payment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/payments/history ────────────────────────────────────────────────
router.get('/history', requireAuth, async (req, res) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(req.query.limit) || 50);

    if (req.query.walletId) query = query.eq('wallet_id', req.query.walletId);
    if (req.query.status)   query = query.eq('status', req.query.status.toUpperCase());

    const { data, error } = await query;
    if (error) throw error;
    res.json({ history: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
