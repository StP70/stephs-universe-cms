---
title: "feat: KI-Content-Generator für Homepage-Erstellung"
type: feat
date: 2026-03-17
---

# KI-Content-Generator für Homepage-Erstellung

## Overview

KI-gestützter Content-Generator der aus einer Freitext-Beschreibung fertige CMS-JSON-Dateien produziert. Mehrere Varianten gleichzeitig generierbar (1-5), jede unterschiedlich in Theme, Tonality und Sektionsstruktur. Zwei Provider (Claude API + OpenAI API), zwei Frontends (Browser + CLI).

## Proposed Solution

### Architektur-Entscheidung: Combined Server

**Problem:** Claude/OpenAI APIs blockieren Browser-Requests via CORS.

**Lösung:** Ein `server.js` (Node.js `http` Modul, keine Dependencies) das:
1. `admin.html` + statische Dateien auf `localhost:3000` served
2. `/api/generate` als Proxy zu Claude/OpenAI forwarded
3. API-Keys aus `.env` liest (nie im Browser exponiert)

```
Browser (localhost:3000)          server.js              Claude/OpenAI API
┌──────────────────┐     POST    ┌──────────┐   https   ┌──────────────┐
│ admin.html       │───────────→ │ /api/    │─────────→ │ api.anthropic│
│ Generator-UI     │  /api/      │ generate │           │ api.openai   │
│                  │  generate   │          │           │              │
│ fetch('/api/...') │←───────────│ proxy    │←──────────│   response   │
└──────────────────┘   JSON      └──────────┘   JSON    └──────────────┘
                                      │
                                 .env (API-Keys)
```

**CLI** (`generate.js`) ruft APIs direkt auf (kein CORS in Node).

### Varianten-Strategie

| Variante | Theme | Tonality | Sektions-Fokus |
|---|---|---|---|
| 1 | dark | seriös / professionell | Cards + Timeline |
| 2 | light | locker / freundlich | Text + Zitate |
| 3 | colorful | emotional / einladend | Cards + Warnungen |
| 4 | dark | technisch / detailliert | Timeline + Text |
| 5 | light | kreativ / verspielt | Cards + Zitate |

Bei weniger als 5: erste N Zeilen verwenden. **Ein API-Call pro Variante** (zuverlässiger, Fehler verliert nicht alle).

### Prompt-Strategie

Der Prompt enthält:
1. **System-Rolle:** Content-Generator für Webseiten
2. **JSON-Schema:** Alle Felder mit Typen und Beschreibungen
3. **Beispiel-Auszug:** Gekürzte autophagie-fasten.json (nur 1 Sektion, ~40 Zeilen)
4. **Varianten-Anweisung:** Theme, Tonality, Sektions-Fokus für diese Variante
5. **User-Beschreibung:** Der Freitext

**Nicht von der KI generiert** (im Code gesetzt):
- `accentLight` (aus `accentColor` berechnet, wie lightenColor() in admin.html)
- `iconUrl`, `iconLink`, `iconSize`, `cardIconSize` (Defaults)
- `lang` (aus Input-Sprache erkannt oder `'de'`)

**Von der KI generiert:**
- `slug`, `title`, `accentColor`, `theme`
- `heroBg` (leer -- User füllt nach), `heroBadge`, `heroTitle`, `heroSubtitle`, `ctaText`
- `footerText` (mit Standard-Template)
- `sections[]` mit allen Inhaltsblöcken (paragraphs, cards, timeline, quote, warning)
- Card-Icons als Emojis

## Technical Approach

### Neue Dateien

| Datei | Zweck |
|---|---|
| `server.js` | Combined Server: statische Dateien + API-Proxy. Node.js `http`, keine Dependencies. |
| `prompt.js` | Shared Logik: Prompt-Builder, JSON-Validierung, Varianten-Matrix. Node CommonJS. |
| `generate.js` | CLI-Tool: Args-Parsing, API-Call, Datei-Speicherung. Nutzt prompt.js. |
| `.env` | API-Keys (gitignored) |
| `.env.example` | Vorlage: `CLAUDE_API_KEY=` und `OPENAI_API_KEY=` |
| `.gitignore` | Root-Level, mindestens `.env` und `node_modules` |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `admin.html` | Generator-UI (Textarea, Provider-Dropdown, Varianten-Zahl, Generate-Button, Ergebnis-Buttons) |

