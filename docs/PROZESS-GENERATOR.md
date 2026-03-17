# Steph's Universe CMS -- KI-Content-Generator Prozess

**Stand:** 2026-03-17

---

## 1. Gesamtübersicht: Drei Modi

```
 MANUELL (ohne API-Key)
 ══════════════════════

 User ──> admin.html ──> buildBrowserPrompt() ──> Prompt kopieren
                                                       │
                                                       ▼
                                                  claude.ai
                                                  (manuell)
                                                       │
                                             JSON-Antwort kopieren
                                                       │
                                                       ▼
                              admin.html <── Textarea einfügen
                                   │
                            loadPastedJSON()
                                   │
                                   ▼
                              Editor (Seite bearbeiten)


 API / BROWSER (mit API-Key)
 ═══════════════════════════

 User ──> admin.html ──> fetch('/api/generate') ──> server.js
                                                       │
                                                  buildPrompt()
                                                       │
                                                       ▼
                                                  Claude / OpenAI API
                                                       │
                                                  validateAndFix()
                                                       │
                                                       ▼
                              admin.html <── JSON-Response
                                   │
                            loadVariant()
                                   │
                                   ▼
                              Editor (Seite bearbeiten)


 CLI (Batch-Generierung)
 ═══════════════════════

 User ──> node generate.js "Beschreibung" --variants 3
                    │
               buildPrompt() (pro Variante)
                    │
                    ▼
               Claude / OpenAI API
                    │
               validateAndFix()
                    │
                    ▼
               pages/slug-v1.json
               pages/slug-v2.json
               pages/slug-v3.json
```

---

