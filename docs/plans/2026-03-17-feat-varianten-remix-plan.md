---
title: "feat: Varianten-Remix + Token-Kosten-Anzeige"
type: feat
date: 2026-03-17
---

# Varianten-Remix + Token-Kosten-Anzeige

## Overview

Zwei zusammenhängende Features für den KI-Generator:
1. **Varianten-Remix:** Sektionen aus verschiedenen generierten Varianten ankreuzen und per KI zu einer neuen Homepage kombinieren
2. **Token-Kosten-Anzeige:** Dynamische Schätzung der Token-Kosten bei jeder Aktion + Gesamtverbrauch der Session

## Proposed Solution

### 1. Varianten-Remix

Erscheint automatisch im KI-Generator-Panel wenn ≥2 Varianten in `window._generatedVariants` vorhanden sind.

**UI:**
- **Hero-Auswahl:** Radio-Buttons (1 pro Variante) -- bestimmt Theme, Farbe, Hero-Texte
- **Sektions-Auswahl:** Checkboxen, gruppiert nach Variante, mit Typ-Label (Cards, Timeline, Text, etc.)
- **Zusätzliche Anweisung:** Optionales Textarea
- **Buttons:** [Remix-Prompt kopieren] + [Claude.ai öffnen]
- **Ergebnis:** Gleicher Paste-Flow (JSON einfügen → Editor laden)

**Sektionstyp-Erkennung:**
```javascript
function getSectionType(s) {
  var types = [];
  if (s.cards && s.cards.length) types.push('Cards');
  if (s.timeline && s.timeline.length) types.push('Timeline');
  if (s.paragraphs && s.paragraphs.length) types.push('Text');
  if (s.quote) types.push('Zitat');
  if (s.warning) types.push('Hinweis');
  if (s.videos && s.videos.length) types.push('Videos');
  return types.join(' + ') || 'Leer';
}
```

**Remix-Prompt-Aufbau:**
```
Du bist ein Webdesign-Content-Generator.
Kombiniere die folgenden Homepage-Teile zu einer neuen, konsistenten Homepage.
Übernimm die Sektionen möglichst 1:1. Passe nur IDs, NavLabels und minimale
Übergänge an. Schreibe die Inhalte NICHT um.
Antworte NUR mit validem JSON.

HERO & DESIGN (von Variante X):
{...toplevel JSON...}

SEKTIONEN (aus verschiedenen Varianten):
[{...section1...}, {...section2...}, ...]

ZUSÄTZLICHE ANWEISUNG:
[Freitext wenn vorhanden]
```

### 2. Token-Kosten-Anzeige

**Drei Anzeige-Bereiche:**

```
 ┌─────────────────────────────────────────────┐
 │  KI-Generator                                │
 │  ...                                         │
 │  ☑ V1  ☑ V2  ☑ V3  ☐ V4  ☐ V5             │
 │  Geschätzt: ~12.000 Tokens                   │  ← dynamisch bei Checkbox-Change
 │  ...                                         │
 │  ── REMIX ──                                 │
 │  ○ Hero V1  ☑ V1:Services  ☑ V3:Team       │
 │  Remix geschätzt: ~8.500 Tokens              │  ← dynamisch bei Checkbox-Change
 │  ...                                         │
 │  Bisheriger Verbrauch: ~24.000 Tokens        │  ← Session-Gesamtzähler
 └─────────────────────────────────────────────┘
```

**Token-Schätzung:**
```javascript
// Grobe Faustregel: 1 Token ≈ 4 Zeichen (Deutsch)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Formatierung mit 1.000er-Punkt
function formatTokens(n) {
  return n.toLocaleString('de-DE');
}
// Beispiel: formatTokens(12000) → "12.000"
```

**Generator-Schätzung (bei Varianten-Checkboxen):**
- Pro Variante: ~1.500 Tokens Prompt + ~2.000 Tokens Antwort = ~3.500 Tokens
- Anzeige: `Geschätzt: ~${formatTokens(count * 3500)} Tokens`
- Aktualisiert sich bei jeder Checkbox-Änderung

