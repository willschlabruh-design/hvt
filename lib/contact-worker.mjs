/**
 * Cloudflare Workers / Pages Functions — contact API (Resend HTTP only).
 */
import {
  validatePayload,
  buildEmailContent,
  formatContactError,
  getEmailProvider,
  getMissingEnvVars,
} from './contact-core.mjs';

async function sendViaResend(data, env) {
  const content = buildEmailContent(data);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.SUPPORT_EMAIL],
      reply_to: content.replyTo,
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  const responseText = await response.text();
  let responseJson = null;
  try {
    responseJson = JSON.parse(responseText);
  } catch (_) {}

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

export async function handleContactRequest(body, env) {
  const validation = validatePayload(body);

  if (!validation.ok) {
    return { status: 400, body: { error: validation.errors.join(' '), code: 'VALIDATION_ERROR' } };
  }

  const provider = getEmailProvider(env) || 'resend';
  const missing = getMissingEnvVars(env, provider === 'smtp' ? 'resend' : provider);

  if (provider === 'smtp') {
    return {
      status: 503,
      body: {
        error:
          'SMTP is not supported on Cloudflare Pages. Set EMAIL_PROVIDER=resend and configure RESEND_API_KEY, FROM_EMAIL, and SUPPORT_EMAIL.',
        code: 'SMTP_NOT_SUPPORTED_ON_CLOUDFLARE',
      },
    };
  }

  if (missing.length) {
    return {
      status: 503,
      body: {
        error: 'Missing required environment variables: ' + missing.join(', '),
        code: 'MISSING_ENV',
      },
    };
  }

  try {
    const sendResult = await sendViaResend(validation.data, env);
    console.log('[contact] sent', JSON.stringify({ provider: sendResult.provider, id: sendResult.id }));
    return {
      status: 200,
      body: {
        success: true,
        message: 'Thank you! Your message has been sent. We will reply as soon as possible.',
      },
    };
  } catch (err) {
    const formatted = formatContactError(err, env);
    console.error('[contact] send failed', JSON.stringify(formatted.log));
    return { status: 502, body: formatted.client };
  }
}
