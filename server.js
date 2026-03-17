#!/usr/bin/env node
/**
 * Steph's Universe CMS - Combined Server
 * Statische Dateien + API-Proxy für KI-Content-Generator
 *
 * Starten: node server.js
 * Öffnen:  http://localhost:3000
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { buildPrompt, JSON_SCHEMA, validateAndFix, extractJSON } = require('./prompt.js');

// ---- .env laden (hand-parsed, kein dotenv) ----
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

const PORT = process.env.PORT || 3000;

// ---- MIME-Types ----
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// ---- HTTPS POST Helper ----
function httpsPost(url, headers, body, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout
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

// ---- Claude API Call ----
async function callClaude(prompt) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY nicht in .env gesetzt');

  const response = await httpsPost('https://api.anthropic.com/v1/messages', {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  }, {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
    tools: [{
      name: 'generate_page',
      description: 'Generate a complete CMS page as JSON',
      input_schema: JSON_SCHEMA
    }],
    tool_choice: { type: 'tool', name: 'generate_page' }
  });

  // tool_use Response
  const toolBlock = response.content && response.content.find(b => b.type === 'tool_use');
  if (toolBlock) return toolBlock.input;

  // Fallback: Text-Response
  const textBlock = response.content && response.content.find(b => b.type === 'text');
  if (textBlock) return extractJSON(textBlock.text);

  throw new Error('Unerwartetes Claude-Antwortformat');
}

// ---- OpenAI API Call ----
async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY nicht in .env gesetzt');

  const response = await httpsPost('https://api.openai.com/v1/chat/completions', {
    'Authorization': 'Bearer ' + apiKey
  }, {
    model: 'gpt-4o',
    max_tokens: 4096,
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

// ---- /api/generate Handler ----
async function handleGenerate(body, res) {
  try {
    const { provider, description, variantIndex } = body;
    if (!description) throw new Error('Beschreibung fehlt');

    const prompt = buildPrompt(description, variantIndex || 0);
    let raw;

    if (provider === 'openai') {
      raw = await callOpenAI(prompt);
    } else {
      raw = await callClaude(prompt);
    }

    const { errors, data } = validateAndFix(raw);
    if (errors.length > 0 && !data) {
      throw new Error('Validierung fehlgeschlagen: ' + errors.join(', '));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch(err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ---- HTTP Server ----
const server = http.createServer((req, res) => {
  // CORS für lokale Entwicklung
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API-Proxy
  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        handleGenerate(JSON.parse(body), res);
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request: ' + e.message }));
      }
    });
    return;
  }

  // Statische Dateien
  let filePath = path.join(__dirname, req.url === '/' ? 'admin.html' : decodeURIComponent(req.url));
  // Sicherheit: kein Path Traversal
  if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Steph's Universe CMS Server\n`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  API-Keys: Claude ${process.env.CLAUDE_API_KEY ? '✓' : '✗'}  OpenAI ${process.env.OPENAI_API_KEY ? '✓' : '✗'}\n`);
});