**Remix-Schätzung (bei Sektions-Checkboxen):**
- Berechnet aus: `estimateTokens(JSON.stringify(selectedSections))` + ~500 Tokens Prompt-Overhead + ~2.000 Tokens Antwort
- Aktualisiert sich bei jeder Checkbox-Änderung

**Session-Gesamtzähler:**
- `window._totalTokensEstimated = 0`
- Nach jedem Prompt-kopieren: `+= estimateTokens(prompt) + 2000` (geschätzte Antwort)
- Im API-Modus: Exakte Werte aus `response.usage` wenn verfügbar
- Anzeige am unteren Rand des Generator-Panels

## Technical Approach

### Änderungen nur in admin.html

Kein neues File nötig. Alles in admin.html:

#### Phase 1: Token-Schätzung + Formatierung (~20 Zeilen JS)

```javascript
var _totalTokensEstimated = 0;

function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}

function formatTokens(n) {
  return Math.round(n / 100) * 100; // auf 100er runden
  // dann formatieren
}

function updateGeneratorTokenEstimate() {
  var count = getSelectedVariants().length;
  var est = count * 3500;
  document.getElementById('genTokenEst').textContent =
    count > 0 ? 'Geschätzt: ~' + formatTokens(est).toLocaleString('de-DE') + ' Tokens' : '';
}
```

Event-Listener auf alle `.genVariantCb` Checkboxen → `updateGeneratorTokenEstimate()`.

#### Phase 2: Remix-UI (~60 Zeilen HTML+JS)

Neuer `<div id="genRemix">` nach `genResults`, initial `display:none`.

Wird sichtbar gemacht wenn `window._generatedVariants.length >= 2` (in `loadPastedJSON` und `startGeneration` nach Erfolg).

**`renderRemixUI()`:** Baut Hero-Radios + Sektions-Checkboxen aus `_generatedVariants`.

**`buildRemixPrompt()`:** Sammelt gewählten Hero + Sektionen, baut Prompt.

**`copyRemixPrompt()`:** Kopiert in Clipboard, zeigt Paste-Bereich.

#### Phase 3: Session-Zähler (~10 Zeilen)

`_totalTokensEstimated` wird erhöht bei:
- `copyPrompt()`: `+= estimateTokens(prompt) + 2000`
- `copyRemixPrompt()`: `+= estimateTokens(prompt) + 2000`
- `startGeneration()` (API): `+= estimateTokens(prompt) + 2000` pro Variante

Anzeige: `<div id="genTotalTokens">` am unteren Rand des Panels.

## Acceptance Criteria

### Remix
- [ ] Remix-Bereich erscheint wenn ≥2 Varianten vorhanden
- [ ] Hero-Auswahl per Radio (Theme + Farbe + Hero-Texte)
- [ ] Sektions-Auswahl per Checkboxen mit Typ-Label (Cards, Timeline, etc.)
- [ ] Optionales Freitext-Feld für Zusatzanweisungen
- [ ] [Remix-Prompt kopieren] baut korrekten Prompt mit JSON
- [ ] [Claude.ai öffnen] Button vorhanden
- [ ] JSON-Antwort einfügen funktioniert (gleicher Paste-Flow)
- [ ] Remix-Bereich verschwindet bei Seiten-Reload (Varianten weg)

### Token-Kosten
- [ ] Generator: Dynamische Schätzung bei Checkbox-Änderung
- [ ] Remix: Dynamische Schätzung bei Checkbox-Änderung
- [ ] 1.000er-Interpunktion (Punkt als Tausendertrenner): `12.000` statt `12000`
- [ ] Session-Gesamtzähler: Kumulierter Verbrauch aller bisherigen Aktionen
- [ ] Zähler wird bei Prompt-Kopieren und API-Generierung erhöht

## Implementation Phases

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
Token-       Remix-UI    Session-    Test +
Schätzung    + Prompt    Zähler     Commit
(~20 LOC)    (~80 LOC)   (~10 LOC)
```

## References

- Brainstorm: `docs/brainstorms/2026-03-17-varianten-remix-brainstorm.md`
- Generator-UI: `admin.html:277-330` (KI-Generator Panel)
- Varianten-Daten: `window._generatedVariants` (JS Array)
- Bestehender Paste-Flow: `loadPastedJSON()` in admin.html
