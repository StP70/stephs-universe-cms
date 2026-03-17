#!/usr/bin/env node
/**
 * Steph's Universal Pagebuilder CMS - Static Site Builder
 * Liest JSON-Dateien aus /pages und generiert HTML aus dem Template.
 */

const fs = require('fs');
const path = require('path');
const { render } = require('./render.js');

const PAGES_DIR = path.join(__dirname, 'pages');
const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const ASSETS_SRC = path.join(__dirname, 'assets');

// HTML-Escape für sichere Ausgabe in generierten Seiten
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- dist/ aufräumen (alte Seiten entfernen, Config behalten) ----
const KEEP_IN_DIST = new Set(['.gitignore', '.vercel', '.nojekyll']);
if (fs.existsSync(DIST_DIR)) {
  fs.readdirSync(DIST_DIR).forEach(entry => {
    if (KEEP_IN_DIST.has(entry)) return;
    const fullPath = path.join(DIST_DIR, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  });
} else {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Template laden
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Alle JSON-Pages laden (ignoriere Dateien mit _ Prefix)
const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));

console.log(`\n  Steph's Universal Pagebuilder CMS - Build\n`);
console.log(`  ${pageFiles.length} Seite(n) gefunden.\n`);

// ---- Assets einmalig nach dist/assets/ kopieren ----
const assetsOut = path.join(DIST_DIR, 'assets');
if (fs.existsSync(ASSETS_SRC)) {
  if (!fs.existsSync(assetsOut)) fs.mkdirSync(assetsOut, { recursive: true });
  fs.readdirSync(ASSETS_SRC).forEach(f => {
    fs.copyFileSync(path.join(ASSETS_SRC, f), path.join(assetsOut, f));
  });
  console.log(`  -> assets/ (${fs.readdirSync(ASSETS_SRC).length} Dateien)\n`);
}

// ---- Seiten bauen ----
let errors = 0;
const builtPages = [];

pageFiles.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf8'));

    // Slug validieren
    if (!data.slug) {
      throw new Error('Slug fehlt – Seite wird übersprungen');
    }
    if (data.slug !== data.slug.toLowerCase()) {
      console.log(`  ⚠ ${file}: Slug "${data.slug}" enthält Großbuchstaben (kann URL-Probleme verursachen)`);
    }

    let html = render(template, data);

    // Asset-Pfade umschreiben: "assets/X" → "../assets/X" (für shared dist/assets/)
    // Nur relative Pfade, keine data: URLs oder https:// URLs
    html = html.replace(/(["'])assets\//g, '$1../assets/');

    const outDir = path.join(DIST_DIR, data.slug);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log(`  -> ${data.slug}/index.html`);

    builtPages.push({ slug: data.slug, title: data.title });
  } catch (err) {
    errors++;
    console.error(`  ✗ ${file}: ${err.message}`);
  }
});

// ---- Index-Seite mit allen Pages ----
const indexLinks = builtPages.map(p => {
  return `<a href="${escHtml(p.slug)}/">${escHtml(p.title)}</a>`;
}).join('\n    ');

const indexHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Steph's Universal Pagebuilder - Alle Seiten</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .wrap { max-width: 600px; padding: 3rem; }
    h1 { font-size: 2rem; margin-bottom: .5rem; }
    p { color: #a3a3a3; margin-bottom: 2rem; }
    a { display: block; padding: 1rem 1.5rem; margin-bottom: .75rem; background: #1a1a1a; border: 1px solid rgba(255,255,255,.06); border-radius: 12px; color: #10b981; text-decoration: none; font-weight: 600; transition: all .2s; }
    a:hover { border-color: #10b981; transform: translateX(4px); }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Steph's Universal Pagebuilder</h1>
    <p>Alle veröffentlichten Seiten:</p>
    ${indexLinks}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');
console.log(`\n  -> index.html (Übersicht)`);

if (errors > 0) {
  console.log(`\n  Build fertig mit ${errors} Fehler(n)! -> dist/\n`);
  process.exit(1);
} else {
  console.log(`\n  Build fertig! -> dist/\n`);
}