### server.js (~100 Zeilen)

```javascript
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// .env laden (hand-parsed, kein dotenv)
function loadEnv() {
  try {
    const lines = fs.readFileSync('.env', 'utf8').split('\n');
    lines.forEach(line => {
      const [key, ...val] = line.split('=');
      if (key && !key.startsWith('#')) process.env[key.trim()] = val.join('=').trim();
    });
  } catch(e) {}
}
loadEnv();

const MIME = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json',
  '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  // API-Proxy
  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => handleGenerate(JSON.parse(body), res));
    return;
  }
  // Static Files
  let filePath = path.join(__dirname, req.url === '/' ? 'admin.html' : req.url);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function handleGenerate(body, res) {
  const { provider, prompt, variant } = body;
  // ... API-Call forwarding (Claude oder OpenAI)
  // ... Antwort an Browser zurückschicken
}

server.listen(3000, () => console.log('CMS Server: http://localhost:3000'));
```

### generate.js CLI (~120 Zeilen)

```javascript
#!/usr/bin/env node
// node generate.js "Zahnarztpraxis Wien" --variants 3 --provider claude

const https = require('https');
const fs = require('fs');
const path = require('path');

// .env laden, Args parsen, Prompt bauen, API aufrufen, JSON validieren, speichern
```

**Shared Logik in `prompt.js` (von server.js und generate.js importiert):**
- `buildPrompt(description, variantIndex)` -- baut den vollständigen Prompt
- `validateGeneratedJSON(data)` -- validiert + sanitized das KI-Output
- `VARIANT_MATRIX` -- Theme + Tonality + Fokus pro Variante
- `lightenHex(hex, amount)` -- accentLight berechnen (Kopie der admin.html Logik)

`prompt.js` ist ein Node-only CommonJS-Modul (`module.exports`). Kein UMD nötig, da der Browser den Prompt nicht direkt baut -- er schickt nur `{description, variantIndex}` an `/api/generate`.

**API-Parameter:**
- `max_tokens: 4096` pro Variante (reicht für ~6 Sektionen mit allen Blöcken)
- `timeout: 60s` (Claude/OpenAI können bei großen Outputs 30-60s brauchen)
- Claude: `claude-sonnet-4-20250514` mit `tool_use` für strukturiertes JSON
- OpenAI: `gpt-4o` mit `response_format: json_schema`

### admin.html -- Generator-UI

Neuer Panel-Bereich oberhalb der Seiten-Einstellungen:

```html
<!-- KI-GENERATOR -->
<div class="panel">
  <div class="panel-header" onclick="this.parentElement.classList.toggle('open')">
    <span class="panel-arrow">▶</span> 🤖 KI-Generator
  </div>
  <div class="panel-body">
    <div class="field">
      <label>Beschreibe deine Homepage</label>
      <textarea id="genDescription" rows="4" placeholder="z.B. Zahnarztpraxis in Wien, modern..."></textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Provider</label>
        <select id="genProvider">
          <option value="claude">Claude</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>
      <div class="field">
        <label>Varianten</label>
        <select id="genVariants">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3" selected>3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </div>
    </div>
    <button class="btn btn-accent" id="genButton" onclick="startGeneration()">
      Generieren 🚀
    </button>
    <div id="genStatus" style="margin-top:.75rem"></div>
    <div id="genResults" style="margin-top:.75rem"></div>
  </div>
</div>
```

**JS-Logik in admin.html:**

