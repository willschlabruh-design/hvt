/**
 * Trims black padding from source cape PNGs and writes crisp display assets.
 * Uses content bounding-box detection (sharp.trim fails when black appears inside capes).
 * Outputs lossless WEBP (primary) + PNG fallback under assets/images/capes/display/
 *
 * All display assets share one canvas size so the browser never applies uneven scaling.
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
/** Uniform display canvas — every cape renders at identical pixel dimensions */
const CANVAS_WIDTH = 120;
const CANVAS_HEIGHT = 180;

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
      const a = data[i + 3];
      if (!isContentPixel(data[i], data[i + 1], data[i + 2], a)) continue;
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
  let trimmed = sharp(sourcePath).ensureAlpha();

  if (bounds) {
    trimmed = trimmed.extract(bounds);
  }

  const contentWidth = bounds?.width ?? (await sharp(sourcePath).metadata()).width ?? CANVAS_WIDTH;
  const contentHeight = bounds?.height ?? (await sharp(sourcePath).metadata()).height ?? CANVAS_HEIGHT;

  // Fit content into canvas with nearest-neighbor (pixel art safe).
  // Same scale rule for every cape — no height-only resize that varies output width.
  const scale = Math.min(
    CANVAS_HEIGHT / contentHeight,
    CANVAS_WIDTH / contentWidth
  );
  const scaledW = Math.max(1, Math.round(contentWidth * scale));
  const scaledH = Math.max(1, Math.round(contentHeight * scale));

  const scaledBuf = await trimmed
    .resize(scaledW, scaledH, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  const left = Math.floor((CANVAS_WIDTH - scaledW) / 2);
  const top = Math.floor((CANVAS_HEIGHT - scaledH) / 2);

  const pipeline = sharp({
    create: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: scaledBuf, left, top }]);

  await pipeline.clone().webp({ lossless: true, effort: 4 }).toFile(webpOut);
  await pipeline.clone().png({ compressionLevel: 6 }).toFile(pngOut);

  return {
    filename,
    bounds,
    contentWidth,
    contentHeight,
    scaledWidth: scaledW,
    scaledHeight: scaledH,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
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
    console.log(
      `Processed ${file} → ${info.width}x${info.height} (content ${info.contentWidth}x${info.contentHeight}, scaled ${info.scaledWidth}x${info.scaledHeight})`
    );
  }

  const manifest = {
    processedAt: new Date().toISOString(),
    displayPath: 'assets/images/capes/display',
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
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
