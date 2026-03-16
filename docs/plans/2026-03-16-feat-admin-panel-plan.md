---
title: "feat: Admin-Panel für Steph's Universe CMS"
type: feat
date: 2026-03-16
---

# ✨ feat: Admin-Panel für Steph's Universe CMS

## Overview

Ein visuelles Admin-Panel (`admin.html`) als einzelne HTML-Datei, mit dem Stephan Informationsseiten erstellen und bearbeiten kann – ohne JSON manuell zu schreiben. Dark-Mode UI, Akkordeon-Sektionen, JSON Import/Export, Preview in neuem Tab, 3 Design-Themes (Dark/Light/Colorful).

## Proposed Solution

Eine einzige `admin.html` Datei mit eingebettetem CSS und JavaScript. Kein Server, kein Build-Tool. Die Datei enthält:
- Formular-basierter Editor für alle JSON-Felder
- Eingebettete Kopie der `render()` Template-Engine aus `build.js`
- Eingebettetes `template.html` als String-Konstante für Preview-Generierung
- JSON Download/Upload für Datei-I/O

## Technical Approach

### Architektur

```
admin.html (Single File)
├── <style>         → Dark-Mode UI für den Editor selbst
├── <div id="app">  → Formular-basierter Editor
│   ├── Header      → [JSON laden] [JSON speichern] [Vorschau ▶]
│   ├── Settings    → Slug, Titel, Theme, Sprache, Farben, Hero, Footer
│   └── Sections    → Akkordeon mit Sektionen
│       └── Section → Basis-Felder + optionale Inhaltsblöcke
└── <script>
    ├── State       → Zentrales JS-Objekt (pageData) das die JSON repräsentiert
    ├── UI Logic    → Akkordeon, Add/Remove/Sort Sektionen & Items
    ├── I/O         → JSON Import (FileReader) / Export (Blob download)
    ├── Template    → Eingebettetes template.html als String
    ├── Render      → Kopie der render() Funktion aus build.js
    └── Preview     → Generiert HTML, öffnet als blob: URL
```

### Datenfluss

```
User-Eingabe → pageData (JS-Objekt) → JSON Export / Preview-Rendering
JSON Import  → pageData (JS-Objekt) → UI-Felder befüllen
```

### Implementation Phases

#### Phase 1: Grundgerüst & Seiten-Einstellungen

**Ziel:** Editor-Skeleton mit Header und Seiten-Einstellungen.

**Tasks:**
- [ ] `admin.html` anlegen mit Dark-Mode CSS (gleiche Variablen wie CMS-Output)
- [ ] Header-Leiste: Titel "Steph's Universe CMS" + 3 Buttons (JSON laden, JSON speichern, Vorschau)
- [ ] Seiten-Einstellungen Formular mit allen Toplevel-Feldern:

```
Felder: slug, title, theme (Dropdown: dark/light/colorful),
        lang (Input: de/en/...), accentColor (color picker),
        accentLight (color picker), iconUrl, iconLink,
        heroBg, heroBadge, heroTitle, heroSubtitle,
        ctaText, footerText
```

- [ ] `pageData` JS-Objekt initialisieren mit Default-Werten
- [ ] Zwei-Wege-Binding: Formulareingabe → `pageData`, und `pageData` → Formular (für Import)

**Dateien:**
- `admin.html` – Zeile 1-~200 (HTML Struktur + CSS)

#### Phase 2: Sektions-Management

**Ziel:** Sektionen hinzufügen, entfernen, sortieren, Akkordeon.

**Tasks:**
- [ ] Akkordeon-Container für Sektionen
- [ ] Funktion `addSection()` – Fügt leere Sektion mit allen Feldern hinzu
- [ ] Funktion `removeSection(index)` – Löscht Sektion (mit Bestätigung)
- [ ] Funktionen `moveSectionUp(index)` / `moveSectionDown(index)` – Sortierung
- [ ] Akkordeon Toggle: Klick auf Header klappt Inhalt auf/zu
- [ ] Sektions-Header zeigt: `▼ {navLabel} [{label}]  [↑][↓][🗑]`
- [ ] Basis-Felder pro Sektion: `id`, `navLabel`, `label`, `title`, `image`

