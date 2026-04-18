const supabase = require('../lib/supabase');
const { hashKey } = require('../lib/keys');

/**
 * Middleware to authenticate requests via the Ghost Secret Key
 * Validates the hashed key against the database and attaches owner_id to req.user
 */
async function requireApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  let key = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    key = authHeader.split(' ')[1];
  } else if (req.query.key) {
    key = req.query.key;
  }

  if (!key) {
    return res.status(401).json({ 
      error: 'API_KEY_REQUIRED', 
      message: 'A Ghost Secret Key (ghost_sk_...) is required to access this endpoint.' 
    });
  }

  if (!key.startsWith('ghost_sk_')) {
    return res.status(401).json({ 
      error: 'INVALID_KEY_FORMAT', 
      message: 'Invalid key format. Expected ghost_sk_live_...' 
    });
  }

  try {
    const keyHash = hashKey(key);

    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .select('owner_id, id')
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKeyRecord) {
      return res.status(401).json({ 
        error: 'INVALID_API_KEY', 
        message: 'The provided API key is invalid or has been revoked.' 
      });
    }

    // Attach user identity
    req.user = { id: apiKeyRecord.owner_id };
    req.apiKeyId = apiKeyRecord.id;

    // Track usage (non-blocking)
    supabase.from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id)
      .then();

    next();
  } catch (err) {
    console.error('API Key validation error:', err);
    return res.status(500).json({ error: 'INTERNAL_AUTH_ERROR' });
  }
}

module.exports = { requireApiKey };
