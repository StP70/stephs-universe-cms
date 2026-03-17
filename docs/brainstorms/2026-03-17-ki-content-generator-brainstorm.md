# KI-Content-Generator für Homepage-Erstellung

**Datum:** 2026-03-17
**Status:** Brainstorm abgeschlossen
**Nächster Schritt:** `/workflows:plan`

---

## Was wir bauen

Ein KI-gestützter Content-Generator, der aus einer Freitext-Beschreibung fertige CMS-JSON-Dateien produziert. Mehrere Varianten gleichzeitig generierbar, damit Stephan Kunden verschiedene Entwürfe zeigen kann.

**Kernfunktionen:**
1. **Freitext-Input** -- Kurzer Satz oder detaillierte Stichpunkte, die KI macht das Beste daraus
2. **Varianten-Generierung** -- Anzahl wählbar (z.B. 3 Varianten), jede unterscheidet sich in Theme, Tonality und Struktur
3. **Komplettes JSON** -- Hero, Footer, alle Sektionen, Theme, Farben, Emojis -- sofort baubar
4. **Zwei Frontends** -- Browser (im Admin-Panel) + CLI (`node generate.js`)
5. **Zwei KI-Provider** -- Claude API und OpenAI API, konfigurierbar

## Warum dieser Ansatz

- **Browser + CLI:** Admin-Panel für Komfort (Idee eintippen → Varianten klicken → weiterbearbeiten), CLI für Batch-Generierung und Automatisierung.
- **Shared Prompt-Logik:** Prompt-Bau und JSON-Schema sind identisch für Browser und CLI. Der API-Call selbst ist plattformspezifisch (Browser: `fetch()`, Node: `https`), daher kein UMD-Modul sondern getrennte Implementierungen mit gemeinsamer Prompt-Definition.
- **Zwei Provider:** Claude und OpenAI haben unterschiedliche Stärken. Flexibilität ohne großen Mehraufwand (gleicher Prompt, nur der API-Endpoint/Format unterscheidet sich).
- **Varianten mit maximaler Vielfalt:** Jede Variante bekommt ein anderes Theme + Schreibstil + Sektionsstruktur. Der Kunde sieht echte Alternativen, nicht nur Textumformulierungen.

## Key Decisions

| Entscheidung | Wahl | Begründung |
|---|---|---|
| KI-Provider | Claude API + OpenAI API | Flexibilität, beide haben gute JSON-Generierung |
| Laufzeitumgebung | Browser (admin.html) + CLI (Node.js) | Komfort + Power-User |
| Shared Prompt | Gleicher Prompt-String + JSON-Schema | API-Calls plattformspezifisch (fetch vs. https) |
| Input-Format | Freitext (kurz oder detailliert) | Maximale Flexibilität, KI interpretiert |
| Generierungs-Scope | Komplettes JSON (Hero, Sektionen, Theme, Farben, Icons) | Stephan bekommt fertige Seiten, nicht nur Text |
| Varianten-Strategie | Theme + Tonality + Struktur kombiniert | Maximale Vielfalt für Kundenauswahl |
| API-Key-Speicherung | `.env` (CLI) + localStorage (Browser) | Single-User-Tool, kein Server nötig |

## Generator-Architektur

```
 INPUT                    GENERATOR                    OUTPUT
 ─────                    ─────────                    ──────

 "Zahnarztpraxis          generate.js                  pages/zahnarzt-v1.json
  in Wien,                ├── buildPrompt()            pages/zahnarzt-v2.json
  modern,                 ├── callAPI(provider)        pages/zahnarzt-v3.json
  Services:               └── parseResponse()
  Implantate,                                          ↓
  Prophylaxe"                                     node build.js
                                                       ↓
  Varianten: 3                                    dist/zahnarzt-v1/
  Provider: claude                                dist/zahnarzt-v2/
                                                  dist/zahnarzt-v3/
```

## Prompt-Strategie

Der Prompt an die KI enthält:
1. **System-Rolle:** "Du bist ein Webdesign-Content-Generator"
2. **JSON-Schema:** Exakte Beschreibung aller Felder und Sektionstypen
3. **Beispiel-JSON:** Eine existierende Seite als Referenz (z.B. gekürzte autophagie-fasten.json)
4. **Varianten-Anweisung:** "Erstelle Variante X mit Theme Y, Schreibstil Z, Fokus auf Sektionstyp W"
5. **User-Input:** Die Freitext-Beschreibung

