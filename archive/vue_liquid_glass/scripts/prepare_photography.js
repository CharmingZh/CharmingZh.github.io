#!/usr/bin/env node
/*
  Prepare photography assets:
  - Read images from src/assets/temp_folder
  - Extract EXIF DateTimeOriginal and other metadata (fallback to file mtime)
  - Sort ascending by time
  - Copy to public/Photography with new names: photo_YYYYMMDD_HHmmss_XXXX.ext
  - Generate public/Photography/manifest.json with metadata for the Vue page
*/

import fs from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';

const ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'temp_folder');
const OUT_DIR = path.join(ROOT, 'public', 'Photography');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP']);
const SKIP_RAW = new Set(['.dng', '.DNG', '.nef', '.NEF', '.arw', '.ARW', '.cr2', '.CR2']);

function formatDate(d) {
  const pad = (n, l=2) => String(n).padStart(l, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${y}${m}${dd}_${hh}${mm}${ss}`;
}

function formatExposure(exp) {
  if (typeof exp === 'number') {
    if (exp >= 1) return `${exp.toFixed(1)}s`;
    const denom = Math.round(1 / exp);
    return `1/${denom}s`;
  }
  return String(exp ?? '');
}

function formatFocal(f) {
  if (typeof f === 'number') return `${Math.round(f)}mm`;
  if (typeof f === 'object' && f?.numerator) {
    return `${Math.round(f.numerator / (f.denominator || 1))}mm`;
  }
  return String(f ?? '');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function cleanOldGenerated(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    await Promise.all(entries.map(async (ent) => {
      if (!ent.isFile()) return;
      if (ent.name === 'manifest.json') {
        await fs.rm(path.join(dir, ent.name));
        return;
      }
      if (/^photo_\d{8}_\d{6}_\d{4}\.[a-zA-Z0-9]+$/.test(ent.name)) {
        await fs.rm(path.join(dir, ent.name));
      }
    }));
  } catch {}
}

async function main() {
  await ensureDir(OUT_DIR);

  const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => {
      const ext = path.extname(n);
      if (SKIP_RAW.has(ext)) return false; // skip RAW formats not browser-friendly
      return ALLOWED.has(ext);
    });

  const items = [];
  for (const name of files) {
    const abs = path.join(SRC_DIR, name);
    const stat = await fs.stat(abs);
    let exif = null;
    try {
      exif = await exifr.parse(abs);
    } catch {}
    const dateRaw = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate || stat.mtime;
    const date = dateRaw instanceof Date ? dateRaw : new Date(dateRaw || stat.mtimeMs);
    const make = exif?.Make || exif?.make || '';
    const model = exif?.Model || exif?.model || '';
    const iso = exif?.ISO || exif?.Iso || exif?.iso || '';
    const fnum = exif?.FNumber || exif?.FNum || exif?.ApertureValue || '';
    const exposure = exif?.ExposureTime || exif?.Exposure || exif?.ShutterSpeedValue || '';
    const focal = exif?.FocalLength || exif?.FocalLengthIn35mmFormat || '';

    items.push({ name, abs, ext: path.extname(name).toLowerCase(), stat, date, meta: {
      dateISO: date.toISOString(),
      camera: [make, model].filter(Boolean).join(' '),
      iso: iso ? `ISO ${iso}` : '',
      aperture: fnum ? `f/${typeof fnum === 'number' ? fnum.toFixed(1) : fnum}` : '',
      shutter: exposure ? formatExposure(exposure) : '',
      focal: focal ? formatFocal(focal) : '',
    }});
  }

  // Sort by date ascending
  items.sort((a, b) => a.date - b.date);

  // Clean old generated
  await cleanOldGenerated(OUT_DIR);

  const manifest = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const ts = formatDate(item.date);
    const seq = String(i + 1).padStart(4, '0');
    const newBase = `photo_${ts}_${seq}${item.ext}`;
    const dest = path.join(OUT_DIR, newBase);
    await fs.copyFile(item.abs, dest);

    manifest.push({
      file: newBase,
      src: `/Photography/${newBase}`,
      ...item.meta,
    });
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Prepared ${manifest.length} images -> ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
