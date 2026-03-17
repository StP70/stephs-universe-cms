#!/usr/bin/env node
/**
 * Steph's Universe CMS - Static Site Builder
 * Liest JSON-Dateien aus /pages und generiert HTML aus dem Template.
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');
const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const ASSETS_SRC = path.join(__dirname, 'assets');

// Erstelle dist-Ordner
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

// Template laden
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Alle JSON-Pages laden
const pageFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.json'));

console.log(`\n  Steph's Universe CMS - Build\n`);
console.log(`  ${pageFiles.length} Seite(n) gefunden.\n`);

pageFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf8'));
  const html = render(template, data);

  const outDir = path.join(DIST_DIR, data.slug);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`  -> ${data.slug}/index.html`);

  // Assets kopieren
  const assetsOut = path.join(outDir, 'assets');
  if (fs.existsSync(ASSETS_SRC)) {
    if (!fs.existsSync(assetsOut)) fs.mkdirSync(assetsOut, { recursive: true });
    fs.readdirSync(ASSETS_SRC).forEach(f => {
      fs.copyFileSync(path.join(ASSETS_SRC, f), path.join(assetsOut, f));
    });
  }
});

// Index-Seite mit allen Pages
const indexLinks = pageFiles.map(file => {
  const data = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf8'));
  return `<a href="${data.slug}/">${data.title}</a>`;
}).join('\n    ');

const indexHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Steph's Universe - Alle Seiten</title>
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
    <h1>Steph's Universe</h1>
    <p>Alle veröffentlichten Seiten:</p>
    ${indexLinks}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf8');
console.log(`  -> index.html (Übersicht)\n`);
console.log(`  Build fertig! -> dist/\n`);

// ---- Template Engine ----
function render(tpl, data) {
  data.firstSectionId = data.sections[0]?.id || '';
  if (!data.theme) data.theme = 'dark';
  if (!data.lang) data.lang = 'de';
  if (!data.iconSize) data.iconSize = '46';

  let html = tpl;

  // {{{key}}} raw HTML FIRST – skip {{{this}}} (used in loops)
  // Must run before {{key}} to avoid partial match on triple-brace patterns
  html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
    if (key === 'this') return `{{{${key}}}}`;
    return data[key] !== undefined ? data[key] : '';
  });

  // Simple values: {{key}} – skip template keywords (this, #each, #if, etc.)
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === 'this' || key === 'each' || key === 'if' || key === 'unless') return `{{${key}}}`;
    return data[key] !== undefined ? data[key] : '';
  });

  // {{#if iconUrl}} ... {{/if}}
  html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (__, k) => data[k] || '') : '';
  });

  // Process sections – find the LAST (largest) #each sections block
  // The first one is the nav (small), the second is the content (large with nested #each)
  function findOuterEachSections(str) {
    const allMatches = [];
    const re = /\{\{#each sections\}\}/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      const start = m.index;
      const contentStart = start + m[0].length;
      // Find matching {{/each}} by counting nesting
      let depth = 1;
      let pos = contentStart;
      while (depth > 0 && pos < str.length) {
        const nextOpen = str.indexOf('{{#each', pos);
        const nextClose = str.indexOf('{{/each}}', pos);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + 7;
        } else {
          depth--;
          if (depth === 0) {
            allMatches.push({
              full: str.substring(start, nextClose + 9),
              content: str.substring(contentStart, nextClose),
              index: start
            });
          }
          pos = nextClose + 9;
        }
      }
    }
    return allMatches;
  }
  const sectionMatches = findOuterEachSections(html);
  const sectionMatch = sectionMatches.length > 1 ? { 0: sectionMatches[1].full, 1: sectionMatches[1].content } : (sectionMatches[0] ? { 0: sectionMatches[0].full, 1: sectionMatches[0].content } : null);
  if (sectionMatch) {
    const sectionTpl = sectionMatch[1];
    const sectionsHtml = data.sections.map((section, idx) => {
      let s = sectionTpl;

      // @first
      s = s.replace(/\{\{#unless @first\}\}([\s\S]*?)\{\{\/unless\}\}/, (_, content) => {
        return idx === 0 ? '' : content;
      });

      // Process ALL block-level constructs FIRST (before simple field replacement)
      // This prevents {{this.title}} at section level from overwriting {{this.title}} inside card loops

      // Image conditional
      s = s.replace(/\{\{#if this\.image\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
        if (!section.image) return '';
        return content.replace(/\{\{this\.image\}\}/g, section.image).replace(/\{\{this\.title\}\}/g, section.title);
      });

      // Paragraphs
      s = s.replace(/\{\{#each this\.paragraphs\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, content) => {
        if (!section.paragraphs) return '';
        return section.paragraphs.map((p, pi) => {
          let c = content;
          c = c.replace(/\{\{\{this\}\}\}/g, p.replace(/\n/g, '<br>'));
          c = c.replace(/\{\{#unless @first\}\}([\s\S]*?)\{\{\/unless\}\}/g, (__, inner) => pi === 0 ? '' : inner);
          return c;
        }).join('\n');
      });

      // Quote
      s = s.replace(/\{\{#if this\.quote\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
        if (!section.quote) return '';
        return content
          .replace(/\{\{this\.quote\.text\}\}/g, section.quote.text)
          .replace(/\{\{this\.quote\.cite\}\}/g, section.quote.cite);
      });

      // Cards
      s = s.replace(/\{\{#if this\.cards\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
        if (!section.cards) return '';
        const cardMatch = content.match(/\{\{#each this\.cards\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (!cardMatch) return content;
        const cardTpl = cardMatch[1];
        const cardsHtml = section.cards.map(card => {
          return cardTpl
            .replace(/\{\{this\.icon\}\}/g, card.icon)
            .replace(/\{\{this\.title\}\}/g, card.title)
            .replace(/\{\{this\.text\}\}/g, card.text);
        }).join('\n');
        return content.replace(cardMatch[0], cardsHtml);
      });

      // Timeline
      s = s.replace(/\{\{#if this\.timeline\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
        if (!section.timeline) return '';
        const tlMatch = content.match(/\{\{#each this\.timeline\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (!tlMatch) return content;
        const tlTpl = tlMatch[1];
        const tlHtml = section.timeline.map(item => {
          return tlTpl
            .replace(/\{\{this\.time\}\}/g, item.time)
            .replace(/\{\{this\.text\}\}/g, item.text);
        }).join('\n');
        return content.replace(tlMatch[0], tlHtml);
      });

      // Videos
      s = s.replace(/\{\{#if this\.videos\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
        if (!section.videos) return '';
        const vMatch = content.match(/\{\{#each this\.videos\}\}([\s\S]*?)\{\{\/each\}\}/);
        if (!vMatch) return content;
        const vTpl = vMatch[1];
        const vHtml = section.videos.map(video => {
          return vTpl
            .replace(/\{\{this\.url\}\}/g, video.url)
            .replace(/\{\{this\.thumbnail\}\}/g, video.thumbnail)
            .replace(/\{\{this\.title\}\}/g, video.title)
            .replace(/\{\{this\.description\}\}/g, video.description)
            .replace(/\{\{this\.badge\}\}/g, video.badge)
            .replace(/\{\{this\.badgeType\}\}/g, video.badgeType);
        }).join('\n');
        return content.replace(vMatch[0], vHtml);
      });

      // Warning
      s = s.replace(/\{\{#if this\.warning\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
        if (!section.warning) return '';
        return content
          .replace(/\{\{this\.warning\.title\}\}/g, section.warning.title)
          .replace(/\{\{this\.warning\.text\}\}/g, section.warning.text);
      });

      // LAST: Simple section fields (only replaces remaining {{this.X}} not inside blocks)
      s = s.replace(/\{\{this\.(\w+)\}\}/g, (_, key) => {
        if (typeof section[key] === 'string') return section[key];
        return '';
      });

      return s;
    }).join('\n');

    html = html.replace(sectionMatch[0], sectionsHtml);
  }

  // Nav sections
  const navMatch = html.match(/\{\{#each sections\}\}([\s\S]*?)\{\{\/each\}\}/);
  if (navMatch) {
    const navTpl = navMatch[1];
    const navHtml = data.sections.map(s => {
      return navTpl
        .replace(/\{\{this\.id\}\}/g, s.id)
        .replace(/\{\{this\.navLabel\}\}/g, s.navLabel);
    }).join('\n');
    html = html.replace(navMatch[0], navHtml);
  }

  // Footer raw HTML
  html = html.replace(/\{\{footerText\}\}/g, data.footerText || '');

  return html;
}
