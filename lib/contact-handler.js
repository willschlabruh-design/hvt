/**
 * Shared contact form handler — used by api/contact.js and server/contact-server.js
 */
const nodemailer = require('nodemailer');

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

  const name = sanitize(body.name, MAX_NAME);
  const email = sanitize(body.email, MAX_EMAIL);
  const discord = sanitize(body.discord, MAX_DISCORD);
  const subject = sanitize(body.subject, MAX_SUBJECT);
  const orderId = sanitize(body.orderId, MAX_ORDER_ID);
  const message = sanitize(body.message, MAX_MESSAGE);

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
    data: {
      name,
      email,
      discord: discord || null,
      subject,
      orderId: orderId || null,
      message,
    },
  };
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SUPPORT_EMAIL environment variables.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendContactEmail(data) {
  const supportEmail = process.env.SUPPORT_EMAIL;
  if (!supportEmail) {
    throw new Error('SUPPORT_EMAIL environment variable is not set.');
  }

  const transporter = getTransporter();
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"HVTDEVIL Support" <${process.env.SMTP_USER}>`,
    to: supportEmail,
    replyTo: data.email,
    subject: `[HVTDEVIL Support] ${data.subject}`,
    text,
    html,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleContactRequest(body) {
  const validation = validatePayload(body);
  if (!validation.ok) {
    return { status: 400, body: { error: validation.errors.join(' ') } };
  }

  try {
    await sendContactEmail(validation.data);
    return {
      status: 200,
      body: { success: true, message: 'Thank you! Your message has been sent. We will reply as soon as possible.' },
    };
  } catch (err) {
    console.error('[contact]', err.message);
    return {
      status: 503,
      body: {
        error:
          'Unable to send email right now. Please contact us on Discord or try again later.',
      },
    };
  }
}

module.exports = { handleContactRequest, validatePayload };
