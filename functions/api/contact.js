/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Bind these in Cloudflare Pages → Settings → Environment variables:
 *   EMAIL_PROVIDER=resend
 *   RESEND_API_KEY
 *   FROM_EMAIL
 *   SUPPORT_EMAIL
 *
 * Optional:
 *   CONTACT_DEBUG=true  (include extra fields in JSON error responses)
 */
import { handleContactRequest } from '../../lib/contact-worker.mjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    console.error('[contact] invalid JSON', err?.message);
    return json({ error: 'Invalid JSON body.', code: 'INVALID_JSON' }, 400);
  }

  const result = await handleContactRequest(body, env);
  return json(result.body, result.status);
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return onRequestOptions();
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}
