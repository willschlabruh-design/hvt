/**
 * Email delivery — SMTP (nodemailer, Node) or Resend (HTTP, Node + Workers).
 */
const {
  buildEmailContent,
  buildResendPayload,
  logResendPayload,
  formatContactError,
  getEmailProvider,
  getMissingEnvVars,
} = require('./contact-core');

async function sendViaResend(data, env) {
  const payload = buildResendPayload(data, env);
  logResendPayload(payload, env);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseJson = null;
  try {
    responseJson = JSON.parse(responseText);
  } catch (_) {
    /* non-JSON body */
  }

  if (!response.ok) {
    const providerMessage =
      responseJson?.message ||
      responseJson?.error?.message ||
      responseText ||
      `Resend API returned HTTP ${response.status}`;

    const err = new Error(providerMessage);
    err.name = 'ResendError';
    err.code = 'RESEND_API_ERROR';
    err.statusCode = response.status;
    err.responseBody = responseJson || responseText;
    throw err;
  }

  return { provider: 'resend', id: responseJson?.id || null };
}

async function sendViaSmtp(data, env) {
  const nodemailer = require('nodemailer');
  const port = parseInt(env.SMTP_PORT || '587', 10);
  const content = buildEmailContent(data);

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: env.SMTP_FROM || `"HVTDEVIL Support" <${env.SMTP_USER}>`,
    to: env.SUPPORT_EMAIL,
    replyTo: content.replyTo,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return { provider: 'smtp', messageId: info.messageId || null };
}

async function sendContactEmail(data, env = process.env) {
  const provider = getEmailProvider(env);
  const missing = getMissingEnvVars(env, provider);

  if (missing.length) {
    const err = new Error('Missing required environment variables: ' + missing.join(', '));
    err.name = 'ConfigurationError';
    err.code = 'MISSING_ENV';
    err.missing = missing;
    throw err;
  }
  if (provider === 'resend') return sendViaResend(data, env);
  if (provider === 'smtp') return sendViaSmtp(data, env);

  const err = new Error('No email provider configured.');
  err.code = 'NO_PROVIDER';
  throw err;
}

async function handleContactRequest(body, env = process.env) {
  const { validatePayload } = require('./contact-core');
  const validation = validatePayload(body);

  if (!validation.ok) {
    return { status: 400, body: { error: validation.errors.join(' '), code: 'VALIDATION_ERROR' } };
  }

  try {
    const sendResult = await sendContactEmail(validation.data, env);
    console.info('[contact] sent', {
      handlerVersion: 'contact-send-v3',
      provider: sendResult.provider,
      supportEmailDefined: Boolean(env.SUPPORT_EMAIL),
      id: sendResult.id || sendResult.messageId || null,
    });
    return {
      status: 200,
      body: {
        success: true,
        message: 'Thank you! Your message has been sent. We will reply as soon as possible.',
      },
    };
  } catch (err) {
    const formatted = formatContactError(err, env);
    console.error('[contact] send failed', {
      handlerVersion: 'contact-send-v3',
      ...formatted.log,
    });
    return {
      status: formatted.client.code === 'MISSING_ENV' ? 503 : 502,
      body: formatted.client,
    };
  }
}

module.exports = { sendContactEmail, handleContactRequest, sendViaResend, sendViaSmtp };
