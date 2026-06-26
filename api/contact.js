/**
 * Vercel / Node serverless contact API — POST /api/contact
 *
 * Supports EMAIL_PROVIDER=smtp (default when SMTP_* set) or resend.
 */
const { handleContactRequest } = require('../lib/contact-handler');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (err) {
    console.error('[contact] invalid JSON', err?.message);
    return res.status(400).json({ error: 'Invalid JSON body.', code: 'INVALID_JSON' });
  }

  const result = await handleContactRequest(body, process.env);
  return res.status(result.status).json(result.body);
};