**Dateien:**
- `admin.html` – Sektionen-Bereich im HTML + `addSection()`, `removeSection()`, `moveSection()` im Script

#### Phase 3: Inhaltsblöcke

**Ziel:** Alle 7 Inhaltsblock-Typen editierbar machen.

**Tasks:**

Absätze (paragraphs):
- [ ] Dynamische Liste von Textareas
- [ ] [+ Absatz] Button fügt neues Textarea hinzu
- [ ] [🗑] Button pro Absatz zum Löschen

Zitat (quote):
- [ ] Zwei Inputs: `quote.text` (textarea) und `quote.cite` (input)
- [ ] Felder nur sichtbar wenn befüllt oder explizit hinzugefügt

Cards:
- [ ] Dynamische Liste von Card-Einträgen
- [ ] Pro Card: Icon (text input), Titel (input), Text (textarea), [🗑]
- [ ] [+ Karte] Button

Timeline:
- [ ] Dynamische Liste von Timeline-Einträgen
- [ ] Pro Eintrag: Zeitpunkt (input), Beschreibung (textarea), [🗑]
- [ ] [+ Zeitpunkt] Button

Videos:
- [ ] Dynamische Liste von Video-Einträgen
- [ ] Pro Video: URL, Thumbnail-URL, Titel, Beschreibung, Badge, Badge-Typ (Dropdown: youtube/arte/custom), [🗑]
- [ ] [+ Video] Button
- [ ] Auto-Thumbnail: Wenn YouTube-URL eingegeben wird, automatisch `https://img.youtube.com/vi/{ID}/hqdefault.jpg` setzen

Warning:
- [ ] Zwei Inputs: `warning.title` (input) und `warning.text` (textarea)

**Dateien:**
- `admin.html` – `renderSection(index)` Funktion die alle Blöcke rendert

#### Phase 4: JSON Import/Export

**Ziel:** Seiten laden und speichern.

**Tasks:**
- [ ] **Export:** `pageData` → JSON string → `Blob` → `<a download>` Click → Datei wird heruntergeladen als `{slug}.json`
- [ ] **Import:** `<input type="file" accept=".json">` → `FileReader` → JSON.parse → `pageData` → UI neu rendern
- [ ] Leere/optionale Felder beim Export entfernen (z.B. leere `paragraphs: []`, `cards: []`, `quote: null`)
- [ ] Validierung beim Import: Pflichtfelder prüfen (slug, title, sections)

**Dateien:**
- `admin.html` – `exportJSON()`, `importJSON()` Funktionen

#### Phase 5: Design-Themes im Template

**Ziel:** template.html mit 3 Theme-Varianten erweitern. Muss VOR Preview passieren, da Preview das erweiterte Template einbettet.

**Tasks:**
- [ ] `template.html` erweitern: `<html data-theme="{{theme}}">`
- [ ] 3 CSS-Variablen-Sets definieren:

```css
/* Dark (Standard) */
[data-theme="dark"] {
  --bg: #0a0a0a; --text: #f5f5f5; --card-bg: #1a1a1a;
  --bg-elevated: #141414; --border: rgba(255,255,255,.06);
}

/* Light */
[data-theme="light"] {
  --bg: #fafafa; --text: #111827; --card-bg: #ffffff;
  --bg-elevated: #f0f0f0; --border: rgba(0,0,0,.08);
}

/* Colorful */
[data-theme="colorful"] {
  --bg: var(--accent); --text: #ffffff; --card-bg: rgba(255,255,255,.12);
  --bg-elevated: rgba(255,255,255,.08); --border: rgba(255,255,255,.15);
}
```

