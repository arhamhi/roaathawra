import { parse } from 'csv-parse/sync';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(repoRoot, '..');
const csvPath = path.join(sourceRoot, 'products_export_1.csv');
const sourceMediaDir = path.join(sourceRoot, 'Catalogue_Images', 'Images');
const productOutDir = path.join(repoRoot, 'assets', 'products');
const brandOutDir = path.join(repoRoot, 'assets', 'brand');
const videoOutDir = path.join(repoRoot, 'assets', 'video');
const downloadDir = path.join(repoRoot, '.cache', 'catalog-downloads');
const catalogOutPath = path.join(repoRoot, 'assets', 'catalog.js');

const widths = [640, 1200, 1800];
const featuredHandles = new Set([
  'the-wicker-bed',
  'the-japandi-coffee-table',
  'the-primadonna-sofa-sectional',
  'the-luxury-poster-bed',
  'black-modern-antique-dining-set-6-seater-sheesham-with-glass-top',
  'thawra-dining-table-8-seater-luxury-rosewood-mahogany',
  'aryas-princess-canopy-bed',
  'blue-velveteen-two-seater-sofa',
]);

function normalizeName(value) {
  return path.basename(value || '', path.extname(value || ''))
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/[\u2013\u2014]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(title) {
  return String(title || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+[|-]\s+.*$/, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();
}

function formatPrice(value) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return '';
  return `Rs ${Math.round(numeric).toLocaleString('en-US')}`;
}

function categoriesFor(product) {
  const haystack = `${product.type} ${product.tags} ${product.title}`.toLowerCase();
  const cats = new Set();

  if (/outdoor|treehouse|playhouse/.test(haystack)) cats.add('outdoor');
  if (/kid|baby|crib|bunk|toddler|canopy/.test(haystack)) cats.add('kids');
  if (/bedroom|bed|dresser|daybed/.test(haystack)) cats.add('bedroom');
  if (/living|sofa|chair|bench|ottoman|loveseat|sectional/.test(haystack)) cats.add('living');
  if (/dining/.test(haystack)) cats.add('dining');
  if (/table|desk/.test(haystack) && !/dining/.test(haystack)) cats.add('tables');
  if (/cabinet|console|bookshelf|storage|dresser|tv console|drawer/.test(haystack)) cats.add('storage');

  if (!cats.size) cats.add('living');
  return [...cats];
}

function assetPath(value) {
  return value.replaceAll(path.sep, '/').replace(/^assets\//, 'assets/');
}

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function localImageMap() {
  const entries = await fs.readdir(sourceMediaDir, { withFileTypes: true });
  const images = entries
    .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name))
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(sourceMediaDir, entry.name),
      key: normalizeName(entry.name),
    }));

  const map = new Map();
  for (const image of images) map.set(image.key, image);
  return map;
}

