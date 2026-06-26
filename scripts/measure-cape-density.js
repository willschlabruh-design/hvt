/**
 * Measure cape pixel density in source screenshots before any processing.
 * Run: node scripts/measure-cape-density.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = path.join(__dirname, '..', 'assets', 'images', 'capes');
const ALPHA_MIN = 8;
const LUMINANCE_MIN = 24;
const PAD = 2;
const TARGET_HEIGHT = 180;

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
    screenshotWidth: width,
    screenshotHeight: height,
  };
}

function pad(str, len) {
  return String(str).padEnd(len);
}

async function main() {
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();

  const rows = [];

  for (const filename of files) {
    const inputPath = path.join(SOURCE_DIR, filename);
    const meta = await sharp(inputPath).metadata();
    const bounds = await findContentBounds(inputPath);

    if (!bounds) {
      rows.push({ filename, error: 'no content detected' });
      continue;
    }

    const area = bounds.width * bounds.height;
    const scaleTo180 = TARGET_HEIGHT / bounds.height;
    const upscalePercent = (scaleTo180 - 1) * 100;
    const capeHeightPercent = (bounds.height / meta.height) * 100;
    const capeWidthPercent = (bounds.width / meta.width) * 100;

    rows.push({
      filename: filename.replace(/\.png$/i, ''),
      screenshot: meta.width + 'x' + meta.height,
      capeRegion: bounds.width + 'x' + bounds.height,
      area,
      capeHeightPercent: capeHeightPercent.toFixed(2),
      capeWidthPercent: capeWidthPercent.toFixed(2),
      scaleTo180: scaleTo180.toFixed(3),
      upscalePercent: upscalePercent.toFixed(1),
      tier: meta.width >= 2000 ? 'atlas (2560)' : 'export (666)',
    });
  }

  rows.sort((a, b) => (b.area || 0) - (a.area || 0));

  console.log('=== Cape pixel density in source screenshots (before processing) ===\n');
  console.log(
    pad('File', 22) +
      pad('Screenshot', 14) +
      pad('Cape region', 14) +
      pad('Area', 8) +
      pad('Cape H%', 9) +
      pad('Scale->180h', 12) +
      pad('Upscale', 10) +
      'Tier'
  );

  for (const row of rows) {
    if (row.error) {
      console.log(row.filename + ': ' + row.error);
      continue;
    }
    console.log(
      pad(row.filename, 22) +
        pad(row.screenshot, 14) +
        pad(row.capeRegion, 14) +
        pad(row.area, 8) +
        pad(row.capeHeightPercent, 9) +
        pad(row.scaleTo180, 12) +
        pad(row.upscalePercent + '%', 10) +
        row.tier
    );
  }

  const fronts = rows.filter((r) => r.filename.includes('front') && !r.error);
  const maxArea = Math.max(...fronts.map((r) => r.area));

  console.log('\n=== Front views: detail relative to richest source ===');
  for (const row of [...fronts].sort((a, b) => b.area - a.area)) {
    const ratio = ((row.area / maxArea) * 100).toFixed(1);
    console.log(
      pad(row.filename, 20) +
        pad(row.capeRegion, 12) +
        'area=' +
        pad(row.area, 7) +
        ratio +
        '% of max | upscale to 180h: ' +
        row.upscalePercent +
        '%'
    );
  }

  const home = fronts.find((r) => r.filename === 'homefront');
  const copper = fronts.find((r) => r.filename === 'copperfront');
  if (home && copper) {
    const areaRatio = (copper.area / home.area).toFixed(2);
    const heightRatio = (copper.bounds?.height || parseInt(copper.capeRegion.split('x')[1], 10)) /
      parseInt(home.capeRegion.split('x')[1], 10);
    console.log('\n=== Home vs Copper (front) ===');
    console.log('Home:   screenshot ' + home.screenshot + ', cape ' + home.capeRegion + ', area ' + home.area);
    console.log('Copper: screenshot ' + copper.screenshot + ', cape ' + copper.capeRegion + ', area ' + copper.area);
    console.log('Copper has ' + areaRatio + 'x the pixel area of Home in source');
    console.log(
      'Copper cape height is ' +
        (parseInt(copper.capeRegion.split('x')[1], 10) / parseInt(home.capeRegion.split('x')[1], 10)).toFixed(2) +
        'x Home cape height'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
