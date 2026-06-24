/**
 * Trims black padding from source cape PNGs and writes crisp display assets.
 * Uses content bounding-box detection (sharp.trim fails when black appears inside capes).
 * Outputs lossless WEBP (primary) + PNG fallback under assets/images/capes/display/
 *
 * Run: npm run process-capes
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'assets', 'images', 'capes');
const DISPLAY_DIR = path.join(SOURCE_DIR, 'display');

const ALPHA_MIN = 8;
const LUMINANCE_MIN = 24;
const PAD = 2;
const MAX_DISPLAY_HEIGHT = 180;

function isContentPixel(r, g, b, a) {
  return a > ALPHA_MIN && (r + g + b) > LUMINANCE_MIN;
}

async function findContentBounds(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (!isContentPixel(r, g, b, a)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const left = Math.max(0, minX - PAD);
  const top = Math.max(0, minY - PAD);
  const right = Math.min(width - 1, maxX + PAD);
  const bottom = Math.min(height - 1, maxY + PAD);

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

async function processFile(filename) {
  const sourcePath = path.join(SOURCE_DIR, filename);
  const stem = filename.replace(/\.png$/i, '');
  const webpOut = path.join(DISPLAY_DIR, `${stem}.webp`);
  const pngOut = path.join(DISPLAY_DIR, `${stem}.png`);

  const bounds = await findContentBounds(sourcePath);
  let pipeline = sharp(sourcePath).ensureAlpha();

  if (bounds) {
    pipeline = pipeline.extract(bounds);
  }

  pipeline = pipeline.resize({
    height: MAX_DISPLAY_HEIGHT,
    kernel: sharp.kernel.nearest,
  });

  await pipeline.clone().webp({ lossless: true, effort: 4 }).toFile(webpOut);
  await pipeline.clone().png({ compressionLevel: 6 }).toFile(pngOut);

  const meta = await sharp(webpOut).metadata();

  return {
    filename,
    bounds,
    width: meta.width,
    height: meta.height,
    webp: path.relative(ROOT, webpOut).replace(/\\/g, '/'),
    png: path.relative(ROOT, pngOut).replace(/\\/g, '/'),
  };
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('Missing source directory:', SOURCE_DIR);
    process.exit(1);
  }

  fs.mkdirSync(DISPLAY_DIR, { recursive: true });

  const sources = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();

  if (!sources.length) {
    console.warn('No PNG sources found in', SOURCE_DIR);
    return;
  }

  const results = [];
  for (const file of sources) {
    const info = await processFile(file);
    results.push(info);
    console.log(`Trimmed ${file} → ${info.width}x${info.height}`);
  }

  const manifest = {
    processedAt: new Date().toISOString(),
    displayPath: 'assets/images/capes/display',
    files: results,
  };

  fs.writeFileSync(
    path.join(DISPLAY_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );

  console.log(`Processed ${results.length} cape images into ${DISPLAY_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
