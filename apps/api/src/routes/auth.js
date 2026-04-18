const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const bs58 = require('bs58').default || require('bs58');
const nacl = require('tweetnacl');

const router = express.Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const body = RegisterSchema.parse(req.body);

    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { name: body.name },
    });

    if (error) return res.status(400).json({ error: error.message });

    // Store user in our users table
    const { error: dbErr } = await supabase
      .from('users')
      .insert({ id: data.user.id, email: body.email, name: body.name });

    if (dbErr) console.warn('DB insert warning:', dbErr.message);

    res.status(201).json({ message: 'User created', userId: data.user.id });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const body = LoginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me  (requires Bearer token)
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid token' });

  res.json({ user: data.user });
});

// POST /api/auth/wallet
router.post('/wallet', async (req, res) => {
  try {
    const { publicKey, signature } = req.body;
    if (!publicKey || !signature) {
      return res.status(400).json({ error: 'Missing publicKey or signature' });
    }

    const message = new TextEncoder().encode('Sign this message to log into tryghost.dev');
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);
    if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    const email = `${publicKey}@tryghost.dev`;
    // Generate a deterministic 32-char password for this Web3 user
    const basePwd = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'default_secret').substring(0, 20);
    const password = `${basePwd}_${publicKey.substring(0, 10)}`;

    let authResponse = await supabase.auth.signInWithPassword({ email, password });

    if (authResponse.error && authResponse.error.message.includes('Invalid login credentials')) {
      // User doesn't exist, create via admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: publicKey }
      });
      if (error) throw error;
      
      // Retry login
      authResponse = await supabase.auth.signInWithPassword({ email, password });
    }

    if (authResponse.error) throw authResponse.error;

    // Safely upsert into 'users' table 
    await supabase.from('users').upsert(
      { id: authResponse.data.user.id, email, name: publicKey },
      { onConflict: 'id' }
    );

    res.json({
      token: authResponse.data.session.access_token,
      user: {
        id: authResponse.data.user.id,
        email: authResponse.data.user.email,
        name: authResponse.data.user.user_metadata?.name,
      },
    });
  } catch (err) {
    console.error('Wallet auth error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
