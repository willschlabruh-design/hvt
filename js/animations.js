/**
 * HVTDEVIL — Animation Engine
 * Particles, scroll reveals, parallax, mouse glow
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Page Loader ── */
  function initLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) {
      document.body.classList.add('is-loaded');
      return;
    }
    const finish = () => {
      loader.classList.add('hidden');
      document.body.classList.add('is-loaded');
    };
    window.addEventListener('load', () => {
      setTimeout(finish, 400);
    });
    setTimeout(finish, 3000);
  }

  /* ── Scroll Reveal ── */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ── Navbar Scroll ── */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile Menu ── */
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.innerHTML = isOpen
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      });
    });
  }

  /* ── Accordion ── */
  function initAccordion() {
    document.querySelectorAll('.accordion-item').forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        item.closest('.accordion')?.querySelectorAll('.accordion-item').forEach((other) => {
          other.classList.remove('active');
          other.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ── Particles ── */
  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let dpr = window.devicePixelRatio || 1;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function createParticles(count) {
      particles = [];
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 0.5,
          speedY: Math.random() * 0.4 + 0.15,
          speedX: (Math.random() - 0.5) * 0.25,
          opacity: Math.random() * 0.4 + 0.15,
          color: i % 3 === 0 ? '124, 58, 237' : i % 3 === 1 ? '59, 130, 246' : '167, 139, 250',
        });
      }
    }

    function animate() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    const particleCount = window.innerWidth < 768 ? 45 : 70;

    resize();
    createParticles(particleCount);
    animate();

    window.addEventListener('resize', () => {
      cancelAnimationFrame(animationId);
      resize();
      createParticles(window.innerWidth < 768 ? 45 : 70);
      animate();
    });
  }

  /* ── Mouse Glow ── */
  function initMouseGlow() {
    const glow = document.getElementById('mouse-glow');
    if (!glow || prefersReducedMotion || window.innerWidth < 768) return;
    if (document.body.classList.contains('page-home')) return;

    let visible = false;

    document.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
      if (!visible) {
        glow.style.opacity = '1';
        visible = true;
      }
    });

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
      visible = false;
    });
  }

  /* ── Parallax ── */
  function initParallax() {
    if (prefersReducedMotion) return;

    const elements = document.querySelectorAll('[data-parallax]');
    if (!elements.length) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      elements.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }, { passive: true });
  }

  /* ── Counter Animation ── */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = el.dataset.counter;
          el.textContent = target;
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((c) => observer.observe(c));
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initScrollReveal();
    initNavbar();
    initMobileMenu();
    initAccordion();
    initParticles();
    initMouseGlow();
    initParallax();
    initCounters();
  });
})();
