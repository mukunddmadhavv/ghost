const supabase = require('../lib/supabase');
const { supabaseAnon } = require('../lib/supabase');
const { createClient } = require('@supabase/supabase-js');

/**
 * Auth middleware — validates Supabase JWT Bearer token
 * Attaches decoded user to req.user
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required (Header or Query)' });
  }

  try {
    // Use dedicated anon client to validate user JWT
    const client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
    const { data, error } = await client.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token validation failed: ' + err.message });
  }
}

/**
 * Optional auth — doesn't require auth but attaches user if token present
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  return requireAuth(req, res, next);
}

module.exports = { requireAuth, optionalAuth };