```javascript
async function startGeneration() {
  const desc = document.getElementById('genDescription').value.trim();
  if (!desc) { alert('Bitte Beschreibung eingeben.'); return; }
  const provider = document.getElementById('genProvider').value;
  const count = parseInt(document.getElementById('genVariants').value);
  const btn = document.getElementById('genButton');
  const status = document.getElementById('genStatus');
  const results = document.getElementById('genResults');

  btn.disabled = true;
  results.innerHTML = '';
  const variants = [];

  for (let i = 0; i < count; i++) {
    status.textContent = `Variante ${i+1}/${count} wird generiert...`;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, description: desc, variantIndex: i })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      variants.push(json);
    } catch(err) {
      status.textContent = `Fehler bei Variante ${i+1}: ${err.message}`;
    }
  }

  status.textContent = `${variants.length} Variante(n) generiert.`;
  btn.disabled = false;

  // Ergebnis-Buttons anzeigen
  results.innerHTML = variants.map((v, i) => `
    <button class="btn btn-sm" style="margin:.25rem"
      onclick="loadVariant(${i})">
      V${i+1}: ${v.theme} / ${v.title}
    </button>
    <button class="btn btn-sm btn-icon" style="margin:.25rem"
      onclick="downloadVariant(${i})">💾</button>
  `).join('');

  window._generatedVariants = variants;
}

function loadVariant(idx) {
  const data = window._generatedVariants[idx];
  if (!data) return;
  // Warnung bei ungespeicherten Änderungen
  if (pageData.slug && !confirm('Aktuelle Seite wird überschrieben. Fortfahren?')) return;
  // Gleiche Logik wie importJSON
  pageData = {
    slug: '', title: '', theme: 'dark', lang: 'de',
    accentColor: '#10b981', accentLight: '#6ee7b7',
    iconUrl: 'assets/icon.png', iconLink: '', iconSize: '46', cardIconSize: '40',
    heroBg: '', heroBadge: '', heroTitle: '', heroSubtitle: '',
    ctaText: 'Mehr erfahren', footerText: '', sections: [],
    ...data
  };
  pageData.sections = pageData.sections.map(s => ({
    id: '', navLabel: '', label: '', title: '', image: '',
    paragraphs: [], quote: null, cards: [], timeline: [], videos: [], warning: null,
    ...s
  }));
  // accentLight berechnen falls nicht gesetzt
  if (data.accentColor && !data.accentLight) {
    pageData.accentLight = lightenColor(data.accentColor, 40);
  }
  loadSettingsToUI();
  renderSections();
  scheduleAutosave();
}

function downloadVariant(idx) {
  const data = window._generatedVariants[idx];
  if (!data) return;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (data.slug || 'variante-' + (idx+1)) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
```

### JSON-Validierung (shared Logik)

```javascript
function validateGeneratedJSON(data) {
  const errors = [];
  if (!data.slug) errors.push('slug fehlt');
  if (!data.title) errors.push('title fehlt');
  if (!data.sections || !Array.isArray(data.sections)) errors.push('sections fehlt/kein Array');
  if (!['dark','light','colorful'].includes(data.theme)) errors.push('ungültiges theme');
  if (data.accentColor && !/^#[0-9a-fA-F]{6}$/.test(data.accentColor)) errors.push('ungültige accentColor');
  // Slug sanitize
  if (data.slug) data.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  // Section-Validierung
  (data.sections || []).forEach((s, i) => {
    if (!s.id) errors.push(`Section ${i+1}: id fehlt`);
    if (!s.navLabel) errors.push(`Section ${i+1}: navLabel fehlt`);
    // id sanitize
    if (s.id) s.id = s.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  });
  return errors;
}
```

## Implementation Phases

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
Setup        server.js    generate.js  admin.html   Test
(.env,       (Static +    (CLI-Tool)   (Generator   Roundtrip
 .gitignore) API-Proxy)                UI + JS)
