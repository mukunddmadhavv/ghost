const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const { deriveWalletPDA, getBalance, fetchWalletOnChain } = require('../lib/anchor');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const CreateWalletSchema = z.object({
  agentName: z.string().min(1).max(50),
  ownerPublicKey: z.string().min(32).max(44),
  policy: z.object({
    maxSpendPerDay:       z.number().positive().default(0.5),
    allowedRecipients:    z.array(z.string()).default([]),
    timeRestriction: z.object({
      enabled:   z.boolean().default(false),
      startHour: z.number().min(0).max(23).default(0),
      endHour:   z.number().min(0).max(23).default(23),
    }).default({}),
    requireApprovalAbove: z.number().positive().default(1.0),
    emergencyPaused:      z.boolean().default(false),
  }).default({}),
});

const UpdatePolicySchema = z.object({
  policy: z.object({
    maxSpendPerDay:       z.number().positive().optional(),
    allowedRecipients:    z.array(z.string()).optional(),
    timeRestriction: z.object({
      enabled:   z.boolean(),
      startHour: z.number().min(0).max(23),
      endHour:   z.number().min(0).max(23),
    }).optional(),
    requireApprovalAbove: z.number().positive().optional(),
    emergencyPaused:      z.boolean().optional(),
  }),
});

// ─── GET /api/wallets ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_wallets')
      .select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const walletsWithBalance = await Promise.allSettled(
      data.map(async (w) => ({
        ...w,
        balance_sol: await getBalance(w.pda_address).catch(() => 0),
      }))
    );

    res.json({
      wallets: walletsWithBalance.map(r =>
        r.status === 'fulfilled' ? r.value : r.reason
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/wallets ────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = CreateWalletSchema.parse(req.body);
    const programId = process.env.PROGRAM_ID || '3BKqA1CzLd27roSy4qi7T9S4LDdSVbndLasSb5dyMr6p';

    let pdaAddress = 'pending_deploy';
    let pdaBump    = 0;
    try {
      const { pda, bump } = await deriveWalletPDA(body.ownerPublicKey, body.agentName);
      pdaAddress = pda;
      pdaBump    = bump;
    } catch (err) {
      console.warn('PDA derivation skipped:', err.message);
    }

    const { data, error } = await supabase
      .from('agent_wallets')
      .insert({
        owner_id:         req.user.id,
        agent_name:       body.agentName,
        owner_public_key: body.ownerPublicKey,
        pda_address:      pdaAddress,
        pda_bump:         pdaBump,
        policy:           body.policy,
        is_active:        true,
        total_spent_today: 0,
        last_reset_at:    new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ wallet: data });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/wallets/:id ─────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agent_wallets')
      .select('*')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Wallet not found' });

    const balance = await getBalance(data.pda_address).catch(() => 0);

    // Try fetch on-chain state if PDA is deployed
    let onChain = null;
    if (data.pda_address !== 'pending_deploy') {
      onChain = await fetchWalletOnChain(data.pda_address).catch(() => null);
    }

    res.json({ wallet: { ...data, balance_sol: balance, on_chain: onChain } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/wallets/:id/policy ───────────────────────────────────────────
router.patch('/:id/policy', requireAuth, async (req, res) => {
  try {
    const body = UpdatePolicySchema.parse(req.body);

    const { data: existing, error: fetchErr } = await supabase
      .from('agent_wallets')
      .select('policy')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'Wallet not found' });

    const mergedPolicy = { ...existing.policy, ...body.policy };

    const { data, error } = await supabase
      .from('agent_wallets')
      .update({ policy: mergedPolicy, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // TODO: When anchor deployed with funded wallet, also call update_policy on-chain
    // const program = loadProgram();
    // await program.methods.updatePolicy({...}).accounts({...}).rpc();

    res.json({ wallet: data, message: 'Policy updated ✅' });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/wallets/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('agent_wallets')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Wallet deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
