/**
 * Scans assets/images/capes for .png files and writes cape manifests.
 * Prefers trimmed display WEBP assets when present (run process-cape-images.js first).
 *
 * Run: node scripts/generate-cape-manifest.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CAPES_DIR = path.join(ROOT, 'assets', 'images', 'capes');
const DISPLAY_DIR = path.join(CAPES_DIR, 'display');
const OUT = path.join(ROOT, 'data', 'cape-assets.json');
const OUT_JS = path.join(ROOT, 'js', 'cape-assets-manifest.js');

const ALIAS_TO_ID = {
  home: 'home',
  menace: 'menace',
  mencae: 'menace',
  copper: 'copper',
  purpleheart: 'purpleHeart',
  purpltheart: 'purpleHeart',
  experience: 'experience',
  expereince: 'experience',
  builder: 'builder',
  moonlight: 'moonlight',
  crafter: 'crafter',
};

function parseAssetName(filename) {
  const lower = filename.toLowerCase();
  if (!lower.endsWith('.png')) return null;
  const stem = lower.replace('.png', '');
  const view = stem.endsWith('front') ? 'front' : stem.endsWith('back') ? 'back' : null;
  if (!view) return null;
  const base = stem.replace(/(front|back)$/, '');
  const id = ALIAS_TO_ID[base] || null;
  return { filename, base, id, view, stem };
}

function resolveDisplayAsset(stem) {
  const webpRel = `assets/images/capes/display/${stem}.webp`;
  const pngRel = `assets/images/capes/display/${stem}.png`;
  const webpAbs = path.join(ROOT, webpRel);
  const pngAbs = path.join(ROOT, pngRel);

  if (fs.existsSync(webpAbs)) {
    return { path: webpRel, format: 'webp', filename: `${stem}.webp`, abs: webpAbs };
  }
  if (fs.existsSync(pngAbs)) {
    return { path: pngRel, format: 'png', filename: `${stem}.png`, abs: pngAbs };
  }
  return null;
}

function loadDisplayManifest() {
  const manifestPath = path.join(DISPLAY_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function lookupDisplayDimensions(stem, displayManifest) {
  const entry = displayManifest?.files?.find((f) => f.filename === `${stem}.png`);
  if (entry?.width && entry?.height) {
    return { width: entry.width, height: entry.height };
  }
  if (displayManifest?.canvasWidth && displayManifest?.canvasHeight) {
    return { width: displayManifest.canvasWidth, height: displayManifest.canvasHeight };
  }
  return null;
}

const imageFiles = fs.readdirSync(CAPES_DIR).filter((f) => f.toLowerCase().endsWith('.png')).sort();
const parsed = imageFiles.map(parseAssetName).filter(Boolean);
const unknown = parsed.filter((p) => !p.id);

const displayManifest = loadDisplayManifest();
const defaultDisplayDims = displayManifest
  ? { width: displayManifest.canvasWidth || 120, height: displayManifest.canvasHeight || 180 }
  : { width: 120, height: 180 };

const byId = new Map();
parsed.forEach((p) => {
  if (!p.id) return;
  if (!byId.has(p.id)) {
    byId.set(p.id, {
      id: p.id,
      frontImage: null,
      backImage: null,
      frontFilename: null,
      backFilename: null,
      frontSource: null,
      backSource: null,
      frontDisplayWidth: null,
      frontDisplayHeight: null,
      backDisplayWidth: null,
      backDisplayHeight: null,
      hasDualView: false,
    });
  }
  const row = byId.get(p.id);
  const display = resolveDisplayAsset(p.stem);
  const sourceRel = `assets/images/capes/${p.filename}`;
  const rel = display?.path || sourceRel;
  const dims = lookupDisplayDimensions(p.stem, displayManifest) || defaultDisplayDims;

  if (p.view === 'front') {
    row.frontImage = rel;
    row.frontFilename = display?.filename || p.filename;
    row.frontSource = sourceRel;
    row.frontDisplayWidth = dims.width;
    row.frontDisplayHeight = dims.height;
  } else {
    row.backImage = rel;
    row.backFilename = display?.filename || p.filename;
    row.backSource = sourceRel;
    row.backDisplayWidth = dims.width;
    row.backDisplayHeight = dims.height;
  }
  row.hasDualView = Boolean(row.frontImage && row.backImage);
});

const assets = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));

const displayFiles = fs.existsSync(DISPLAY_DIR)
  ? fs.readdirSync(DISPLAY_DIR).filter((f) => /\.(webp|png)$/i.test(f) && f !== 'manifest.json')
  : [];

const manifest = {
  scannedAt: new Date().toISOString(),
  assetsPath: 'assets/images/capes',
  displayPath: 'assets/images/capes/display',
  imageFiles,
  displayFiles,
  unknownFiles: unknown.map((u) => u.filename),
  assets,
};

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(
  OUT_JS,
  '/** Auto-generated — run: npm run capes */\n'
    + `const CAPE_ASSETS_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`
);
console.log('Wrote', OUT);
console.log('Wrote', OUT_JS);
console.log('Source PNG files:', imageFiles.length);
console.log('Display assets:', displayFiles.length);
if (unknown.length) {
  console.warn('Unknown filename patterns:', unknown.map((u) => u.filename));
}
console.log(JSON.stringify(assets, null, 2));
