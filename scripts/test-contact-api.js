/**
 * Smoke-test contact handler without sending email.
 * Run: node scripts/test-contact-api.js
 */
const { handleContactRequest } = require('../lib/contact-handler');

const payload = {
  name: 'Test User',
  email: 'test@example.com',
  subject: 'API smoke test',
  message: 'This is a test message from scripts/test-contact-api.js',
};

async function run() {
  console.log('--- Validation-only (empty env) ---');
  const missing = await handleContactRequest(payload, {});
  console.log(JSON.stringify(missing, null, 2));

  console.log('\n--- Resend with invalid key (expect RESEND_API_ERROR) ---');
  const badResend = await handleContactRequest(payload, {
    EMAIL_PROVIDER: 'resend',
    RESEND_API_KEY: 're_invalid_test_key',
    FROM_EMAIL: 'onboarding@resend.dev',
    SUPPORT_EMAIL: 'william.schlanbusch@gmail.com',
  });
  console.log(JSON.stringify(badResend, null, 2));

  console.log('\n--- SMTP missing vars ---');
  const badSmtp = await handleContactRequest(payload, {
    EMAIL_PROVIDER: 'smtp',
    SUPPORT_EMAIL: 'william.schlanbusch@gmail.com',
  });
  console.log(JSON.stringify(badSmtp, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
