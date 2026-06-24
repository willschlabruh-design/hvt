/**
 * HVTDEVIL — Homepage elite interactions
 * GPU transforms, rAF-throttled, respects reduced motion.
 */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const isMobile = window.innerWidth < 768;

  function throttleRaf(fn) {
    let ticking = false;
    return function (...args) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
    };
  }

  /* ── Collectible card tilt (subtle lift only) ── */
  function initCollectibleTilt() {
    if (reduced || !finePointer) return;

    document.querySelectorAll('.collectible-card').forEach((card) => {
      const inner = card.querySelector('.collectible-card__inner') || card;

      card.addEventListener('mouseenter', () => {
        inner.style.transform = 'translateY(-6px)';
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = '';
      });
    });
  }

  /* ── Staggered scroll reveals ── */
  function initStaggerReveal() {
    const groups = document.querySelectorAll('[data-reveal-stagger]');
    if (!groups.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );

    groups.forEach((group) => observer.observe(group));

    const checkVisible = () => {
      groups.forEach((group) => {
        const rect = group.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) {
          group.classList.add('is-revealed');
        }
      });
    };

    window.addEventListener('load', () => setTimeout(checkVisible, 700));
    checkVisible();
  }

  /* ── Section glow parallax ── */
  function initSectionParallax() {
    if (reduced) return;

    const glows = document.querySelectorAll('[data-section-parallax]');
    if (!glows.length) return;

    const onScroll = throttleRaf(() => {
      const scrollY = window.scrollY;
      glows.forEach((el) => {
        const speed = parseFloat(el.dataset.sectionParallax) || 0.15;
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + scrollY - scrollY) * speed;
        el.style.transform = `translate3d(0, ${offset * 0.3}px, 0)`;
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Magnetic CTA buttons ── */
  function initMagneticButtons() {
    if (reduced || !finePointer || isMobile) return;

    document.querySelectorAll('.btn-magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', throttleRaf((e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      }), { passive: true });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ── Observe dynamically loaded collectible cards ── */
  function watchCollectibleCards() {
    const container = document.getElementById('minecraft-capes-showcase');
    if (!container || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver(() => {
      initCollectibleTilt();
    });
    observer.observe(container, { childList: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStaggerReveal();
    initSectionParallax();
    initMagneticButtons();
    watchCollectibleCards();

    document.addEventListener('capes-rendered', () => {
      initCollectibleTilt();
    });
  });
})();
