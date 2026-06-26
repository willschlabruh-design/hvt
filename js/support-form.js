/**
 * Support contact form — validation, spam protection, API submission.
 */
(function () {
  'use strict';

  const form = document.getElementById('support-form');
  if (!form) return;

  const config = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {};
  const endpoint = config.contactFormEndpoint || '/api/contact';
  const cooldownMs = config.contactFormCooldownMs || 60000;
  const STORAGE_KEY = 'hvt_support_last_submit';

  const statusEl = document.getElementById('support-form-status');
  const submitBtn = form.querySelector('[type="submit"]');
  const defaultBtnText = submitBtn ? submitBtn.textContent : 'Send Message';

  const fields = {
    name: form.querySelector('#support-name'),
    email: form.querySelector('#support-email'),
    discord: form.querySelector('#support-discord'),
    subject: form.querySelector('#support-subject'),
    orderId: form.querySelector('#support-order-id'),
    message: form.querySelector('#support-message'),
    website: form.querySelector('#support-website'),
  };

  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'support-form__status support-form__status--' + type;
    statusEl.hidden = false;
  }

  function clearFieldErrors() {
    form.querySelectorAll('.support-form__error').forEach((el) => {
      el.textContent = '';
      el.hidden = true;
    });
    form.querySelectorAll('.support-form__input--error').forEach((el) => {
      el.classList.remove('support-form__input--error');
    });
  }

  function setFieldError(field, message) {
    const err = form.querySelector('[data-error-for="' + field.id + '"]');
    if (err) {
      err.textContent = message;
      err.hidden = false;
    }
    field.classList.add('support-form__input--error');
    field.setAttribute('aria-invalid', 'true');
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    clearFieldErrors();
    let valid = true;

    if (!fields.name.value.trim()) {
      setFieldError(fields.name, 'Please enter your name.');
      valid = false;
    }

    if (!fields.email.value.trim()) {
      setFieldError(fields.email, 'Please enter your email address.');
      valid = false;
    } else if (!validateEmail(fields.email.value.trim())) {
      setFieldError(fields.email, 'Please enter a valid email address.');
      valid = false;
    }

    if (!fields.subject.value.trim()) {
      setFieldError(fields.subject, 'Please enter a subject.');
      valid = false;
    } else if (fields.subject.value.trim().length < 3) {
      setFieldError(fields.subject, 'Subject must be at least 3 characters.');
      valid = false;
    }

    if (!fields.message.value.trim()) {
      setFieldError(fields.message, 'Please enter your message.');
      valid = false;
    } else if (fields.message.value.trim().length < 10) {
      setFieldError(fields.message, 'Message must be at least 10 characters.');
      valid = false;
    }

    return valid;
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    submitBtn.textContent = isSubmitting ? 'Sending…' : defaultBtnText;
  }

  function checkCooldown() {
    try {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      if (last && Date.now() - last < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - (Date.now() - last)) / 1000);
        showStatus('Please wait ' + waitSec + ' seconds before sending another message.', 'error');
        return false;
      }
    } catch (_) {
      /* localStorage unavailable */
    }
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (fields.website && fields.website.value) {
      showStatus('Thank you. Your message has been sent.', 'success');
      form.reset();
      return;
    }

    if (!validate()) {
      showStatus('Please fix the errors above and try again.', 'error');
      return;
    }

    if (!checkCooldown()) return;

    setSubmitting(true);
    if (statusEl) statusEl.hidden = true;

    const payload = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      discord: fields.discord.value.trim() || null,
      subject: fields.subject.value.trim(),
      orderId: fields.orderId.value.trim() || null,
      message: fields.message.value.trim(),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const parts = [data.error || 'Unable to send your message.'];
        if (data.code) parts.push('(' + data.code + ')');
        throw new Error(parts.join(' '));
      }

      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch (_) {}

      form.reset();
      showStatus(data.message || 'Thank you! Your message has been sent. We will reply as soon as possible.', 'success');
    } catch (err) {
      showStatus(err.message || 'Something went wrong. Please try again or contact us on Discord.', 'error');
    } finally {
      setSubmitting(false);
    }
  });
})();
