const express = require('express');
const { z } = require('zod');
const { LAMPORTS_PER_SOL, PublicKey } = require('@solana/web3.js');
const { BN } = require('@coral-xyz/anchor');
const { loadProgram } = require('../lib/anchor');
const supabase = require('../lib/supabase');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireApiKey } = require('../middleware/apiKeyAuth');
const { broadcastAuditEvent } = require('./audit');

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
router.post('/execute', requireApiKey, async (req, res) => {
  try {
    const body = ExecutePaymentSchema.parse(req.body);

    // Fetch wallet (Strictly scoped to the API key owner)
    const { data: wallet, error: walletErr } = await supabase
      .from('agent_wallets')
      .select('*')
      .eq('id', body.walletId)
      .eq('owner_id', req.user.id)
      .single();

    if (walletErr || !wallet) {
      return res.status(404).json({ 
        status: 'REJECTED', 
        reason: 'WALLET_NOT_FOUND', 
        message: '❌ Agent wallet not found or access denied.' 
      });
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
      const { data: insertedLog } = await supabase.from('audit_logs').insert(auditEntry).select().single();
      if (insertedLog) broadcastAuditEvent(wallet.owner_id, insertedLog);
      return res.status(403).json({
        status: 'REJECTED',
        reason: rejectionReason,
        message: '❌ Transaction rejected by policy engine',
      });
    }

    // ── On-chain execution ────────────────────────────────────────────────────
    let txSig = null;
    const program = loadProgram();

    if (program && wallet.pda_address !== 'pending_deploy') {
      try {
        console.log(`⛓️ Executing Anchor Payment on PDA: ${wallet.pda_address}`);
        txSig = await program.methods.executePayment(new BN(auditEntry.amount_lamports))
          .accounts({
            wallet: new PublicKey(wallet.pda_address),
            recipient: new PublicKey(body.recipientAddress),
          })
          .rpc();
        console.log(`✅ On-chain transaction successful! Signature: ${txSig}`);
      } catch (chainErr) {
        console.error('❌ On-chain tx failed:', chainErr);
        // Record failed blockchain tx
        const { data: insertedLog } = await supabase.from('audit_logs').insert({
          ...auditEntry,
          status: 'REJECTED',
          rejection_reason: `ON_CHAIN_ERROR: ${chainErr.message}`
        }).select().single();

        if (insertedLog) broadcastAuditEvent(wallet.owner_id, insertedLog);

        return res.status(500).json({
          status: 'REJECTED',
          reason: `ON_CHAIN_ERROR: ${chainErr.message}`,
          message: '❌ Transaction rejected by Solana smart contract'
        });
      }
    } else {
      return res.status(400).json({
        status: 'REJECTED',
        reason: 'WALLET_NOT_INITIALIZED',
        message: '❌ This agent wallet has not been initialized on-chain yet.'
      });
    }

    auditEntry.tx_signature = txSig;

    // Update daily spend counter (reset if 24h passed)
    const hoursSinceReset = (Date.now() - new Date(wallet.last_reset_at).getTime()) / 3_600_000;
    const spentToday = hoursSinceReset > 24 ? 0 : (wallet.total_spent_today || 0);

    await supabase.from('agent_wallets').update({
      total_spent_today: spentToday + body.amountSol,
      last_reset_at:     hoursSinceReset > 24 ? new Date().toISOString() : wallet.last_reset_at,
    }).eq('id', body.walletId);

    const { data: insertedLog } = await supabase.from('audit_logs').insert(auditEntry).select().single();
    if (insertedLog) broadcastAuditEvent(wallet.owner_id, insertedLog);

    res.json({
      status:       'APPROVED',
      txSignature:  txSig,
      message:      '✅ Payment executed successfully',
      amountSol:    body.amountSol,
      recipient:    body.recipientAddress,
      solscanUrl:   `https://solscan.io/tx/${txSig}?cluster=devnet`,
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
