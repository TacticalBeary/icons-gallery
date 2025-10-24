// build-images-json.mjs
// Usage: node build-images-json.mjs
// Scans /images (recursively), outputs images.json like:
// [ { "src": "images/foo.webp", "title": "Foo" }, ... ]

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, 'images');
const OUT_FILE = path.join(ROOT, 'images.json');

// Which file extensions to include:
const exts = new Set(['.webp','.avif','.png','.jpg','.jpeg','.gif','.svg']);

function prettifyTitle(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  return base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([a-z])/g, (m, c) => c.toUpperCase()); // Title Case
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(p));
    } else if (exts.has(path.extname(e.name).toLowerCase())) {
      files.push(p);
    }
  }
  return files;
}

function toWebPath(absPath) {
  return absPath
    .replace(ROOT + path.sep, '')
    .replace(/\\/g, '/'); // windows -> web
}

(async () => {
  // Ensure images dir exists
  try { await fs.access(IMAGES_DIR); }
  catch { 
    console.error('No images/ folder found. Create images/ and put your icons there.');
    process.exit(1);
  }

  const files = await walk(IMAGES_DIR);

  // Sort by path for stable output
  files.sort((a, b) => a.localeCompare(b));

  const items = files.map(p => {
    const webPath = toWebPath(p);
    const title = prettifyTitle(path.basename(p));
    return { src: webPath, title };
  });

  await fs.writeFile(OUT_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log(`Wrote ${items.length} items to ${path.basename(OUT_FILE)}.`);
})();
