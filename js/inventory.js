/**
 * HVTDEVIL — Cape gallery
 * Always renders all capes from CAPES. Images from cape-assets manifest + fallbacks.
 */

const HVT = { capes: [], assets: [], ready: false };

function getLinks() {
  return typeof SITE_LINKS !== 'undefined' ? SITE_LINKS : {
    discord: 'https://discord.gg/vTCPxq9zAT',
  };
}

function getCapeList() {
  if (typeof CAPES !== 'undefined') return CAPES;
  if (typeof SHOWCASE_CAPES !== 'undefined') return SHOWCASE_CAPES;
  return [];
}

function idToKebab(id) {
  return id.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

function guessImagePath(cape) {
  const SLUG = {
    purpleHeart: 'purpltheart',
    experience: 'experience',
    menace: 'menace',
    home: 'home',
    copper: 'copper',
    builder: 'builder',
    moonlight: 'moonlight',
    crafter: 'crafter',
  };
  const slug = SLUG[cape.id] || idToKebab(cape.id);
  return `assets/images/capes/display/${slug}front.webp`;
}

function resolveCapeAsset(cape, assets) {
  return assets.find((a) => a.id === cape.id) || null;
}

function mergeCapeWithAsset(cape, asset) {
  const imagePath = asset?.frontImage || guessImagePath(cape);

  return {
    ...cape,
    asset,
    imagePath,
    frontImage: asset?.frontImage || imagePath,
    backImage: asset?.backImage || null,
    hasDualView: Boolean(asset?.hasDualView && asset?.frontImage && asset?.backImage),
    priceDisplay: cape.price || '$0.00',
    price: parseFloat(String(cape.price || '0').replace(/[^0-9.]/g, '')) || 0,
  };
}

async function loadCapeAssets() {
  if (HVT.assets.length) return HVT.assets;

  if (typeof CAPE_ASSETS_MANIFEST !== 'undefined' && CAPE_ASSETS_MANIFEST.assets) {
    HVT.assets = CAPE_ASSETS_MANIFEST.assets;
    return HVT.assets;
  }

  try {
    const response = await fetch('data/cape-assets.json');
    if (response.ok) {
      const manifest = await response.json();
      HVT.assets = manifest.assets || [];
      return HVT.assets;
    }
    console.warn('[HVT] cape-assets.json responded with', response.status);
  } catch (err) {
    console.warn('[HVT] cape-assets.json fetch failed:', err);
  }

  HVT.assets = [];
  return HVT.assets;
}

async function buildShowcaseCapes() {
  let assets = [];
  try {
    assets = await loadCapeAssets();
  } catch (err) {
    console.warn('[HVT] loadCapeAssets error:', err);
  }

  const metadata = getCapeList();
  const imageFiles = (typeof CAPE_ASSETS_MANIFEST !== 'undefined' && CAPE_ASSETS_MANIFEST.imageFiles)
    ? CAPE_ASSETS_MANIFEST.imageFiles
    : assets.map((a) => [a.frontFilename, a.backFilename].filter(Boolean)).flat();

  if (typeof CAPE_ASSET_DEBUG !== 'undefined' && CAPE_ASSET_DEBUG) {
    console.log('Available image files:', imageFiles);
    console.log('Cape configuration:', metadata);
  }

  const capes = metadata.map((cape) => {
    const asset = resolveCapeAsset(cape, assets);
    const merged = mergeCapeWithAsset(cape, asset);

    if (typeof CAPE_ASSET_DEBUG !== 'undefined' && CAPE_ASSET_DEBUG) {
      console.log('Resolved image path:', {
        id: cape.id,
        name: cape.name,
        path: merged.imagePath,
        front: merged.frontImage,
        back: merged.backImage,
        hasDualView: merged.hasDualView,
      });
    }

    return merged;
  });

  HVT.capes = capes;
  HVT.ready = true;
  return capes;
}

function buildViewToggle() {
  const toggle = document.createElement('div');
  toggle.className = 'cape-view-toggle';
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'Cape view');
  toggle.innerHTML = `
    <button type="button" class="cape-view-btn is-active" data-view="front" aria-pressed="true">Front</button>
    <span class="cape-view-divider" aria-hidden="true"></span>
    <button type="button" class="cape-view-btn" data-view="back" aria-pressed="false">Back</button>
  `;
  return toggle;
}

function bindCapeViewToggle(card, cape) {
  const img = card.querySelector('.gallery-cape-img');
  const toggle = card.querySelector('.cape-view-toggle');
  if (!img || !toggle || !cape.hasDualView) return;

  let currentView = 'front';

  function applyView(view) {
    currentView = view;
    img.classList.add('is-switching');
    window.setTimeout(() => {
      img.style.width = '';
      img.style.height = '';
      img.src = view === 'front' ? cape.frontImage : cape.backImage;
      img.alt = `${cape.name} — ${view} view`;
      img.classList.remove('is-switching');
    }, 120);
    toggle.querySelectorAll('.cape-view-btn').forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  toggle.querySelectorAll('.cape-view-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.view === currentView) return;
      applyView(btn.dataset.view);
    });
  });
}

function showImageUnavailable(visual, toggle) {
  const stage = visual.querySelector('.cape-preview-stage');
  if (stage) {
    stage.innerHTML = '<div class="cape-image-unavailable">Image unavailable</div>';
  }
  if (toggle) toggle.remove();
}