async function downloadImage(url, handle, position) {
  await fs.mkdir(downloadDir, { recursive: true });
  const extFromUrl = path.extname(new URL(url).pathname) || '.png';
  const target = path.join(downloadDir, `${handle}-${position}${extFromUrl}`);

  try {
    await fs.access(target);
    return target;
  } catch {
    // Continue to download.
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  await pipeline(response.body, createWriteStream(target));
  return target;
}

async function imageInputFor(row, localMap, handle, position) {
  const imageUrl = row['Image Src'];
  const urlName = imageUrl ? path.basename(new URL(imageUrl).pathname) : '';
  const match = localMap.get(normalizeName(urlName));
  if (match) return match.fullPath;
  if (imageUrl) return downloadImage(imageUrl, handle, position);
  return null;
}

async function convertProductImage(inputPath, productDir, handle, position, alt) {
  const metadata = await sharp(inputPath).metadata();
  const availableWidths = widths.filter((width) => !metadata.width || width <= metadata.width);
  if (!availableWidths.length) availableWidths.push(metadata.width || 640);

  const outputBase = `${handle}-${position}`;
  const outputs = [];

  for (const width of availableWidths) {
    const filename = `${outputBase}-${width}.webp`;
    const fullPath = path.join(productDir, filename);
    await sharp(inputPath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(fullPath);
    outputs.push({
      width,
      src: assetPath(path.relative(repoRoot, fullPath)),
    });
  }

  const largest = outputs.at(-1);
  return {
    alt,
    src: largest.src,
    srcset: outputs.map((item) => `${item.src} ${item.width}w`).join(', '),
    width: largest.width,
  };
}

async function convertResponsiveImage(inputPath, outDir, outputBase, alt) {
  const metadata = await sharp(inputPath).metadata();
  const availableWidths = widths.filter((width) => !metadata.width || width <= metadata.width);
  if (!availableWidths.length) availableWidths.push(metadata.width || 640);

  const outputs = [];
  for (const width of availableWidths) {
    const filename = `${outputBase}-${width}.webp`;
    const fullPath = path.join(outDir, filename);
    await sharp(inputPath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(fullPath);
    outputs.push({
      width,
      src: assetPath(path.relative(repoRoot, fullPath)),
    });
  }

  const largest = outputs.at(-1);
  return {
    alt,
    src: largest.src,
    srcset: outputs.map((item) => `${item.src} ${item.width}w`).join(', '),
    width: largest.width,
  };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath.path, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}\n${stderr}`));
    });
  });
}

async function convertVideo(sourceName, outputName) {
  const input = path.join(sourceMediaDir, sourceName);
  const output = path.join(videoOutDir, `${outputName}.mp4`);
  const posterJpg = path.join(videoOutDir, `${outputName}-poster.jpg`);
  const posterWebp = path.join(videoOutDir, `${outputName}-poster.webp`);

  await runFfmpeg([
    '-y',
    '-i', input,
    '-vf', 'scale=min(1920\\,iw):-2',
    '-an',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '24',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    output,
  ]);

  await runFfmpeg([
    '-y',
    '-ss', '00:00:01',
    '-i', input,
    '-frames:v', '1',
    posterJpg,
  ]);

  await sharp(posterJpg)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(posterWebp);
  await fs.rm(posterJpg, { force: true });

  return {
    src: assetPath(path.relative(repoRoot, output)),
    poster: assetPath(path.relative(repoRoot, posterWebp)),
  };
}

async function main() {
  await ensureCleanDir(productOutDir);
  await ensureCleanDir(brandOutDir);
  await ensureCleanDir(videoOutDir);

  const [csvText, localMap] = await Promise.all([
    fs.readFile(csvPath, 'utf8'),
    localImageMap(),
  ]);

  const rows = parse(csvText, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  const groups = new Map();
  for (const row of rows) {
    const handle = row.Handle;
    if (!handle) continue;
    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle).push(row);
  }

  const products = [];
  let imageCount = 0;
  let downloadedCount = 0;

  for (const [handle, group] of groups) {
    const main = group.find((row) => row.Title) || group[0];
    const productDir = path.join(productOutDir, handle);
    await fs.mkdir(productDir, { recursive: true });

    const imageRows = group.filter((row) => row['Image Src']);
    const images = [];

    for (let index = 0; index < imageRows.length; index += 1) {
      const source = await imageInputFor(imageRows[index], localMap, handle, index + 1);
      if (!source) continue;
      if (source.includes(`${path.sep}.cache${path.sep}`)) downloadedCount += 1;
      const image = await convertProductImage(source, productDir, handle, index + 1, imageRows[index]['Image Alt Text'] || cleanTitle(main.Title));
      images.push(image);
      imageCount += 1;
    }

    if (!images.length) {
      throw new Error(`No usable image for ${handle}`);
    }

    const description = stripHtml(main['Body (HTML)']);
    products.push({
      handle,
      title: cleanTitle(main.Title),
      fullTitle: main.Title,
      type: main.Type || 'Furniture',
      categories: categoriesFor({
        title: main.Title,
        type: main.Type,
        tags: main.Tags,
      }),
      tags: main.Tags ? main.Tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      price: formatPrice(main['Variant Price']),
      description: description.length > 180 ? `${description.slice(0, 177).trim()}...` : description,
      featured: featuredHandles.has(handle),
      images,
    });
  }

  const video = {
    hero: await convertVideo('living room roaa.mp4', 'hero-living-room-roaa'),
    footer: await convertVideo('roaa room 3.mp4', 'footer-roaa-room-3'),
  };

  const brand = {
    homeAbout: await convertResponsiveImage(path.join(sourceMediaDir, 'roaa.png'), brandOutDir, 'roaa-studio', 'Roaathawra studio interior'),
    aboutHero: await convertResponsiveImage(path.join(sourceMediaDir, 'roaa b&w landscape.png'), brandOutDir, 'roaa-about-landscape', 'Roaathawra black and white room scene'),
    aboutTeam: await convertResponsiveImage(path.join(sourceMediaDir, 'roaa room 3.png'), brandOutDir, 'roaa-room-scene', 'Roaathawra crafted room scene'),
  };

  const catalog = {
    generatedAt: new Date().toISOString(),
    products,
    filters: [
      ['all', 'All'],
      ['bedroom', 'Bedroom'],
      ['living', 'Living'],
      ['dining', 'Dining'],
      ['kids', 'Kids'],
      ['tables', 'Tables'],
      ['storage', 'Storage'],
      ['outdoor', 'Outdoor'],
    ],
    video,
    brand,
  };

  const js = `window.ROAATHAWRA_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
  await fs.writeFile(catalogOutPath, js, 'utf8');

  console.log(`Imported ${products.length} products`);
  console.log(`Converted ${imageCount} product images (${downloadedCount} downloaded from CSV URLs)`);
  console.log(`Generated ${video.hero.src} and ${video.footer.src}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
