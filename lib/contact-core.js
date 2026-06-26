/**
 * Provider-agnostic contact form validation and email content building.
 * Safe to import from Node and Cloudflare Workers (no Node-only deps).
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

function validatePayload(body) {
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

function buildEmailContent(data) {
  const textLines = ['Name: ' + data.name, 'Email: ' + data.email];
  if (data.discord) textLines.push('Discord username: ' + data.discord);
  if (data.orderId) textLines.push('Order ID: ' + data.orderId);
  textLines.push('Subject: ' + data.subject, '', 'Message:', data.message);
  const text = textLines.join('\n');

  const htmlRows = [
    `<tr><td><strong>Name</strong></td><td>${escapeHtml(data.name)}</td></tr>`,
    `<tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>`,
  ];
  if (data.discord) {
    htmlRows.push(
      `<tr><td><strong>Discord username</strong></td><td>${escapeHtml(data.discord)}</td></tr>`
    );
  }
  if (data.orderId) {
    htmlRows.push(`<tr><td><strong>Order ID</strong></td><td>${escapeHtml(data.orderId)}</td></tr>`);
  }
  htmlRows.push(`<tr><td><strong>Subject</strong></td><td>${escapeHtml(data.subject)}</td></tr>`);

  const html = `
    <h2>Support request — HVTDEVIL</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      ${htmlRows.join('\n      ')}
    </table>
    <h3>Message</h3>
    <pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;background:#f4f4f5;padding:12px;border-radius:8px;">${escapeHtml(data.message)}</pre>
  `;

  return {
    subject: `Support Request: ${data.subject}`,
    text,
    html,
    replyTo: data.email,
  };
}

function buildResendPayload(data, env) {
  const content = buildEmailContent(data);
  const supportEmail = String(env.SUPPORT_EMAIL || '').trim();
  const fromEmail = String(env.FROM_EMAIL || '').trim();

  return {
    from: fromEmail,
    to: [supportEmail],
    reply_to: data.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  };
}

function logResendPayload(payload, env) {
  const supportEmail = String(env.SUPPORT_EMAIL || '').trim();
  console.info('[contact] resend send (pre-request)', {
    from: payload.from,
    to: payload.to,
    replyTo: payload.reply_to,
    subject: payload.subject,
    toMatchesSupportEmail: payload.to.length === 1 && payload.to[0] === supportEmail,
    RESEND_API_KEY: Boolean(env.RESEND_API_KEY && String(env.RESEND_API_KEY).trim()),
  });
}

/** Normalize any thrown error into a log-safe object and a client-safe message. */
function formatContactError(err, env = {}) {
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

  const clientMessage = base.message || 'Email send failed.';

  return {
    log: { ...base, stack: err?.stack || null },
    client: {
      error: clientMessage,
      code: base.code || (base.httpStatus ? `HTTP_${base.httpStatus}` : 'SEND_FAILED'),
      ...(debug ? { debug: base } : {}),
    },
  };
}

function getEmailProvider(env) {
  const explicit = (env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'resend' || explicit === 'smtp') return explicit;
  if (env.RESEND_API_KEY) return 'resend';
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return 'smtp';
  return null;
}

function getMissingEnvVars(env, provider) {
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
    missing.push('EMAIL_PROVIDER (set to "resend" or "smtp")');
    missing.push('RESEND_API_KEY + FROM_EMAIL  OR  SMTP_HOST + SMTP_USER + SMTP_PASS');
  }

  return missing;
}

module.exports = {
  validatePayload,
  buildEmailContent,
  buildResendPayload,
  logResendPayload,
  formatContactError,
  getEmailProvider,
  getMissingEnvVars,
};