/** Downscale only when preview area is narrower/shorter than native display asset. */
function fitCapePreviewImage(img) {
  const stage = img.closest('.cape-preview-stage');
  if (!stage || !img.naturalWidth || !img.naturalHeight) return;

  const maxW = stage.clientWidth;
  const maxH = stage.clientHeight;
  if (!maxW || !maxH) return;

  const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
  if (ratio >= 1) {
    img.style.width = '';
    img.style.height = '';
    return;
  }

  const w = Math.floor(img.naturalWidth * ratio);
  const h = Math.floor(img.naturalHeight * ratio);
  img.style.width = `${w}px`;
  img.style.height = `${h}px`;
}

function bindImageLoadHandlers(card, cape) {
  const visual = card.querySelector('.gallery-card-visual');
  const toggle = card.querySelector('.cape-view-toggle');
  const img = card.querySelector('.gallery-cape-img');

  if (!img) return;

  img.addEventListener('error', () => {
    console.warn('[HVT] Image load failed:', cape.id, cape.imagePath);
    showImageUnavailable(visual, toggle);
  });

  img.addEventListener('load', () => {
    fitCapePreviewImage(img);
    if (typeof CAPE_ASSET_DEBUG !== 'undefined' && CAPE_ASSET_DEBUG) {
      console.log('[HVT] Image loaded:', cape.id, cape.imagePath, img.naturalWidth, img.naturalHeight);
    }
  });

  if (typeof ResizeObserver !== 'undefined') {
    const stage = card.querySelector('.cape-preview-stage');
    if (stage) {
      const ro = new ResizeObserver(() => {
        if (img.complete && img.naturalWidth) fitCapePreviewImage(img);
      });
      ro.observe(stage);
    }
  }
}

function createGalleryCard(cape, options = {}) {
  const { premium = false, collectible = false } = options;
  const links = getLinks();
  const glowColor = cape.glow || '#7c3aed';
  const dualView = cape.hasDualView;
  const toggleHtml = dualView ? buildViewToggle().outerHTML : '';

  const imgHtml = `<img src="${cape.frontImage || cape.imagePath}" alt="${cape.name}" class="gallery-cape-img" decoding="async">`;

  const card = document.createElement('article');
  card.className = premium ? 'gallery-card gallery-card-premium reveal' : 'gallery-card reveal';
  card.dataset.id = cape.id;
  if (collectible) {
    card.classList.add('collectible-card');
    card.style.setProperty('--cape-glow', glowColor);
  }

  const visualExtras = collectible
    ? `<div class="collectible-card__spotlight" aria-hidden="true"></div>
      <div class="collectible-card__pedestal" aria-hidden="true"></div>`
    : '';

  const badgeHtml = collectible ? '<span class="collectible-card__badge">Official Cape</span>' : '';
  const btnClass = collectible ? 'btn btn-primary gallery-buy-btn btn-magnetic' : 'btn btn-primary gallery-buy-btn';
  const wrapStart = collectible ? '<div class="collectible-card__inner">' : '';
  const wrapEnd = collectible ? '</div>' : '';

  card.innerHTML = `
    ${wrapStart}
    <div class="gallery-card-visual">
      <div class="gallery-card-glow" style="background: radial-gradient(circle at 50% 42%, ${glowColor}25, transparent 72%)"></div>
      ${visualExtras}
      <div class="cape-preview-area">
        <div class="cape-preview-stage">
          ${imgHtml}
        </div>
      </div>
      ${toggleHtml}
    </div>
    <div class="gallery-card-content">
      ${badgeHtml}
      <h3 class="gallery-card-name">${cape.name}</h3>
      <p class="gallery-card-desc">${cape.description}</p>
      <p class="gallery-card-price">${cape.priceDisplay}</p>
      <a href="${links.discord}" target="_blank" rel="noopener noreferrer"
         class="${btnClass}">Purchase Now</a>
    </div>
    ${wrapEnd}
  `;

  if (dualView) bindCapeViewToggle(card, cape);
  bindImageLoadHandlers(card, cape);

  return card;
}

function observeReveal(container) {
  setTimeout(() => {
    container.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
      );
      observer.observe(el);
    });
  }, 60);
}

function filterCapesByIds(capes, ids) {
  if (!ids?.length) return capes;
  const byId = new Map(capes.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

async function renderPremiumShowcase(containerId, options = {}) {
  const { filterIds, collectible = false } = options;
  const container = document.getElementById(containerId);
  if (!container) return;

  let capes = getCapeList().map((c) => mergeCapeWithAsset(c, null));

  try {
    capes = await buildShowcaseCapes();
  } catch (err) {
    console.error('[HVT] buildShowcaseCapes failed, rendering all capes without manifest:', err);
    capes = getCapeList().map((c) => mergeCapeWithAsset(c, null));
  }

  if (filterIds) {
    capes = filterCapesByIds(capes, filterIds);
  }

  container.innerHTML = '';

  capes.forEach((cape, i) => {
    const card = createGalleryCard(cape, { premium: true, collectible });
    if (i % 4 === 1) card.classList.add('reveal-delay-1');
    if (i % 4 === 2) card.classList.add('reveal-delay-2');
    if (i % 4 === 3) card.classList.add('reveal-delay-3');
    container.appendChild(card);
  });

  observeReveal(container);
  container.dispatchEvent(new CustomEvent('capes-rendered', { bubbles: true }));
}

async function renderGallery(containerId) {
  await renderPremiumShowcase(containerId);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('minecraft-capes-showcase')) {
    const filterIds = typeof INDEX_SHOWCASE_CAPE_IDS !== 'undefined'
      ? INDEX_SHOWCASE_CAPE_IDS
      : null;
    renderPremiumShowcase('minecraft-capes-showcase', { filterIds, collectible: true });
  }
  if (document.getElementById('capes-gallery')) {
    renderGallery('capes-gallery');
  }
});
