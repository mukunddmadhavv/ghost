const express = require('express');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// In-memory SSE clients list
const sseClients = new Map();

// GET /api/audit — paginated audit log
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*, agent_wallets(agent_name)', { count: 'exact' })
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      logs: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audit/stream — Server-Sent Events for real-time updates
router.get('/stream', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = Date.now();
  sseClients.set(clientId, { res, userId: req.user.id });

  // Send a heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  }, 30000);

  // Initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, message: 'Audit stream connected' })}\n\n`);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

// Broadcast a new audit log entry to all connected SSE clients
function broadcastAuditEvent(userId, logEntry) {
  sseClients.forEach(({ res, userId: clientUserId }) => {
    if (clientUserId === userId) {
      res.write(`event: audit\ndata: ${JSON.stringify(logEntry)}\n\n`);
    }
  });
}

module.exports = router;
module.exports.broadcastAuditEvent = broadcastAuditEvent;