```

### Phase 1: Setup
- [x] `.gitignore` erstellen (`.env`, `node_modules`, `.claude`)
- [x] `.env.example` erstellen (`CLAUDE_API_KEY=`, `OPENAI_API_KEY=`)
- [x] `.env` erstellen (mit echten Keys zum Testen)

### Phase 2: server.js
- [x] HTTP-Server für statische Dateien (admin.html, render.js, template.html, assets/)
- [x] `/api/generate` Endpoint: nimmt `{provider, description, variantIndex}`
- [x] Prompt-Builder: System-Prompt + JSON-Schema + Beispiel + Varianten-Anweisung + User-Input
- [x] Claude API Call (tool_use für strukturiertes JSON)
- [x] OpenAI API Call (response_format: json_schema)
- [x] JSON-Validierung + accentLight-Berechnung
- [x] Fehlerbehandlung (401, 429, 500, invalid JSON, timeout)

### Phase 3: generate.js (CLI)
- [x] Argument-Parsing (`description`, `--variants`, `--provider`)
- [x] `.env` laden (hand-parsed)
- [x] Gleicher Prompt-Builder wie server.js
- [x] API-Calls (ein Call pro Variante, sequentiell)
- [x] JSON-Validierung
- [x] Dateien in `pages/` schreiben (`slug-v1.json`, `slug-v2.json`, ...)
- [x] Überschreib-Warnung bei existierenden Dateien

### Phase 4: admin.html Generator-UI
- [x] Generator-Panel (Textarea, Provider-Dropdown, Varianten-Dropdown, Button)
- [x] `startGeneration()`: sequentielle Calls an `/api/generate`, Progress-Anzeige
- [x] Ergebnis-Buttons: Variante laden + JSON herunterladen
- [x] `loadVariant()`: Daten in Editor laden (mit Überschreib-Warnung)
- [x] `downloadVariant()`: JSON als Datei herunterladen
- [x] Generator-Panel ist zuklappbar (Akkordeon, wie Seiten-Einstellungen)
- [x] Fehleranzeige bei Generation-Fehlern

### Phase 5: Test Roundtrip
- [x] CLI: `node generate.js "Zahnarztpraxis Wien" --variants 3`
- [x] Generierte JSONs mit `node build.js` bauen
- [x] Gebaute Seiten im Browser prüfen
- [x] Browser: Generator-UI → Variante generieren → in Editor laden → Vorschau → JSON speichern
- [x] Backward Compatibility: bestehende Seiten bauen weiter korrekt

## Acceptance Criteria

### Funktional
- [x] CLI generiert N Varianten als JSON-Dateien in `pages/`
- [x] Browser-Generator zeigt Varianten als klickbare Buttons
- [x] Klick auf Variante lädt sie in den Editor
- [x] JSON-Download pro Variante möglich
- [x] Claude API und OpenAI API beide funktionsfähig
- [x] Generierte JSONs sind mit `node build.js` baubar
- [x] Generierte Seiten sehen vollständig aus (Hero, Nav, Sektionen, Footer)
- [x] Bestehende Seiten werden nicht beeinflusst

### Robustheit
- [x] API-Fehler (401, 429, 500) werden angezeigt, nicht verschluckt
- [x] Invalides JSON wird erkannt und gemeldet
- [x] Slug wird auto-sanitized (lowercase, nur a-z/0-9/-)
- [x] accentLight wird im Code berechnet (nicht von KI abhängig)
- [x] Überschreib-Warnung im Editor bei ungespeicherten Änderungen
- [x] Progress-Anzeige während Generierung ("Variante 2/3 wird generiert...")
- [x] Max 5 Varianten (UI-Limit)

### Sicherheit
- [x] API-Keys nur in `.env` (Server-seitig), nie im Browser
- [x] `.env` in `.gitignore`
- [x] Kein API-Key in localStorage oder im Netzwerk-Tab sichtbar

## References

### Brainstorm
- `docs/brainstorms/2026-03-17-ki-content-generator-brainstorm.md`

### Interne Referenzen
- JSON-Schema Referenz: `pages/autophagie-fasten.json`
- Import-Logik: `admin.html:1231-1266` (importJSON)
- lightenColor: `admin.html:543-573`
- Render-Defaults: `render.js:8-18`

### API-Dokumentation
- Claude Messages API: `https://docs.anthropic.com/en/docs/build-with-claude/tool-use`
- OpenAI Chat Completions: `https://platform.openai.com/docs/api-reference/chat`
- Claude tool_use für strukturiertes JSON Output
- OpenAI response_format: json_schema für Schema-enforced Output