- [ ] `build.js` anpassen: `theme` und `lang` Feld aus JSON an Template weiterleiten
- [ ] Admin-Panel: Theme-Dropdown aktualisiert `pageData.theme`
- [ ] Colorful Theme: Hero-Bereich anpassen (eigener Gradient statt `--bg`)

**Dateien:**
- `template.html` – CSS-Variablen-Sets + `data-theme` + `lang` Attribut
- `build.js` – `theme` und `lang` Feld im Render verarbeiten

#### Phase 6: Preview

**Ziel:** Fertige Seite in neuem Tab anzeigen.

**Tasks:**
- [ ] Das erweiterte `template.html` (mit Themes) als JavaScript String-Konstante einbetten (escaped)
- [ ] `render()` Funktion aus `build.js` 1:1 als Client-Side JS kopieren
- [ ] `generatePreview()` Funktion: `pageData` → `render(template, pageData)` → HTML string
- [ ] HTML als `Blob` erstellen → `URL.createObjectURL(blob)` → `window.open(url)`

**Dateien:**
- `admin.html` – `TEMPLATE_HTML` Konstante, `render()` Funktion, `generatePreview()`

## Acceptance Criteria

### Funktionale Anforderungen

- [ ] Neue Seite erstellen: Alle Felder visuell ausfüllbar
- [ ] Bestehende JSON laden: Datei hochladen → alle Felder korrekt befüllt
- [ ] JSON speichern: Download als `{slug}.json`, direkt in `pages/` verwendbar mit `node build.js`
- [ ] Sektionen: Hinzufügen, Löschen (mit Bestätigung), Hoch/Runter sortieren
- [ ] Akkordeon: Auf-/Zuklappen funktioniert, nur eine Sektion gleichzeitig offen
- [ ] Alle 7 Inhaltsblöcke: Absätze, Cards, Timeline, Videos, Quote, Warning, Bild editierbar
- [ ] Dynamische Listen: Items hinzufügen/löschen bei Absätzen, Cards, Timeline, Videos
- [ ] Preview: Öffnet korrekt gerenderte Seite in neuem Tab
- [ ] Theme-Dropdown: Dark/Light/Colorful Auswahl, wird in JSON gespeichert und in Preview angezeigt
- [ ] Sprache-Feld: Wird in JSON als `lang` gespeichert, in `<html lang="...">` ausgegeben
- [ ] Export-JSON enthält `theme` und `lang` Felder

### Nicht-funktionale Anforderungen

- [ ] Single HTML file: Keine externen Abhängigkeiten (außer Google Fonts)
- [ ] Dark-Mode UI: Editor selbst im gleichen dunklen Design wie CMS-Output
- [ ] Funktioniert ohne Server: Direkt als `file://` im Browser öffenbar
- [ ] Export-JSON ist 1:1 kompatibel mit bestehendem `build.js`

## Implementierungsreihenfolge

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6
Grundgerüst  Sektionen   Inhalts-    JSON I/O    Themes      Preview
& Settings   Management  blöcke                  (Template)  (Admin)
```

Jede Phase ist eigenständig testbar. Phase 4 (JSON I/O) ermöglicht den ersten Roundtrip-Test: JSON exportieren → `node build.js` → Seite prüfen. Phase 5 (Themes) muss vor Phase 6 (Preview) kommen, da Preview das erweiterte Template einbettet.

## References

### Interne Referenzen

- Brainstorm: `docs/brainstorms/2026-03-16-admin-panel-brainstorm.md`
- Template: `template.html` – CSS-Variablen, Klassen, Template-Syntax
- Build-Script: `build.js` – `render()` Funktion (Zeilen 84-224)
- Beispiel-JSON: `pages/autophagie-fasten.json` – Vollständiges Praxisbeispiel
- Vorlage-JSON: `pages/_example-neue-seite.json` – Minimalbeispiel
- Prozessdiagramm: `docs/PROZESS.md` – Build-Flow
