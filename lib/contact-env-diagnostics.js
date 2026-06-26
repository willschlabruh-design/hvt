/**
 * Safe runtime diagnostics for contact API (names only, never secret values).
 */

const CONTACT_ENV_KEYS = [
  'SUPPORT_EMAIL',
  'EMAIL_PROVIDER',
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'CONTACT_DEBUG',
];

const RUNTIME_META_KEYS = ['VERCEL_ENV', 'VERCEL_URL', 'VERCEL_GIT_COMMIT_SHA', 'NODE_ENV'];

/** @param {Record<string, string | undefined>} env */
function keyPresence(env, keys) {
  /** @type {Record<string, boolean>} */
  const out = {};
  for (const key of keys) {
    const value = env[key];
    out[key] = value !== undefined && value !== null && String(value).trim() !== '';
  }
  return out;
}

/**
 * Log which contact-related env keys exist (never log values).
 * @param {Record<string, string | undefined>} env
 * @param {{ runtime: string, handlerVersion: string }} meta
 */
function logContactEnvDiagnostics(env, meta) {
  const contactPresent = keyPresence(env, CONTACT_ENV_KEYS);
  const runtimePresent = keyPresence(env, RUNTIME_META_KEYS);

  /** Keys on env object that look contact-related (names only). */
  const matchingKeys = Object.keys(env || {}).filter((key) =>
    /^(SUPPORT|SMTP|RESEND|FROM_EMAIL|EMAIL|CONTACT)_/i.test(key) ||
    CONTACT_ENV_KEYS.includes(key) ||
    RUNTIME_META_KEYS.includes(key)
  );

  console.info('[contact] runtime diagnostics', {
    handlerVersion: meta.handlerVersion,
    runtime: meta.runtime,
    vercelEnv: env.VERCEL_ENV || null,
    vercelUrl: env.VERCEL_URL || null,
    nodeEnv: env.NODE_ENV || null,
    supportEmailDefined: contactPresent.SUPPORT_EMAIL,
    emailProviderDefined: contactPresent.EMAIL_PROVIDER,
    resendKeyDefined: contactPresent.RESEND_API_KEY,
    fromEmailDefined: contactPresent.FROM_EMAIL,
    contactEnvKeysPresent: contactPresent,
    runtimeMetaPresent: runtimePresent,
    matchingEnvKeyNames: matchingKeys.sort(),
    totalProcessEnvKeyCount: Object.keys(env || {}).length,
  });
}

module.exports = { logContactEnvDiagnostics, CONTACT_ENV_KEYS };
