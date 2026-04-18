const crypto = require('crypto');

/**
 * Generates a random secure API key with prefix
 * Format: ghost_sk_live_[random_string]
 */
function generateKey() {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `ghost_sk_live_${randomBytes}`;
  const mask = `ghost_sk_live_...${randomBytes.slice(-4)}`;
  return { key, mask };
}

/**
 * Hashes an API key using SHA-256
 */
function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

module.exports = {
  generateKey,
  hashKey
};
