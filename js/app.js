/**

 * HVTDEVIL — Main Application

 */



(function () {

  'use strict';



  function getLinks() {

    if (typeof SITE_LINKS !== 'undefined') return SITE_LINKS;

    return {

      discord: 'https://discord.gg/vTCPxq9zAT',

    };

  }



  const links = getLinks();

  const verifyUsername =

    typeof DISCORD_VERIFY_USERNAME !== 'undefined' ? DISCORD_VERIFY_USERNAME : 'getmeintogaming';



  document.querySelectorAll('[data-link="discord"]').forEach((el) => {

    el.href = links.discord;

  });



  document.querySelectorAll('[data-link="email"]').forEach((el) => {

    if (!links.email) {

      el.closest('.contact-card')?.remove();

      return;

    }

    el.href = 'mailto:' + links.email;

    if (el.textContent.includes('@')) el.textContent = links.email + ' →';

  });



  document.querySelectorAll('[data-discord-username]').forEach((el) => {
    el.textContent = verifyUsername;
  });

  function renderSellerStats() {
    if (typeof SELLER_STATS === 'undefined') return;
    const { dealtValue, dealtLabel, vouchesValue, vouchesLabel } = SELLER_STATS;
    const html = `
      <div class="seller-stats__grid">
        <div class="seller-stat">
          <span class="seller-stat__value">${dealtValue}</span>
          <span class="seller-stat__label">${dealtLabel}</span>
        </div>
        <div class="seller-stat">
          <span class="seller-stat__value">${vouchesValue}</span>
          <span class="seller-stat__label">${vouchesLabel}</span>
        </div>
      </div>
    `;
    document.querySelectorAll('[data-seller-stats]').forEach((el) => {
      el.innerHTML = html;
    });
    document.querySelectorAll('[data-seller-stat="dealt-value"]').forEach((el) => {
      el.textContent = dealtValue;
    });
    document.querySelectorAll('[data-seller-stat="dealt-label"]').forEach((el) => {
      el.textContent = dealtLabel;
    });
    document.querySelectorAll('[data-seller-stat="vouches-value"]').forEach((el) => {
      el.textContent = vouchesValue;
    });
    document.querySelectorAll('[data-seller-stat="vouches-label"]').forEach((el) => {
      el.textContent = vouchesLabel;
    });
    document.querySelectorAll('[data-seller-stat="summary"]').forEach((el) => {
      el.textContent = `${dealtLabel} ${dealtValue} · ${vouchesValue} ${vouchesLabel.toLowerCase()}`;
    });
  }
  renderSellerStats();

  document.querySelectorAll('a[href="https://discord.gg/vTCPxq9zAT"]').forEach((el) => {

    if (!el.dataset.link) el.href = links.discord;

  });



  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {

    anchor.addEventListener('click', (e) => {

      const targetId = anchor.getAttribute('href');

      if (targetId === '#') return;

      const target = document.querySelector(targetId);

      if (target) {

        e.preventDefault();

        target.scrollIntoView({ behavior: 'smooth' });

      }

    });

  });



  const yearEl = document.getElementById('current-year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();



  if ('IntersectionObserver' in window) {

    const imgObserver = new IntersectionObserver(

      (entries) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {

            const img = entry.target;

            if (img.dataset.src) {

              img.src = img.dataset.src;

              img.removeAttribute('data-src');

            }

            img.classList.add('loaded');

            imgObserver.unobserve(img);

          }

        });

      },

      { rootMargin: '100px' }

    );

    document.querySelectorAll('img[data-src]').forEach((img) => imgObserver.observe(img));

  }



  function initPaymentFlow() {

    const steps = document.querySelectorAll('.payment-flow-step');

    if (!steps.length) return;

    let current = 0;

    setInterval(() => {

      steps.forEach((s, i) => s.classList.toggle('active', i === current));

      current = (current + 1) % steps.length;

    }, 2500);

  }

  initPaymentFlow();



  window.HVT_CONFIG = { ...links, discordVerifyUsername: verifyUsername, sellerStats: typeof SELLER_STATS !== 'undefined' ? SELLER_STATS : null };

})();


