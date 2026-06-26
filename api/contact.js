/**
 * Vercel / Node serverless contact API — POST /api/contact
 *
 * Runtime: Node.js — reads secrets from process.env only.
 * (Cloudflare uses functions/api/contact.js + context.env — not this file.)
 */
const { handleContactRequest } = require('../lib/contact-handler');

/** Bump when deploying — confirm this value appears in Vercel logs. */
const HANDLER_VERSION = 'contact-api-node-v3';

function logVercelEnvCheck() {
  const env = process.env;
  console.info('[contact] env check (before validation)', {
    handlerVersion: HANDLER_VERSION,
    route: 'api/contact.js',
    runtime: 'node',
    envSource: 'process.env',
    vercelEnv: env.VERCEL_ENV || null,
    vercelUrl: env.VERCEL_URL || null,
    SUPPORT_EMAIL: Boolean(env.SUPPORT_EMAIL && String(env.SUPPORT_EMAIL).trim()),
    RESEND_API_KEY: Boolean(env.RESEND_API_KEY && String(env.RESEND_API_KEY).trim()),
    FROM_EMAIL: Boolean(env.FROM_EMAIL && String(env.FROM_EMAIL).trim()),
    EMAIL_PROVIDER: Boolean(env.EMAIL_PROVIDER && String(env.EMAIL_PROVIDER).trim()),
  });
}

module.exports = async function handler(req, res) {
  logVercelEnvCheck();

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
