#!/usr/bin/env node
/**
 * Steph's Universe CMS - KI-Content-Generator (CLI)
 *
 * Nutzung:
 *   node generate.js "Zahnarztpraxis Wien" --variants 3
 *   node generate.js "Fitness-Studio" --variants 2 --provider openai
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { buildPrompt, JSON_SCHEMA, VARIANT_MATRIX, validateAndFix, extractJSON } = require('./prompt.js');

// ---- .env laden ----
function loadEnv() {
  try {
    const lines = fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (key && val) process.env[key] = val;
    });
  } catch(e) {}
}
loadEnv();

// ---- Args parsen ----
const args = process.argv.slice(2);
let description = '';
let variants = 3;
let provider = 'claude';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--variants' && args[i + 1]) { variants = Math.min(5, Math.max(1, parseInt(args[i + 1]))); i++; }
  else if (args[i] === '--provider' && args[i + 1]) { provider = args[i + 1]; i++; }
  else if (!args[i].startsWith('--')) { description += (description ? ' ' : '') + args[i]; }
}

if (!description) {
  console.log(`\n  Steph's Universe CMS - KI-Content-Generator\n`);
  console.log('  Nutzung: node generate.js "Beschreibung" [--variants N] [--provider claude|openai]\n');
  console.log('  Beispiel: node generate.js "Zahnarztpraxis Wien, modern" --variants 3\n');
  process.exit(1);
}

// ---- HTTPS POST ----
function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: 60000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          let msg = `HTTP ${res.statusCode}`;
          try { msg += ': ' + JSON.parse(data).error?.message; } catch(e) { msg += ': ' + data.substring(0, 200); }
          reject(new Error(msg));
        } else {
          try { resolve(JSON.parse(data)); } catch(e) { reject(new Error('Invalid JSON response')); }
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('API timeout (60s)')); });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// ---- API Calls ----
async function callClaude(prompt) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY nicht in .env gesetzt');
  const response = await httpsPost('https://api.anthropic.com/v1/messages', {
    'x-api-key': apiKey, 'anthropic-version': '2023-06-01'
  }, {
    model: 'claude-sonnet-4-20250514', max_tokens: 4096,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
    tools: [{ name: 'generate_page', description: 'Generate CMS page JSON', input_schema: JSON_SCHEMA }],
    tool_choice: { type: 'tool', name: 'generate_page' }
  });
  const toolBlock = response.content && response.content.find(b => b.type === 'tool_use');
  if (toolBlock) return toolBlock.input;
  const textBlock = response.content && response.content.find(b => b.type === 'text');
  if (textBlock) return extractJSON(textBlock.text);
  throw new Error('Unerwartetes Claude-Antwortformat');
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY nicht in .env gesetzt');
  const response = await httpsPost('https://api.openai.com/v1/chat/completions', {
    'Authorization': 'Bearer ' + apiKey
  }, {
    model: 'gpt-4o', max_tokens: 4096,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ],
    response_format: { type: 'json_object' }
  });
  const raw = response.choices && response.choices[0] && response.choices[0].message.content;
  if (!raw) throw new Error('Leere OpenAI-Antwort');
  return extractJSON(raw);
}

// ---- Main ----
async function main() {
  console.log(`\n  Steph's Universe CMS - KI-Content-Generator\n`);
  console.log(`  Provider: ${provider === 'openai' ? 'OpenAI' : 'Claude'}`);
  console.log(`  Varianten: ${variants}`);
  console.log(`  Beschreibung: "${description}"\n`);

  const callFn = provider === 'openai' ? callOpenAI : callClaude;
  const genDir = path.join(__dirname, 'pages', '_generated');
  if (!fs.existsSync(genDir)) fs.mkdirSync(genDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  let errors = 0;

  for (let i = 0; i < variants; i++) {
    const variant = VARIANT_MATRIX[i % VARIANT_MATRIX.length];
    process.stdout.write(`  Variante ${i + 1}/${variants} (${variant.theme}/${variant.tone.split(' ')[0]})...`);

    try {
      const prompt = buildPrompt(description, i);
      const raw = await callFn(prompt);
      const { errors: valErrors, data } = validateAndFix(raw);

      if (valErrors.length > 0) {
        console.log(` ⚠ Warnungen: ${valErrors.join(', ')}`);
      }

      // Dateiname: slug_2026-03-17_v1-dark.json
      const filename = (data.slug || 'seite') + '_' + today + '_v' + (i + 1) + '-' + (data.theme || 'dark') + '.json';
      const filePath = path.join(genDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(` -> _generated/${filename}`);
    } catch(err) {
      errors++;
      console.log(` ✗ ${err.message}`);
    }
  }

  console.log(`\n  ${errors === 0 ? 'Fertig!' : errors + ' Fehler.'} Nächster Schritt: node build.js\n`);
}

main().catch(err => {
  console.error('\n  Fehler:', err.message, '\n');
  process.exit(1);
});