Die Varianten werden durch unterschiedliche Anweisungen im Prompt differenziert:
- **Variante 1:** Dark Theme, seriöser Ton, Fokus auf Cards + Timeline
- **Variante 2:** Light Theme, lockerer Ton, Fokus auf Text + Zitate
- **Variante 3:** Colorful Theme, emotionaler Ton, Fokus auf Cards + Warnungen

## Browser-UI (Admin-Panel)

```
┌──────────────────────────────────────────┐
│  STEPH'S UNIVERSE CMS                    │
│  [JSON laden] [Speichern] [Vorschau]     │
├──────────────────────────────────────────┤
│                                          │
│  🤖 KI-GENERATOR                        │
│  ┌────────────────────────────────────┐  │
│  │ Beschreibe deine Homepage:         │  │
│  │ [                                  │  │
│  │  Zahnarztpraxis in Wien,           │  │
│  │  modern, vertrauenswürdig,         │  │
│  │  Services: Implantate, Prophylaxe  │  │
│  │ ]                                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Provider: [Claude ▼]  Varianten: [3]    │
│  [Generieren 🚀]                         │
│                                          │
│  ── Ergebnis ──                          │
│  [V1: Dark / Seriös]                     │
│  [V2: Light / Locker]                    │
│  [V3: Colorful / Emotional]              │
│  → Klick lädt Variante in Editor         │
│  → [JSON herunterladen] pro Variante     │
│                                          │
│  ── SEITEN-EINSTELLUNGEN ──              │
│  (bestehender Editor darunter)           │
└──────────────────────────────────────────┘
```

## CLI-Interface

```bash
# Grundnutzung
node generate.js "Zahnarztpraxis Wien" --variants 3

# Mit Provider-Wahl
node generate.js "Fitness-Studio München" --variants 2 --provider openai

# Detaillierte Beschreibung
node generate.js "Yoga-Studio in Salzburg. Kurse: Hatha, Vinyasa, Yin. \
  Lehrerin: Maria, 15 Jahre Erfahrung. Zielgruppe: Anfänger bis Fortgeschrittene." \
  --variants 3 --provider claude

# Ausgabe
  KI-Content-Generator

  Provider: Claude API
  Varianten: 3

  -> pages/zahnarztpraxis-wien-v1.json (Dark / Seriös)
  -> pages/zahnarztpraxis-wien-v2.json (Light / Locker)
  -> pages/zahnarztpraxis-wien-v3.json (Colorful / Emotional)

  Fertig! Öffne admin.html oder `node build.js`
```

## API-Key Management

| Kontext | Speicherort | Wie gesetzt |
|---|---|---|
| CLI | `.env` Datei | `CLAUDE_API_KEY=sk-...` und/oder `OPENAI_API_KEY=sk-...` |
| Browser | localStorage | Einmalig im Generator-UI eingeben, wird gespeichert |

`.env` wird in `.gitignore` eingetragen (falls nicht schon vorhanden).

## Dateien (voraussichtlich)

| Datei | Zweck |
|---|---|
| `generate.js` | CLI-Tool: Prompt-Bau, API-Call (Node https), JSON-Parsing, Datei-Speicherung |
| `admin.html` | Neuer Generator-Bereich im Editor (eigener API-Call via fetch) |
| `.env` | API-Keys (gitignored) |
| `.env.example` | Vorlage mit leeren Keys |

## Wichtige Hinweise

- **API-Kosten:** Jede Variante = 1 API-Call. Bei Claude: ~$0.01-0.05 pro Seite. 3 Varianten ≈ $0.03-0.15.
- **JSON-Validierung:** Die KI könnte invalides JSON liefern. Antwort muss geparsed und validiert werden (slug + title + sections vorhanden?). Bei Fehler: Retry oder Fehlermeldung.
- **Sprache:** Wird automatisch aus dem Input erkannt. Deutsche Beschreibung → deutsche Seite. Englische → englische.

## Nicht im Scope (YAGNI)

- ~~Bild-Generierung~~ → KI generiert nur Text, Bilder werden manuell hinzugefügt oder per Unsplash-URL
- ~~Automatisches Deployment~~ → Generierte JSONs müssen manuell gebaut/gepusht werden
- ~~Streaming-Output~~ → Komplett generieren, dann anzeigen (einfacher)
- ~~Chat-Interface~~ → Kein Hin-und-Her mit der KI, ein Shot reicht
- ~~Eigener Server~~ → Alles lokal (Browser fetch / Node https)

## Open Questions

*Keine -- alle Fragen wurden in der Brainstorm-Phase geklärt.*
