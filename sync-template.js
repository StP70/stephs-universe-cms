#!/usr/bin/env node
/**
 * Steph's Universe CMS - Template Sync
 * Synchronisiert template.html in die eingebettete TEMPLATE_HTML-Konstante in admin.html.
 * Ausführen nach jeder Änderung an template.html:
 *   node sync-template.js
 */

const fs = require('fs');
const path = require('path');

const ADMIN_PATH = path.join(__dirname, 'admin.html');
const TEMPLATE_PATH = path.join(__dirname, 'template.html');

// Template laden
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// admin.html laden
let admin = fs.readFileSync(ADMIN_PATH, 'utf8');

// Embedded Template als JS-String vorbereiten:
// - Backticks escapen (Template-Literal)
// - ${} escapen (damit JS sie nicht interpretiert)
// - \u-Escapes für Sonderzeichen beibehalten
const escaped = template
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')
  .replace(/<\/script>/gi, '<\\/script>');

// Minify: mehrzeilige CSS/HTML auf einzelne Zeilen komprimieren (optional)
const minified = escaped
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .join('\n');

// TEMPLATE_HTML-Konstante in admin.html ersetzen
const marker = /\/\/ ---- Embedded Template.*?\nconst TEMPLATE_HTML = `[\s\S]*?`;\s*/;
const match = admin.match(marker);

if (!match) {
  console.error('  ✗ Konnte TEMPLATE_HTML in admin.html nicht finden.');
  process.exit(1);
}

const replacement = `// ---- Embedded Template (Fallback wenn fetch('template.html') fehlschlägt) ----\nconst TEMPLATE_HTML = \`${minified}\`;\n`;
admin = admin.replace(marker, replacement);

fs.writeFileSync(ADMIN_PATH, admin, 'utf8');
console.log(`\n  Template synchronisiert: template.html → admin.html (TEMPLATE_HTML)`);
console.log(`  ${template.split('\n').length} Zeilen → eingebettet.\n`);
