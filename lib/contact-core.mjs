/**
 * Provider-agnostic contact form validation (ESM — used by Cloudflare Workers).
 */

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
const MAX_DISCORD = 64;
const MAX_ORDER_ID = 64;

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePayload(body) {
  const errors = [];

  const name = sanitize(body?.name, MAX_NAME);
  const email = sanitize(body?.email, MAX_EMAIL);
  const discord = sanitize(body?.discord, MAX_DISCORD);
  const subject = sanitize(body?.subject, MAX_SUBJECT);
  const orderId = sanitize(body?.orderId, MAX_ORDER_ID);
  const message = sanitize(body?.message, MAX_MESSAGE);

  if (!name) errors.push('Name is required.');
  if (!email) errors.push('Email is required.');
  else if (!isValidEmail(email)) errors.push('Invalid email address.');
  if (!subject || subject.length < 3) errors.push('Subject must be at least 3 characters.');
  if (!message || message.length < 10) errors.push('Message must be at least 10 characters.');

  if (errors.length) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { name, email, discord: discord || null, subject, orderId: orderId || null, message },
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildEmailContent(data) {
  const submittedAt = new Date().toISOString();

  const text = [
    'New support request from HVTDEVIL website',
    '────────────────────────────────────',
    'Name: ' + data.name,
    'Email: ' + data.email,
    'Discord: ' + (data.discord || '(not provided)'),
    'Subject: ' + data.subject,
    'Order ID: ' + (data.orderId || '(not provided)'),
    'Submitted: ' + submittedAt,
    '',
    'Message:',
    data.message,
  ].join('\n');

  const html = `
    <h2>New support request — HVTDEVIL</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
      <tr><td><strong>Discord</strong></td><td>${escapeHtml(data.discord || '(not provided)')}</td></tr>
      <tr><td><strong>Subject</strong></td><td>${escapeHtml(data.subject)}</td></tr>
      <tr><td><strong>Order ID</strong></td><td>${escapeHtml(data.orderId || '(not provided)')}</td></tr>
      <tr><td><strong>Submitted</strong></td><td>${submittedAt}</td></tr>
    </table>
    <h3>Message</h3>
    <pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;background:#f4f4f5;padding:12px;border-radius:8px;">${escapeHtml(data.message)}</pre>
  `;

  return {
    submittedAt,
    subject: `[HVTDEVIL Support] ${data.subject}`,
    text,
    html,
    replyTo: data.email,
  };
}

export function formatContactError(err, env = {}) {
  const debug = env.CONTACT_DEBUG === 'true' || env.CONTACT_DEBUG === '1';

  const base = {
    name: err?.name || 'Error',
    message: err?.message || String(err),
    code: err?.code || null,
  };

  if (err?.responseCode) base.smtpResponseCode = err.responseCode;
  if (err?.command) base.smtpCommand = err.command;
  if (err?.statusCode) base.httpStatus = err.statusCode;
  if (err?.responseBody) base.providerResponse = err.responseBody;
  if (err?.missing) base.missing = err.missing;

  return {
    log: { ...base, stack: err?.stack || null },
    client: {
      error: base.message || 'Email send failed.',
      code: base.code || (base.httpStatus ? `HTTP_${base.httpStatus}` : 'SEND_FAILED'),
      ...(debug ? { debug: base } : {}),
    },
  };
}

export function getEmailProvider(env) {
  const explicit = (env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'resend' || explicit === 'smtp') return explicit;
  if (env.RESEND_API_KEY) return 'resend';
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return 'smtp';
  return null;
}

export function getMissingEnvVars(env, provider) {
  const missing = [];
  if (!env.SUPPORT_EMAIL) missing.push('SUPPORT_EMAIL');

  if (provider === 'resend') {
    if (!env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
    if (!env.FROM_EMAIL) missing.push('FROM_EMAIL');
  } else if (provider === 'smtp') {
    if (!env.SMTP_HOST) missing.push('SMTP_HOST');
    if (!env.SMTP_USER) missing.push('SMTP_USER');
    if (!env.SMTP_PASS) missing.push('SMTP_PASS');
  } else {
    missing.push('EMAIL_PROVIDER (resend or smtp)');
  }

  return missing;
}
