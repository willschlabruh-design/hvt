/**
 * Support page — copy email and mailto links (no form submission).
 */
(function () {
  'use strict';

  const config = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {};
  const email = config.supportEmail || 'Hvtdevil@gmail.com';
  const mailto = 'mailto:' + email;

  document.querySelectorAll('[data-support-email]').forEach((el) => {
    el.textContent = email;
  });

  document.querySelectorAll('[data-support-mailto]').forEach((el) => {
    if (el.tagName === 'A') el.href = mailto;
  });

  const copyBtn = document.querySelector('[data-copy-email]');
  const feedback = document.getElementById('copy-email-feedback');

  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    let copied = false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
        copied = true;
      }
    } catch (_) {
      /* fallback below */
    }

    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = copied ? 'Email copied to clipboard.' : 'Could not copy — please select the address manually.';
      feedback.className =
        'support-contact-card__feedback support-contact-card__feedback--' + (copied ? 'success' : 'error');
      window.setTimeout(() => {
        feedback.hidden = true;
      }, 3000);
    }
  });
})();