## 2. Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATEIEN & MODULE                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  prompt.js  (Shared Modul, CommonJS)                         │   │
│  │                                                               │   │
│  │  ├── buildPrompt(description, variantIndex)                  │   │
│  │  │   → { system: "...", user: "..." }                        │   │
│  │  ├── validateAndFix(data)                                    │   │
│  │  │   → { errors: [...], data: {...} }                        │   │
│  │  ├── VARIANT_MATRIX  (5 Varianten)                           │   │
│  │  ├── JSON_SCHEMA     (Claude tool_use Schema)                │   │
│  │  ├── lightenHex(hex, amount)                                 │   │
│  │  └── extractJSON(raw)                                        │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                              │                                       │
│              ┌───────────────┼───────────────┐                       │
│              ▼                               ▼                       │
│  ┌──────────────────────┐       ┌──────────────────────┐            │
│  │  server.js            │       │  generate.js (CLI)   │            │
│  │                       │       │                       │            │
│  │  ├── HTTP-Server      │       │  ├── Args parsen     │            │
│  │  │   (localhost:3000) │       │  ├── .env laden       │            │
│  │  ├── Static Files     │       │  ├── callClaude()     │            │
│  │  │   (admin.html etc.)│       │  ├── callOpenAI()     │            │
│  │  ├── /api/generate    │       │  └── fs.writeFileSync │            │
│  │  │   (POST Endpoint)  │       │      → pages/*.json   │            │
│  │  ├── callClaude()     │       └──────────────────────┘            │
│  │  ├── callOpenAI()     │                                           │
│  │  └── httpsPost()      │       ┌──────────────────────┐            │
│  └──────────────────────┘       │  admin.html           │            │
│                                  │                       │            │
│              ┌──────────────────>│  ├── Generator-UI     │            │
│              │ served by         │  ├── buildBrowserPrompt()          │
│              │ server.js         │  ├── copyPrompt()     │            │
│              │                   │  ├── startGeneration()│            │
│                                  │  ├── loadPastedJSON() │            │
│                                  │  └── loadVariant()    │            │
│                                  └──────────────────────┘            │
│                                                                      │
│  ┌──────────────────────┐                                            │
│  │  .env                 │                                            │
│  │  CLAUDE_API_KEY=sk-.. │                                            │
│  │  OPENAI_API_KEY=sk-.. │                                            │
│  └──────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Modul-Abhängigkeiten:**

```
server.js ────> prompt.js  (require)
generate.js ──> prompt.js  (require)
admin.html ──── (eigenständig, eigene Prompt-Logik für manuellen Modus)
```

---

## 3. Varianten-Matrix

Jede Variante bekommt eine eigene Kombination aus Theme, Tonalität und Sektions-Fokus.
Bei weniger als 5 Varianten werden die ersten N verwendet.

| Variante | Theme      | Tonalität                  | Sektions-Fokus         | Akzentfarbe |
|----------|------------|----------------------------|------------------------|-------------|
| 1        | `dark`     | seriös und professionell   | Cards + Timeline       | `#10b981`   |
| 2        | `light`    | locker und freundlich      | Text-Absätze + Zitate  | `#0d9488`   |
| 3        | `colorful` | emotional und einladend    | Cards + Hinweise       | `#8b5cf6`   |
| 4        | `dark`     | technisch und detailliert  | Timeline + Text-Absätze| `#10b981`   |
| 5        | `light`    | kreativ und verspielt      | Cards + Zitate         | `#0d9488`   |

Definiert in `prompt.js` als `VARIANT_MATRIX[]` und `THEME_COLORS{}`.

---

## 4. Datenfluss: Manueller Modus

Für Nutzer ohne API-Key. Der Prompt wird kopiert und manuell in claude.ai eingefügt.

```
 admin.html                       claude.ai                   admin.html
 ──────────                       ─────────                   ──────────

 ① Beschreibung eintippen
 ② Variante wählen (1-5)
 ③ [Prompt kopieren] klicken
        │
        ▼
 buildBrowserPrompt(desc, idx)
        │
        ▼
 navigator.clipboard.writeText()
        │
        └──────────────────────> ④ Prompt einfügen
                                        │
                                        ▼
                                  KI generiert JSON
                                        │
                                 ⑤ JSON-Antwort kopieren
                                        │
        ┌───────────────────────────────┘
        ▼
 ⑥ JSON in Textarea einfügen
        │
        ▼
 [In Editor laden] klicken
        │
        ▼
 loadPastedJSON()
   ├── Markdown-Fences entfernen (```json ... ```)
   ├── JSON.parse()
   ├── Felder mit Defaults auffüllen
   ├── accentLight berechnen (lightenColor)
   └── loadSettingsToUI() + renderSections()
        │
        ▼
 Seite im Editor bearbeitbar
```

**Wichtig:** Im manuellen Modus nutzt `admin.html` eine eigene Prompt-Funktion
(`buildBrowserPrompt()`), da `prompt.js` ein Node-Modul ist und nicht direkt im
Browser verfügbar.

---

## 5. Datenfluss: API-Modus (Browser)

Für Nutzer mit API-Key. Server fungiert als Proxy zwischen Browser und KI-API.

```
 admin.html                server.js               Claude / OpenAI API
 ──────────                ─────────               ═══════════════════

 ① Beschreibung eingeben
 ② Provider wählen
 ③ Varianten-Anzahl wählen
 ④ [Generieren] klicken
        │
        │  Für jede Variante (sequentiell):
        │
        ▼
 fetch('/api/generate', {
   method: 'POST',
   body: { provider,
           description,
           variantIndex: i }
 })
        │
        └──────────────────> handleGenerate(body, res)
                                    │
                                    ▼
                             buildPrompt(description, variantIndex)
                             → { system: "...", user: "..." }
                                    │
                             ┌──────┴──────┐
                             ▼             ▼
                       provider           provider
                       === 'claude'       === 'openai'
                             │             │
                             ▼             ▼
                       callClaude()   callOpenAI()
                             │             │
                             └──────┬──────┘
                                    │
                                    └──────────────> httpsPost(url, headers, body)
                                                            │
                                                            ▼
                                                     API-Antwort empfangen
                                                            │
                                    ┌───────────────────────┘
                                    │
                                    ▼
                             ┌──────────────────────────────────────┐
                             │ CLAUDE: tool_use Response             │
                             │   response.content[]                  │
                             │     .find(b => b.type === 'tool_use')│
                             │     .input                           │
                             │   → bereits geparstes JSON-Objekt    │
                             │                                      │
                             │ OPENAI: json_object Response          │
                             │   response.choices[0]                │
                             │     .message.content                 │
                             │   → JSON.parse() nötig               │
                             └──────────────────────────────────────┘
                                    │
                                    ▼
                             validateAndFix(raw)
                                    │
                                    ▼
                             res.end(JSON.stringify(data))
                                    │
        ┌───────────────────────────┘
        ▼
 Variante empfangen
 → Ergebnis-Button anzeigen
 → Nächste Variante starten (Loop)
        │
        ▼
 Alle Varianten fertig
 → Klick auf Button: loadVariant(idx)
   → Daten in Editor laden
 → Klick auf Download: downloadVariant(idx)
   → JSON als Datei herunterladen
```

---

## 6. Datenfluss: CLI-Modus

Standalone-Tool ohne Browser. Direkte API-Calls und Datei-Speicherung.

```
 Terminal
 ════════

 $ node generate.js "Zahnarztpraxis Wien" --variants 3 --provider claude
        │
        ▼
 ① Args parsen
    description = "Zahnarztpraxis Wien"
    variants    = 3
    provider    = "claude"
        │
        ▼
 ② loadEnv()
    .env → process.env.CLAUDE_API_KEY
    .env → process.env.OPENAI_API_KEY
        │
        ▼
 ③ Für jede Variante i = 0..2:
    │
    ├── buildPrompt(description, i)
    │   → { system: "...Theme: dark...", user: "...Zahnarztpraxis Wien..." }
    │
    ├── callClaude(prompt)  oder  callOpenAI(prompt)
    │   └── httpsPost() → API-Response → JSON extrahieren
    │
    ├── validateAndFix(raw)
    │   └── Slug sanitizen, Defaults setzen, accentLight berechnen
    │
    └── fs.writeFileSync(
          'pages/zahnarztpraxis-wien-v' + (i+1) + '.json',
          JSON.stringify(data, null, 2)
        )
        │
        ▼
 ④ Ausgabe:

    -> pages/zahnarztpraxis-wien-v1.json (dark/seriös)
    -> pages/zahnarztpraxis-wien-v2.json (light/locker)
    -> pages/zahnarztpraxis-wien-v3.json (colorful/emotional)

    Fertig! Nächster Schritt: node build.js
```

---

## 7. Prompt-Aufbau

Der Prompt an die KI besteht aus zwei Teilen: `system` und `user`.

### System-Prompt (Regeln + Schema)

```
┌──────────────────────────────────────────────────────────────────┐
│  SYSTEM-PROMPT                                                    │
│                                                                   │
│  1. Rolle                                                        │
│     "Du bist ein Webdesign-Content-Generator.                    │
│      Du erstellst vollständige JSON-Dateien für ein CMS."        │
│                                                                   │
│  2. Regeln                                                       │
│     ├── NUR valides JSON, kein Markdown                          │
│     ├── Exaktes Schema verwenden                                 │
│     ├── 4-6 Sektionen erstellen                                  │
│     ├── Theme: "dark" | "light" | "colorful"                     │
│     ├── Schreibstil: z.B. "seriös und professionell"             │
│     ├── Sektions-Fokus: z.B. "Cards + Timeline"                 │
│     ├── Sprache aus Beschreibung erkennen                        │
│     ├── Card-Icons: Emojis verwenden                             │
│     ├── section.id: lowercase, a-z/0-9/-                         │
│     ├── heroTitle: darf <br> enthalten                           │
│     ├── paragraphs: dürfen <strong>, <em>, <a> enthalten         │
│     ├── footerText: HTML-Entities (&copy; etc.)                  │
│     ├── heroBg: leer lassen                                      │
│     └── Keine Videos generieren                                  │
│                                                                   │
│  3. JSON-Schema                                                  │
│     { slug, title, accentColor, theme, heroBg, heroBadge,       │
│       heroTitle, heroSubtitle, ctaText, footerText,              │
│       sections: [{ id, navLabel, label, title,                   │
│         paragraphs, cards, timeline, quote, warning }] }         │
│                                                                   │
│     "Nur Blöcke einfügen die Sinn ergeben.                      │
│      Leere Arrays/Objekte weglassen."                            │
└──────────────────────────────────────────────────────────────────┘
```

### User-Prompt (Beschreibung + Varianten-Parameter)

```
┌──────────────────────────────────────────────────────────────────┐
│  USER-PROMPT                                                      │
│                                                                   │
│  "Erstelle eine komplette Homepage für:                          │
│                                                                   │
│   [User-Beschreibung]                                            │
│                                                                   │
│   Theme: dark                                                    │
│   Akzentfarbe: #10b981"                                          │
└──────────────────────────────────────────────────────────────────┘
```

### Claude: tool_use erzwingt JSON-Output

Bei Claude wird zusätzlich ein Tool `generate_page` mit dem `JSON_SCHEMA` definiert
und `tool_choice: { type: 'tool', name: 'generate_page' }` gesetzt. Das zwingt Claude,
die Antwort als strukturiertes JSON-Objekt im `tool_use`-Block zurückzugeben.

### OpenAI: response_format erzwingt JSON-Output

Bei OpenAI wird `response_format: { type: 'json_object' }` gesetzt. Das zwingt GPT-4o,
die Antwort als valides JSON zurückzugeben.

---

## 8. JSON-Validierung (validateAndFix)

Die Funktion `validateAndFix(data)` in `prompt.js` prüft und korrigiert das KI-Output.

```
 KI-Output (raw JSON)
        │
        ▼
 ┌──────────────────────────────────────────────────────────────┐
 │  validateAndFix(data)                                        │
 │                                                              │
 │  PRÜFUNGEN (Fehler sammeln):                                │
 │  ├── data ist ein Objekt?                                   │
 │  ├── slug vorhanden?                                        │
 │  ├── title vorhanden?                                       │
 │  └── sections vorhanden und Array?                          │
 │                                                              │
 │  KORREKTUREN (automatisch):                                 │
 │  ├── theme ungültig? → Fallback: 'dark'                    │
 │  ├── accentColor ungültig (#hex)? → Fallback: '#10b981'    │
 │  ├── slug sanitizen: lowercase, nur a-z/0-9/-              │
 │  │   .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')     │
 │  ├── heroBg leer? → '' (Default)                           │
 │  ├── ctaText leer? → 'Mehr erfahren'                       │
 │  ├── footerText leer? → '&copy; 2026'                      │
 │  ├── accentLight berechnen via lightenHex(accentColor, 40) │
 │  ├── Icon-Defaults setzen:                                  │
 │  │   iconUrl='assets/icon.png', iconSize='46',             │
 │  │   cardIconSize='40', iconLink=''                         │
 │  ├── lang setzen: → 'de' (Default)                         │
 │  │                                                          │
 │  SEKTIONEN:                                                 │
 │  ├── id fehlt? → Fehler melden                             │
 │  ├── navLabel fehlt? → Fehler melden                       │
 │  ├── section.id sanitizen (lowercase, a-z/0-9/-)           │
 │  └── Leere optionale Blöcke entfernen:                     │
 │      cards=[] → delete, timeline=[] → delete,              │
 │      paragraphs=[] → delete, videos=[] → delete,           │
 │      quote ohne .text → delete, warning ohne .text → delete│
 └──────────────────────────────────────────────────────────────┘
        │
        ▼
 Return: { errors: [...], data: { ... } }

 → errors.length > 0 && data === null  → Generation fehlgeschlagen
 → errors.length > 0 && data !== null  → Warnungen, aber nutzbar
 → errors.length === 0                 → Alles OK
```

---

## 9. Sicherheit

```
┌──────────────────────────────────────────────────────────────────┐
│  API-KEY MANAGEMENT                                               │
│                                                                   │
│  .env (Server-seitig)                                            │
│  ├── CLAUDE_API_KEY=sk-ant-...                                   │
│  └── OPENAI_API_KEY=sk-...                                       │
│                                                                   │
│  REGELN:                                                         │
│  ├── .env in .gitignore → nie im Repository                     │
│  ├── .env.example als Vorlage (leere Keys)                      │
│  ├── Keys nur in server.js und generate.js gelesen              │
│  ├── Browser sendet NUR {provider, description, variantIndex}   │
│  │   → kein API-Key im Request, kein Key in localStorage        │
│  ├── server.js liest Keys aus process.env                       │
│  └── Kein Key im Netzwerk-Tab des Browsers sichtbar            │
│                                                                   │
│  ARCHITEKTUR:                                                    │
│                                                                   │
│  Browser ──POST──> server.js ──HTTPS──> Claude/OpenAI           │
│  (kein Key)        (Key aus .env)        (Key im Header)        │
└──────────────────────────────────────────────────────────────────┘
```

| Kontext | API-Key Quelle | Wie geladen |
|---------|----------------|-------------|
| CLI (`generate.js`) | `.env` Datei | Hand-parsed (`loadEnv()`) |
| Browser (`admin.html`) | Nie im Browser | Server-Proxy via `/api/generate` |
| Server (`server.js`) | `.env` Datei | Hand-parsed (`loadEnv()`) bei Start |

---

## 10. Dateistruktur

```
 experiment-011/
 ├── .env                ← API-Keys (gitignored)
 ├── .env.example        ← Vorlage mit leeren Keys
 ├── .gitignore          ← .env, node_modules, .claude
 │
 ├── prompt.js           ← SHARED: Prompt-Builder, Validierung, Varianten-Matrix
 │                          Exports: buildPrompt, validateAndFix, VARIANT_MATRIX,
 │                                   JSON_SCHEMA, lightenHex, extractJSON
 │
 ├── server.js           ← Combined Server (HTTP + API-Proxy)
 │                          - Statische Dateien auf localhost:3000
 │                          - POST /api/generate → Claude/OpenAI Proxy
 │                          - .env laden, httpsPost(), callClaude(), callOpenAI()
 │
 ├── generate.js         ← CLI-Tool für Batch-Generierung
 │                          - Args parsen, .env laden
 │                          - Pro Variante: buildPrompt → API-Call → Datei schreiben
 │                          - Ausgabe in pages/slug-vN.json
 │
 ├── admin.html          ← Browser-UI (Generator-Panel + Editor)
 │                          - Generator-UI: Textarea, Provider, Varianten, Modi
 │                          - Manuell: buildBrowserPrompt() + clipboard + loadPastedJSON()
 │                          - API: fetch('/api/generate') + loadVariant()
 │
 └── pages/              ← Generierte JSON-Dateien
     ├── slug-v1.json
     ├── slug-v2.json
     └── slug-v3.json
```

| Datei | Verantwortlichkeit |
|---|---|
| `prompt.js` | Prompt-Logik, JSON-Schema, Varianten-Matrix, Validierung, Farb-Berechnung |
| `server.js` | HTTP-Server, statische Dateien, API-Proxy (Claude + OpenAI), CORS |
| `generate.js` | CLI-Interface, Args-Parsing, Batch-Generierung, Datei-Speicherung |
| `admin.html` | Generator-UI, manueller Modus (Prompt kopieren), API-Modus (fetch), Editor-Integration |
| `.env` | API-Keys: `CLAUDE_API_KEY`, `OPENAI_API_KEY` |
| `.env.example` | Vorlage mit leeren Keys zur Dokumentation |

---

## 11. API-Parameter

| Parameter | Claude | OpenAI |
|---|---|---|
| Modell | `claude-sonnet-4-20250514` | `gpt-4o` |
| Max Tokens | `4096` | `4096` |
| Timeout | `60s` | `60s` |
| JSON-Erzwingung | `tool_use` + `tool_choice` | `response_format: json_object` |
| Auth-Header | `x-api-key: sk-ant-...` | `Authorization: Bearer sk-...` |
| API-URL | `api.anthropic.com/v1/messages` | `api.openai.com/v1/chat/completions` |
| Kosten pro Variante | ~$0.01-0.05 | ~$0.01-0.05 |

---

## 12. Datenfluss: Remix-Modus

Ermöglicht das Kombinieren der besten Sektionen aus verschiedenen generierten Varianten.

```
 admin.html                                    claude.ai
 ──────────                                    ─────────

 ① Mehrere Varianten generieren & laden
        │
        ▼
 window._generatedVariants (Array)
        │
        ▼
 showRemixUI()
   ├── Hero-Radios rendern (eine Variante als Basis wählen)
   └── Sektions-Checkboxen rendern (pro Variante)
       └── getSectionType(s) erkennt Block-Typen
           (Cards, Timeline, Text, etc.)
        │
        ▼
 ② User wählt Hero + Sektionen aus verschiedenen Varianten
 ③ Optional: Zusätzliche Anweisung eingeben
        │
        ▼
 buildRemixPrompt()
   ├── Hero-JSON (ohne Sections) aus gewählter Variante
   ├── Ausgewählte Sektionen zusammenstellen
   └── Instruction-Text anhängen
        │
        ▼
 copyRemixPrompt()
   ├── navigator.clipboard.writeText()
   └── Tokens zum Session-Counter addieren
        │
        └──────────────────────────> ④ Remix-Prompt einfügen
                                            │
                                            ▼
                                      KI generiert JSON
                                            │
                                     ⑤ JSON-Antwort kopieren
                                            │
        ┌───────────────────────────────────┘
        ▼
 loadPastedJSON() (behandelt einzelnes Objekt)
        │
        ▼
 Remixte Seite im Editor bearbeitbar
```

---

## 13. Token-Schätzung

Dynamische Schätzung der Token-Kosten für Generator und Remix.

```
┌──────────────────────────────────────────────────────────────────┐
│  TOKEN-SCHÄTZUNG                                                  │
│                                                                   │
│  Basis-Formel:                                                   │
│  ├── estimateTokens: text.length / 4                             │
│  │   (grobe Annäherung für deutschen Text)                       │
│                                                                   │
│  Generator:                                                      │
│  ├── count * 3500 Tokens pro Variante                            │
│                                                                   │
│  Remix:                                                          │
│  ├── JSON.stringify(selectedSections).length / 4                 │
│  │   + 500 Overhead                                              │
│  │   + 2000 Response                                             │
│                                                                   │
│  Session-Counter:                                                │
│  ├── _totalTokensEstimated (globale Variable)                    │
│  ├── Inkrementiert bei:                                          │
│  │   ├── copyPrompt()                                            │
│  │   ├── copyRemixPrompt()                                       │
│  │   └── startGeneration()                                       │
│                                                                   │
│  Anzeige:                                                        │
│  ├── fmtTokensStr()                                              │
│  │   ├── Rundet auf 100                                          │
│  │   └── Formatiert mit toLocaleString('de-DE')                  │
│  │       (z.B. 12.000 statt 12000)                               │
└──────────────────────────────────────────────────────────────────┘
```
