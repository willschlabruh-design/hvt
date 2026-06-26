/**
 * Renders a unified site footer into [data-site-footer] elements.
 */
(function () {
  'use strict';

  function renderFooter(container) {
    const isHome = container.dataset.footerVariant === 'home';

    container.className = 'site-footer border-t border-white/5 py-16';
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="index.html" class="flex items-center gap-2.5 mb-4">
              <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-sm">H</div>
              <span class="font-display font-bold text-lg">HVT<span class="text-purple-400">DEVIL</span></span>
            </a>
            <p class="text-sm text-slate-400 leading-relaxed">Official Minecraft cape codes. PayPal (F&amp;F) and cryptocurrency accepted through Discord.</p>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">Explore</h4>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><a href="index.html" class="hover:text-white transition-colors">Home</a></li>
              <li><a href="capes.html" class="hover:text-white transition-colors">Marketplace</a></li>
              <li><a href="how-cape-codes-work.html" class="hover:text-white transition-colors">How Cape Codes Work</a></li>
              <li><a href="why-capes-special.html" class="hover:text-white transition-colors">Why Cape Codes Are Special</a></li>
              <li><a href="faq.html" class="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">Support</h4>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><a href="support.html" class="hover:text-white transition-colors">Support</a></li>
              <li><a href="https://discord.gg/vTCPxq9zAT" target="_blank" rel="noopener noreferrer" data-link="discord" class="hover:text-white transition-colors">Discord Server</a></li>
              <li><a href="trust.html" class="hover:text-white transition-colors">Trust &amp; Safety</a></li>
              ${isHome ? '<li><a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a></li>' : '<li><a href="index.html#how-it-works" class="hover:text-white transition-colors">How It Works</a></li>'}
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">Legal</h4>
            <ul class="space-y-2 text-sm text-slate-400">
              <li><a href="terms.html" class="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="privacy.html" class="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="refund-policy.html" class="hover:text-white transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div class="authenticity-footer-bar max-w-3xl mx-auto px-4 sm:px-0">
          <aside class="authenticity-notice authenticity-notice--compact" role="note" aria-label="Identity verification">
            <div class="authenticity-notice__icon" aria-hidden="true">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <p class="authenticity-notice__text">Always verify that you are speaking with the real me by checking my Discord account: <span class="authenticity-notice__username" data-discord-username>getmeintogaming</span></p>
          </aside>
        </div>
        <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; <span id="current-year">${new Date().getFullYear()}</span> HVTDEVIL. All rights reserved.</p>
          <p>Not affiliated with Mojang Studios or Microsoft.</p>
        </div>
      </div>
    `;
  }

  document.querySelectorAll('[data-site-footer]').forEach(renderFooter);
})();
