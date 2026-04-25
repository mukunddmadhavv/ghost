const express = require('express');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');
const { generateKey, hashKey } = require('../lib/keys');

const router = express.Router();

/**
 * GET /api/keys
 * List all API keys for the current user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    // 1. Try fetching all columns first
    let { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_mask, created_at, last_used_at')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    // 2. If it fails (likely due to missing columns), try the safest subset
    if (error && error.code === '42703') {
      console.warn('⚠️  api_keys schema drift detected, using ultimate fallback');
      const safeFetch = await supabase
        .from('api_keys')
        .select('id, created_at')
        .eq('owner_id', req.user.id)
        .order('created_at', { ascending: false });

      if (safeFetch.error) throw safeFetch.error;
      
      // Map with defaults for missing columns
      data = safeFetch.data.map(k => ({
        ...k,
        name: 'Ghost Secret Key',
        key_mask: 'ghost_sk_live_...',
        last_used_at: null
      }));
      error = null;
    }

    if (error) throw error;
    res.json({ keys: data || [] });
  } catch (err) {
    console.error('❌ Server error in GET /api/keys:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/keys/generate
 * Generate a new API key and return it (one-time)
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Key name is required' });

    // 1. Self-Healing: Ensure user exists in our DB before inserting key
    const { error: upsertError } = await supabase.from('users').upsert(
      { 
        id: req.user.id, 
        email: req.user.email, 
        name: req.user.user_metadata?.name || req.user.email 
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('❌ Self-healing upsert failed:', upsertError);
    }

    const { key, mask } = generateKey();
    const keyHash = hashKey(key);

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        owner_id: req.user.id,
        name,
        key_hash: keyHash,
        key_mask: mask
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }

    // Return the plain key ONLY ONCE here
    res.json({ 
      message: 'API Key generated successfully. Please save it now; you will not be able to see it again.',
      apiKey: key,
      details: data 
    });
  } catch (err) {
    console.error('❌ Server error in POST /api/keys/generate:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/keys/:id
 * Revoke an API key
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'API key revoked successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
