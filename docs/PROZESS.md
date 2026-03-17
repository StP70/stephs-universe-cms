# Steph's Universe CMS – End-to-End Prozess

**Stand:** 2026-03-17

---

## 1. Gesamtübersicht

```
 AUTOR                    SYSTEM                      NUTZER
 (Stephan)                (CMS)                       (Besucher)
 ─────────                ──────                      ──────────

 ┌──────────┐   öffnen   ┌──────────────┐
 │  Idee &  │──────────> │  admin.html  │
 │  Inhalte │            │  (Editor)    │
 └──────────┘            └──────┬───────┘
                                │
                         bearbeiten, Vorschau,
                         Bilder einbetten
                                │
                                ▼
                         ┌──────────────┐
                         │ JSON speichern│──────> pages/slug.json
                         └──────────────┘
                                │
                         ┌──────┴───────┐
                         │ node build.js │
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    ▼                       ▼
             ┌─────────────┐        ┌──────────────┐
             │ dist/       │        │ dist/<slug>/ │
             │ index.html  │        │ index.html   │
             │ (Übersicht) │        └──────────────┘
             └─────────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                         git push / Upload
                                │
                                ▼
                         ┌──────────────┐         ┌──────────┐
                         │  Vercel /    │────────> │ Website  │
                         │  Webserver   │         │ besuchen │
                         └──────────────┘         └──────────┘
```

---

## 2. Phase 1: Inhalt erstellen (Admin-Panel)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         admin.html im Browser                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SEITEN-EINSTELLUNGEN                      │   │
│  │  Slug, Titel, Theme, Sprache, Akzentfarbe, Icon-Größe       │   │
│  │  Hero (Hintergrundbild, Badge, Titel, Untertitel, CTA)      │   │
│  │  Footer                                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      SEKTIONEN (Akkordeon)                   │   │
│  │                                                               │   │
│  │  Sektion 1 ─ ID, NavLabel, Label, Titel                     │   │
│  │  ├── Bild        (Datei-Upload oder URL)                     │   │
│  │  ├── Absätze     (Toolbar: Fett/Kursiv/Link + Zeilenumbruch)│   │
│  │  ├── Cards       (Icon + Titel + Text)                       │   │
│  │  ├── Timeline    (Zeitpunkt + Beschreibung)                  │   │
│  │  ├── Videos      (URL + Thumbnail + Titel + Badge)           │   │
│  │  ├── Zitat       (Text + Quelle)                             │   │
│  │  └── Warnung     (Titel + Text)                              │   │
│  │                                                               │   │
│  │  Sektion 2 ...                                                │   │
│  │  Sektion N ...                                                │   │
│  │                                                               │   │
│  │  [+ Neue Sektion]   [↑ ↓ Sortieren]   [🗑 Löschen]          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                ▼                                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │ [JSON laden] │  │ [Vorschau ▶]     │  │ [JSON speichern]   │   │
│  │ .json → Form │  │ Form → HTML-Tab  │  │ Form → .json ↓     │   │
│  └──────────────┘  └──────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Aktionen im Admin-Panel:**

| Aktion | Was passiert | Ergebnis |
|---|---|---|
| JSON laden | Datei-Picker → JSON → Formularfelder befüllt | Bestehende Seite bearbeiten |
| Vorschau | Formulardaten → Template-Engine → HTML in neuem Tab | Sofort-Vorschau ohne Build |
| JSON speichern | Formulardaten → JSON-Download | `.json`-Datei zum Ablegen in `pages/` |
| + Neue Sektion | Leere Sektion ans Ende | Akkordeon öffnet sich |
| Bild einbetten | Datei-Picker → Base64 → `data:image/...` URL | Bild direkt in JSON eingebettet |

---

## 3. Phase 2: Build (JSON → HTML)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          node build.js                               │
│                                                                     │
│  EINGABE:                                                           │
│  ════════                                                           │
│  pages/*.json ─────────┐                                            │
│  template.html ────────┤                                            │
│  assets/* ─────────────┘                                            │
│                         │                                           │
│                         ▼                                           │
│              ┌────────────────────┐                                 │
│              │  Für jede JSON:    │                                 │
│              └─────────┬──────────┘                                 │
│                        │                                            │
│           ┌────────────┼────────────────────────────┐               │
│           ▼            ▼                            ▼               │
│  ┌──────────────┐ ┌──────────────────┐  ┌──────────────────┐       │
│  │ 1. Toplevel  │ │ 2. Sektionen     │  │ 3. Navigation    │       │
│  │    ersetzen  │ │    rendern       │  │    generieren    │       │
│  │              │ │                  │  │                  │       │
│  │ title        │ │ Für jede Sektion:│  │ Aus sections[]   │       │
│  │ accentColor  │ │ ├ image?        │  │ → navLabel + id  │       │
│  │ heroBg       │ │ ├ paragraphs?   │  │ → Pillen-Tags    │       │
│  │ heroTitle    │ │ ├ cards?        │  └──────────────────┘       │
│  │ heroSubtitle │ │ ├ timeline?     │                              │
│  │ ctaText      │ │ ├ videos?       │                              │
│  │ theme        │ │ ├ quote?        │                              │
│  │ lang         │ │ └ warning?      │                              │
│  │ iconUrl/Size │ │                  │                              │
│  │ footerText   │ │ Nur vorhandene  │                              │
│  └──────────────┘ │ Blöcke rendern  │                              │
│                    └──────────────────┘                              │
│                         │                                           │
│                         ▼                                           │
│  AUSGABE:                                                           │
│  ════════                                                           │
│                                                                     │
│  dist/                                                              │
│  ├── index.html ────────────── Übersichtsseite (Links zu allen)    │
│  ├── assets/ ───────────────── Bilder (einmalig kopiert)           │
│  ├── autophagie-fasten/                                             │
│  │   └── index.html ───────── Fertige Seite (nutzt ../assets/)    │
│  ├── leberfasten/                                                   │
│  │   └── index.html                                                 │
│  └── ...                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Template-Engine Ablauf (render-Funktion):**

```
JSON-Daten + template.html
        │
        ▼
   ┌────────────────────────────────────┐
   │ 1. {{{key}}} → Raw-HTML ersetzen   │  (heroTitle, footerText)
   └────────────────┬───────────────────┘
                    ▼
   ┌────────────────────────────────────┐
   │ 2. {{key}} → Escaped Values        │  (title, slug, theme, ...)
   └────────────────┬───────────────────┘
                    ▼
   ┌────────────────────────────────────┐
   │ 3. {{#if key}} → Conditionals      │  (iconUrl vorhanden?)
   └────────────────┬───────────────────┘
                    ▼
   ┌────────────────────────────────────┐
   │ 4. {{#each sections}} → Loop       │  Inhalts-Sektionen
   │    ├── {{#if this.image}}          │
   │    ├── {{#each this.paragraphs}}   │
   │    ├── {{#if this.cards}}          │
   │    │   └── {{#each this.cards}}    │  (verschachtelt!)
   │    ├── {{#if this.timeline}}       │
   │    │   └── {{#each this.timeline}} │
   │    ├── {{#if this.videos}}         │
   │    │   └── {{#each this.videos}}   │
   │    ├── {{#if this.quote}}          │
   │    └── {{#if this.warning}}        │
   └────────────────┬───────────────────┘
                    ▼
   ┌────────────────────────────────────┐
   │ 5. {{#each sections}} → Nav-Loop   │  Navigations-Pillen
   └────────────────┬───────────────────┘
                    ▼
              Fertiges HTML
```

---

## 4. Phase 3: Deployment

```
                    dist/
                      │
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐
   │  Option A  │ │ Option B │ │  Option C    │
   │  Vercel    │ │  GitHub  │ │  Manuell     │
   │  (Auto)    │ │  Pages   │ │  Upload      │
   └─────┬──────┘ └────┬─────┘ └──────┬───────┘
         │              │              │
         │  git add .   │  gh-pages    │  FTP/SCP
         │  git commit  │  Branch      │  nach
         │  git push    │  setzen      │  Webserver
         │              │              │
         │  Vercel Hook │              │
         │  → Auto-     │              │
         │    Deploy    │              │
         │              │              │
         └──────────────┼──────────────┘
                        ▼
                 ┌──────────────┐
                 │   LIVE       │
                 │   https://   │
                 │   *.vercel   │
                 │   .app       │
                 └──────────────┘
```

---

## 5. Kompletter Workflow auf einen Blick

```
 ①              ②              ③              ④              ⑤
 ERSTELLEN      BEARBEITEN     SPEICHERN      BAUEN          DEPLOYEN
 ───────────    ───────────    ───────────    ───────────    ───────────

 admin.html  →  Felder aus-  → [JSON        → node         → git push
 öffnen         füllen,        speichern]     build.js       oder
                Sektionen                                     Upload
                hinzufügen,    ↓                ↓
                Bilder                                        ↓
                einbetten,     pages/           dist/
                [Vorschau ▶]   slug.json        ├ index.html  LIVE!
                prüfen                          └ slug/
                                                  └ index.html
```

---

## 6. Datenfluss: Vom Formular zur Website

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Browser  │     │ Dateien  │     │ Build    │     │ Server   │
│ (Mensch) │     │ (Lokal)  │     │ (Node)   │     │ (Web)    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │──admin.html────>                │                │
     │    öffnen      │                │                │
     │                │                │                │
     │──Formular──────>                │                │
     │   ausfüllen    │                │                │
     │                │                │                │
     │──[Vorschau]────>                │                │
     │   (in-memory   │                │                │
     │    Template     │                │                │
     │    Rendering)   │                │                │
     │<──HTML-Tab──────                │                │
     │                │                │                │
     │──[JSON          │                │                │
     │   speichern]───> pages/         │                │
     │                │ slug.json      │                │
     │                │                │                │
     │                │──JSON──────────>                │
     │                │  template.html─>                │
     │                │  assets/*──────> build.js       │
     │                │                │   │            │
     │                │                │   ▼            │
     │                │  dist/slug/ <──│ render()       │
     │                │  dist/index <──│                │
     │                │                │                │
     │                │──git push──────────────────────>│
     │                │                │         Vercel │
     │                │                │         deploy │
     │                │                │                │
     │<───────────────────────────────────https://────── │
     │   Website besuchen              │                │
```

---

## 7. Dateistruktur & Verantwortlichkeiten

```
experiment-011/
│
├── admin.html ··············· EDITOR (Phase 1)
│   │                           - Visueller Seiteneditor
│   │                           - JSON laden / speichern
│   │                           - Live-Vorschau (clientseitig)
│   │                           - Bild-Upload (WebP-Komprimierung)
│   │                           - Formatierungs-Toolbar
│   │
├── render.js ················ TEMPLATE-ENGINE (Shared)
│   │                           - UMD-Modul (Browser + Node)
│   │                           - Mustache-ähnliche Syntax
│   │                           - Regex-basiertes Parsing
│   │                           - Wird von admin.html + build.js genutzt
│   │
├── template.html ············ DESIGN (Phase 2)
│   │                           - HTML/CSS/JS Template
│   │                           - 3 Themes: Dark / Light / Colorful
│   │                           - Responsive, Mobile-first
│   │                           - Auto-responsive Nav-Grid
│   │
├── build.js ················· BUILD-ENGINE (Phase 2)
│   │                           - Liest pages/*.json (ignoriert _prefix)
│   │                           - Nutzt render.js für Rendering
│   │                           - Erzeugt dist/ Struktur
│   │                           - Kopiert Assets
│   │                           - Generiert Übersichtsseite
│   │
├── sync-template.js ·········· TEMPLATE-SYNC
│   │                           - node sync-template.js
│   │                           - Synchronisiert template.html
│   │                           - → eingebettetes TEMPLATE_HTML in admin.html
│   │
├── pages/ ··················· DATEN
│   ├── autophagie-fasten.json
│   ├── Leberfasten.json
│   └── _example-neue-seite.json (Vorlage)
│   │
├── assets/ ·················· MEDIEN
│   ├── icon.png
│   ├── Grundlagen.png
│   └── ...
│   │
├── dist/ ···················· OUTPUT (nach Build)
│   ├── index.html            (Übersicht aller Seiten)
│   ├── assets/               (Bilder, einmalig kopiert)
│   └── <slug>/
│       └── index.html        (Fertige Seite, nutzt ../assets/)
│
└── docs/ ···················· DOKUMENTATION
    ├── PROZESS.md            (Diese Datei)
    ├── ANLEITUNG.md          (Benutzerhandbuch)
    └── BRAINSTORM.md         (Architektur & Struktur)
```

---

## 8. Sektionstypen-Matrix

```
 Sektion im Admin-Panel          JSON-Schlüssel       HTML-Ausgabe
 ──────────────────────          ──────────────       ────────────
 ┌─────────────────────┐
 │ Bild    [Datei]     │ ──────> image               <img> Block
 │ Absätze [+ Absatz]  │ ──────> paragraphs[]        <p> mit <br>, <b>, <i>, <a>
 │ Cards   [+ Karte]   │ ──────> cards[]             Grid mit Icon/Titel/Text
 │ Timeline[+ Zeitpkt] │ ──────> timeline[]          Zeitstrahl-Liste
 │ Videos  [+ Video]   │ ──────> videos[]            Video-Karten mit Thumbnail
 │ Zitat               │ ──────> quote{text,cite}    Blockquote
 │ Warnung             │ ──────> warning{title,text}  Gelber Hinweis-Block
 └─────────────────────┘
```

---

## 9. Technische Architektur

### Systemübersicht

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          admin.html                                  │  │
│  │                       (Single-File SPA)                              │  │
│  │                                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │   CSS    │  │  HTML    │  │    JS    │  │ render.js        │    │  │
│  │  │  ~350    │  │  Forms   │  │  ~900    │  │ (Shared Engine)  │    │  │
│  │  │  Zeilen  │  │  +       │  │  Zeilen  │  │                  │    │  │
│  │  │          │  │  Akkord. │  │          │  │                  │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     dist/<slug>/index.html                           │  │
│  │                     (Statische Seite)                                │  │
│  │                                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │  │
│  │  │ CSS      │  │ HTML     │  │ JS       │                          │  │
│  │  │ Themes   │  │ Content  │  │ Scroll-  │                          │  │
│  │  │ Vars     │  │ Sections │  │ Nav +    │                          │  │
│  │  │ Respons. │  │ Nav/Hero │  │ Fade-Up  │                          │  │
│  │  └──────────┘  └──────────┘  └──────────┘                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              LOKAL (Node.js)                                │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                           build.js                                   │  │
│  │                        (Node CLI Tool)                               │  │
│  │                                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │  │
│  │  │ fs.read  │  │ render() │  │ fs.write │  │ fs.copy          │    │  │
│  │  │ Sync     │  │ aus      │  │ Sync     │  │ FileSync         │    │  │
│  │  │          │  │ render.js│  │          │  │                  │    │  │
│  │  │ JSON +   │  │ (shared) │  │ HTML →   │  │ assets/ →       │    │  │
│  │  │ Template │  │          │  │ dist/    │  │ dist/slug/      │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

                    Kein Server, keine Datenbank,
                    keine Dependencies (außer Node.js)
```

### Technologie-Stack

```
 SCHICHT          TECHNOLOGIE        DETAILS
 ────────         ───────────        ───────
 Editor UI        HTML/CSS/JS        Single-File, kein Framework
                                     CSS Custom Properties (Dark-UI)
                                     Vanilla JS, DOM-Manipulation

 Template         render.js (UMD)    Mustache-ähnliche Syntax
                                     Regex-basiertes Parsing
                                     {{{raw}}}, {{escaped}}, {{#if}},
                                     {{#each}}, {{#unless @first}}
                                     Shared: Browser + Node.js

 Build            Node.js (fs)       Keine npm-Dependencies
                                     Synchrones File-I/O
                                     build.js + render.js

 Output           Static HTML        Inline CSS + JS
                                     Google Fonts (Inter)
                                     Kein Build-Tooling nötig

 Hosting          Statisch           Vercel, GitHub Pages, beliebig
                                     Kein Server-Side-Rendering
```

---

## 10. Technischer Prozess: admin.html (Detail)

### Datenmodell im Speicher

```
 window-Scope
 │
 └── pageData (Object) ─────────── Zentraler State
     │
     ├── slug: "autophagie-fasten"
     ├── title: "Autophagie & Fasten"
     ├── theme: "dark"
     ├── lang: "de"
     ├── accentColor: "#10b981"
     ├── accentLight: "#6ee7b7"
     ├── iconUrl: "assets/icon.png"
     ├── iconLink: "https://..."
     ├── iconSize: "46"
     ├── heroBg: "https://unsplash..."
     ├── heroBadge: "Wissenschaftlich fundiert"
     ├── heroTitle: "Autophagie<br>&amp; Fasten"
     ├── heroSubtitle: "Wie Fasten..."
     ├── ctaText: "Mehr erfahren"
     ├── footerText: "&copy; 2026 ..."
     │
     └── sections: [ ──────────── Array von Sektionen
           {
             id: "grundlagen",
             navLabel: "Grundlagen",
             label: "Zellbiologie",
             title: "Was ist Autophagie?",
             image: "assets/Grundlagen.png",
             paragraphs: ["Text...", "Text..."],
             cards: [{icon, title, text}, ...],
             timeline: [{time, text}, ...],
             videos: [{url, thumbnail, title, description, badge, badgeType}, ...],
             quote: {text, cite} | null,
             warning: {title, text} | null
           },
           { ... },
           ...
         ]
```

### Event-Flow im Admin-Panel

```
 BENUTZER-AKTION              JS-FUNKTION                EFFEKT
 ──────────────               ───────────                ──────

 Seite lädt               →  bindSettings()          →  Input-Events an
                              loadSettingsToUI()         Toplevel-Felder binden
                              renderSections()           Sektionen rendern

 Feld ändert sich          →  oninput Handler         →  pageData.X = value
                              (inline im HTML)           Sofort im Speicher

 [+ Neue Sektion]          →  addSection()            →  pageData.sections.push({...})
                              renderSections()           UI aktualisiert

 [🗑 Sektion löschen]      →  removeSection(idx)      →  sections.splice(idx, 1)
                              renderSections()           UI aktualisiert

 [↑] / [↓]                →  moveSectionUp(idx)      →  Array-Element tauschen
                              moveSectionDown(idx)       renderSections()
                              renderSections()

 Akkordeon klick           →  toggleSection(idx)      →  CSS display toggle
                                                         Lazy: renderSectionBody(idx)

 Sektion-Feld ändert       →  updateSectionField      →  sections[idx].field = value
                              (idx, field, value)

 [+ Absatz]                →  addParagraph(idx)       →  paragraphs.push('')
                              renderSections()

 Text markieren + [F]      →  fmtWrap(sIdx, pIdx,     →  <strong>text</strong>
                              'strong')                   in paragraphs[pIdx]

 Text markieren + [🔗]     →  fmtLink(sIdx, pIdx)     →  prompt() → <a href>text</a>

 [+ Karte]                 →  addCard(idx)            →  cards.push({icon,title,text})
                              renderSections()

 [+ Zeitpunkt]             →  addTimelineItem(idx)    →  timeline.push({time,text})
                              renderSections()

 [+ Video]                 →  addVideo(idx)           →  videos.push({url,...})
                              renderSections()

 Seite lädt               →  restoreAutosave()       →  Falls localStorage-Backup
                              (vor bindSettings)         existiert: Restore-Dialog

 Jede Änderung            →  scheduleAutosave()      →  Nach 1s Debounce:
                              (aus allen update*)        localStorage.setItem()

 Slug-Feld ändert         →  auto-lowercase           →  Nur a-z, 0-9, - erlaubt
                              + sanitize                 Großbuchstaben → klein

 accentColor ändert       →  lightenColor()           →  HSL +40% Lightness
                              (in bindSettings)          → accentLight auto-gesetzt

 [JSON speichern]         →  Validierung              →  Warnt bei leerem Slug,
                              (vor Export)               Titel, Section-ID, NavLabel
                              clearAutosave()            localStorage wird geleert
```

### Bild-Einbettung mit Komprimierung (technisch)

```
 Benutzer klickt [Datei]
         │
         ▼
 <input type="file" accept="image/*">
         │
         ▼
 handleImagePick(sIdx, event)     oder    handleSettingsImagePick(field, event)
         │                                          │
         ▼                                          ▼
 compressImage(file)              compressImage(file)
         │                                          │
         ▼                                          ▼
 ┌─────────────────────────────────────────────────────────┐
 │ 1. SVG? → readFileAsDataUrl() (kein Canvas nötig)      │
 │                                                          │
 │ 2. PNG/JPG/WebP:                                        │
 │    img = new Image()                                     │
 │    img.src = URL.createObjectURL(file)                   │
 │         │                                                │
 │         ▼                                                │
 │    Resize: wenn width > 1200px → proportional skalieren │
 │         │                                                │
 │         ▼                                                │
 │    canvas.drawImage(img, 0, 0, w, h)                    │
 │    canvas.toDataURL('image/webp', 0.82)                 │
 │         │                                                │
 │         ▼                                                │
 │    "data:image/webp;base64,..."                         │
 │    (deutlich kleiner als PNG Base64)                     │
 └─────────────────────────────────────────────────────────┘
         │                                          │
         ▼                                          ▼
 sections[sIdx].image = url       pageData[field] = url
 renderSections()                 loadSettingsToUI()

 Vorteile:
 - WebP ≈ 25-35% kleiner als PNG bei gleicher Qualität
 - Große Bilder werden auf max 1200px Breite verkleinert
 - SVGs bleiben unverändert (verlustfrei)
```

### JSON Export (technisch)

```
 Benutzer klickt [JSON speichern]
         │
         ▼
 exportJSON()
         │
         ├── 1. Kopie von pageData erstellen
         │
         ├── 2. Leere Felder bereinigen:
         │      - Leere strings → entfernen
         │      - Leere arrays (cards:[], timeline:[], videos:[]) → entfernen
         │      - quote/warning mit leeren Feldern → null → entfernen
         │
         ├── 3. Pro Sektion:
         │      - section.paragraphs filtern (nicht-leere)
         │      - section.cards filtern (Titel nicht leer)
         │      - section.timeline filtern (time nicht leer)
         │      - section.videos filtern (url nicht leer)
         │
         ├── 4. JSON.stringify(cleaned, null, 2)
         │
         ├── 5. Blob erstellen (type: application/json)
         │
         └── 6. <a download="slug.json"> → click() → Download
                                                         │
                                                         ▼
                                                  Datei im Download-Ordner
                                                  → manuell nach pages/ verschieben
```

### JSON Import (technisch)

```
 Benutzer klickt [JSON laden]
         │
         ▼
 <input type="file" accept=".json">
         │
         ▼
 importJSON(event)
         │
         ├── 1. FileReader.readAsText(file)
         │
         ├── 2. JSON.parse(text) → data
         │
         ├── 3. Toplevel-Felder überschreiben:
         │      pageData.slug = data.slug
         │      pageData.title = data.title
         │      pageData.theme = data.theme || 'dark'
         │      ... (alle 13 Toplevel-Felder)
         │
         ├── 4. Sektionen normalisieren:
         │      Für jede Sektion:
         │      - paragraphs: sicherstellen dass Array
         │      - cards: sicherstellen dass Array
         │      - timeline: sicherstellen dass Array
         │      - videos: sicherstellen dass Array
         │      - quote: Object oder null
         │      - warning: Object oder null
         │
         ├── 5. pageData.sections = normalisierte Sektionen
         │
         ├── 6. loadSettingsToUI() → Formularfelder befüllen
         │
         └── 7. renderSections() → Akkordeons neu zeichnen
```

### Vorschau-Generierung (technisch)

```
 Benutzer klickt [Vorschau ▶]
         │
         ▼
 generatePreview()
         │
         ├── 1. window.open('about:blank')     ← SOFORT (synchron!)
         │      Popup-Blocker-sicher, weil im
         │      User-Gesture-Kontext. Zeigt
         │      "Vorschau wird geladen..."
         │
         ├── 2. Relative Bilder cachen
         │      Nur lokale Pfade (assets/...),
         │      NICHT data: oder https: URLs
         │      (isRelativePath-Filter)
         │
         ├── 3. Kopie der Daten erstellen
         │      (gleiche Bereinigung wie beim Export)
         │
         ├── 4. Template laden:
         │      │  try fetch('template.html')    ← Live-Version
         │      │  catch → TEMPLATE_HTML         ← Embedded Fallback
         │
         ├── 5. CMS.render(templateHtml, cleanData)
         │      │
         │      └── Shared render() aus render.js
         │          (gleiche Datei wie build.js nutzt)
         │
         ├── 6. Asset-Pfade absolut machen
         │      assets/X → file:///...../assets/X
         │      (kein <base> Tag – bricht Anker-Links)
         │
         ├── 7. previewWin.document.write(html)
         │      Fenster mit fertigem HTML befüllen
         │
         └── catch: Fehler im Preview-Fenster anzeigen
                    (statt lautlos zu scheitern)
```

---

## 11. Technischer Prozess: build.js (Detail)

### Build-Ablauf Schritt für Schritt

```
 node build.js
         │
         ▼
 ┌─────────────────────────────────────────────────┐
 │ 1. INIT                                         │
 │    const { render } = require('./render.js')    │
 │    const PAGES_DIR  = __dirname + '/pages'      │
 │    const DIST_DIR   = __dirname + '/dist'       │
 │    const TEMPLATE   = __dirname + '/template'   │
 │    const ASSETS_SRC = __dirname + '/assets'     │
 │                                                  │
 │    mkdir dist/ (falls nicht vorhanden)           │
 │    template = fs.readFileSync(template.html)     │
 └────────────────────┬────────────────────────────┘
                      │
                      ▼
 ┌─────────────────────────────────────────────────┐
 │ 1b. DIST AUFRÄUMEN                              │
 │     Alle Ordner/Dateien in dist/ löschen        │
 │     Ausgenommen: .gitignore, .vercel, .nojekyll │
 │                                                  │
 │     → Verwaiste Seiten werden entfernt          │
 └────────────────────┬────────────────────────────┘
                      │
                      ▼
 ┌─────────────────────────────────────────────────┐
 │ 2. SEITEN SAMMELN                               │
 │    pageFiles = fs.readdirSync('pages/')         │
 │               .filter(f => .json && !_prefix)    │
 │                                                  │
 │    "2 Seite(n) gefunden."                       │
 └────────────────────┬────────────────────────────┘
                      │
                      ▼
 ┌─────────────────────────────────────────────────┐
 │ 2b. ASSETS KOPIEREN (einmalig)                  │
 │     assets/* → dist/assets/                     │
 │     (nicht mehr pro Seite!)                     │
 └────────────────────┬────────────────────────────┘
                      │
                      ▼
 ┌─────────────────────────────────────────────────┐
 │ 3. FÜR JEDE JSON-DATEI:                        │
 │    try/catch pro Datei (Fehler → Warnung,      │
 │    andere Seiten werden weiter gebaut)          │
 │                                                  │
 │    a) data = JSON.parse(pages/X.json)           │
 │                                                  │
 │    b) html = render(template, data)             │
 │       → Template-Engine (siehe Abschnitt 10)    │
 │                                                  │
 │    c) mkdir dist/<slug>/                        │
 │       writeFile dist/<slug>/index.html          │
 │                                                  │
 │    d) Asset-Pfade umschreiben:                  │
 │       assets/X → ../assets/X                    │
 └────────────────────┬────────────────────────────┘
                      │
                      ▼
 ┌─────────────────────────────────────────────────┐
 │ 4. ÜBERSICHTSSEITE                              │
 │                                                  │
 │    Für jede JSON:                               │
 │      Link: <a href="slug/">title</a>            │
 │                                                  │
 │    indexHtml = Hardcoded HTML-Template           │
 │      - Inter Font                               │
 │      - Dark-Mode Styling                        │
 │      - Links zu allen Seiten                    │
 │                                                  │
 │    writeFile dist/index.html                    │
 └────────────────────┬────────────────────────────┘
                      │
                      ▼
                "Build fertig! → dist/"
```

### Template-Engine: Regex-Verarbeitungsreihenfolge

```
 REIHENFOLGE IST KRITISCH – Jeder Schritt verändert den HTML-String.

 Schritt  Regex-Pattern                      Beispiel
 ───────  ─────────────                      ────────

 1.       /\{\{\{(\w+)\}\}\}/g               {{{heroTitle}}} → Autophagie<br>&amp; Fasten
          Raw-HTML (Triple-Brace)             Überspringt {{{this}}} (Loop-Variable)

 2.       /\{\{(\w+)\}\}/g                   {{title}} → Autophagie &amp; Fasten
          Escaped Values (Double-Brace)       Überspringt: this, each, if, unless

 3.       /\{\{#if (\w+)\}\}...\{\{\/if\}\}/ {{#if iconUrl}}...{{/if}}
          Toplevel-Conditionals               Ganzer Block entfernt wenn falsy

 4.       findOuterEachSections()             {{#each sections}}...{{/each}}
          Findet LETZTEN (größten) Block      = Content-Sektionen (nicht Nav)
          │
          └── Pro Sektion:
              ├── {{#unless @first}}          Divider überspringen für erste
              ├── {{#if this.image}}          Bild einfügen wenn vorhanden
              ├── {{#each this.paragraphs}}   <p>{{{this}}}</p> mit <br>
              ├── {{#if this.cards}}
              │   └── {{#each this.cards}}    Verschachtelter Loop
              ├── {{#if this.timeline}}
              │   └── {{#each this.timeline}}
              ├── {{#if this.videos}}
              │   └── {{#each this.videos}}
              ├── {{#if this.quote}}          quote.text + quote.cite
              ├── {{#if this.warning}}        warning.title + warning.text
              └── {{this.X}} Restfelder       id, navLabel, label, title

 5.       /\{\{#each sections\}\}...\}/      {{#each sections}}...{{/each}}
          Nav-Loop (ERSTER Block)             <a href="#id">navLabel</a>

 6.       /\{\{footerText\}\}/g              Footer-Cleanup
```

---

## 12. Technischer Prozess: template.html (Detail)

### HTML-Struktur der generierten Seite

```
 <!DOCTYPE html>
 <html lang="{{lang}}" data-theme="{{theme}}">
 │
 ├── <head>
 │   ├── <title>{{title}}</title>
 │   ├── <meta description>      (aus heroSubtitle)
 │   ├── <meta og:title>         (Open Graph)
 │   ├── <meta og:description>   (Open Graph)
 │   ├── <meta og:type>          (Open Graph)
 │   ├── <meta og:image>         ({{#if heroBg}}, Open Graph)
 │   ├── Google Fonts: Inter (300-800)
 │   └── <style>
 │       ├── CSS Custom Properties (:root)
 │       │   ├── --accent: {{accentColor}}
 │       │   ├── --accent-light: {{accentLight}}
 │       │   └── --accent-glow: {{accentColor}}40
 │       │
 │       ├── Theme-Varianten via [data-theme="X"]
 │       │   ├── dark   → #0a0a0a Hintergrund, helle Schrift
 │       │   ├── light  → #fafafa Hintergrund, dunkle Schrift
 │       │   └── colorful → #0f0f1a + Gradient-Hero + Glow-Cards
 │       │
 │       ├── Komponenten-Styles
 │       │   ├── nav          Sticky, Glassmorphism, Pillen-Grid (auto-fill)
 │       │   ├── .hero        Min 90vh, Hintergrundbild, Badge, CTA
 │       │   ├── .container   Max 960px, Fade-Up Animation
 │       │   ├── .card        Hover-Lift + Glow, Grid auto-fit 260px
 │       │   ├── .quote-block Großes Anführungszeichen, Cite
 │       │   ├── .timeline    2-Spalten Grid (100px + 1fr)
 │       │   ├── .video-card  Thumbnail + Play-Overlay + Badge
 │       │   ├── .hinweis     Gelber Rahmen, Warn-Icon
 │       │   └── .divider     Gradient-Linie zwischen Sektionen
 │       │
 │       └── Responsive
 │           └── @media (max-width: 640px) → Kompaktere Abstände
 │
 ├── <body>
 │   │
 │   ├── <nav> ──────────────────────────── Sticky Navigation
 │   │   ├── Icon ({{#if iconUrl}})
 │   │   └── .nav-links
 │   │       └── {{#each sections}}
 │   │           <a href="#{{this.id}}">{{this.navLabel}}</a>
 │   │
 │   ├── <header class="hero"> ──────────── Hero-Bereich
 │   │   ├── Hintergrundbild (CSS --hero-bg)
 │   │   ├── Badge ({{#if heroBadge}})
 │   │   ├── <h1>{{{heroTitle}}}</h1>
 │   │   ├── <p>{{heroSubtitle}}</p>
 │   │   └── CTA-Button → Link zur 1. Sektion
 │   │
 │   ├── {{#each sections}} ─────────────── Content-Sektionen
 │   │   │
 │   │   ├── <hr class="divider">           (außer erste Sektion)
 │   │   │
 │   │   └── <div class="container fade-up" id="{{this.id}}">
 │   │       ├── <img> Sektionsbild          (wenn vorhanden)
 │   │       ├── <span> Label
 │   │       ├── <h2> Titel
 │   │       ├── <p> Absätze                 ({{#each this.paragraphs}})
 │   │       ├── <div class="quote-block">   ({{#if this.quote}})
 │   │       ├── <div class="cards">         ({{#if this.cards}})
 │   │       │   └── <div class="card">      ({{#each this.cards}})
 │   │       ├── <div class="timeline">      ({{#if this.timeline}})
 │   │       │   └── <div class="tl-item">   ({{#each this.timeline}})
 │   │       ├── <div class="video-grid">    ({{#if this.videos}})
 │   │       │   └── <a class="video-card">  ({{#each this.videos}})
 │   │       └── <div class="hinweis">       ({{#if this.warning}})
 │   │
 │   ├── <footer> ──────────────────────────── Fußzeile
 │   │   └── {{footerText}}
 │   │
 │   └── <script> ──────────────────────────── Client-JS
 │       ├── IntersectionObserver            Fade-Up Animationen
 │       │   └── .fade-up → .visible          bei 8% Sichtbarkeit
 │       │
 │       └── Scroll-Navigation
 │           ├── updateActiveNav()           Aktive Pillen markieren
 │           └── click Handler               Sofort-Markierung bei Klick
 │
 └── </html>
```

### CSS-Theming via Custom Properties

```
 [data-theme] setzt alle Variablen gleichzeitig:

 Variable          dark            light           colorful
 ────────          ────            ─────           ────────
 --bg              #0a0a0a         #fafafa         #0f0f1a
 --bg-elevated     #141414         #f0f0f0         rgba(255,255,255,.05)
 --bg-card         #1a1a1a         #ffffff         rgba(255,255,255,.08)
 --text            #f5f5f5         #111827         #ffffff
 --text-muted      #a3a3a3         #6b7280         rgba(255,255,255,.7)
 --border          rgba(w,.06)     rgba(b,.08)     rgba(w,.1)
 --shadow-*        starke Schatten schwache Sch.   starke Schatten

 Zusätzliche Theme-Overrides:
 - light: nav weiß, hero = Accent-Gradient, CTA invertiert
 - colorful: hero = Accent→Dunkel Gradient, Cards mit Glow-Hover
```

---

## 13. Technischer Prozess: Generierte Seite (Client-JS)

### Laufzeit-Verhalten im Browser

```
 Seite geladen
         │
         ├── 1. IntersectionObserver erstellen
         │      threshold: 0.08 (8% sichtbar)
         │      │
         │      └── Für jede .fade-up Sektion:
         │          observer.observe(element)
         │          │
         │          └── Wenn sichtbar:
         │              element.classList.add('visible')
         │              → CSS Transition: opacity 0→1, translateY 30→0
         │              (nur wenn prefers-reduced-motion: no-preference)
         │
         ├── 2. Nav-Links sammeln
         │      navLinks = querySelectorAll('.nav-links a')
         │      sectionIds = href-Attribute extrahieren
         │
         ├── 3. Scroll-Listener registrieren (passive)
         │      │
         │      └── updateActiveNav()
         │          Für jede Sektion:
         │            Wenn scrollY >= sektion.offsetTop - navHöhe - 80px
         │            → Diese Sektion ist "aktiv"
         │          │
         │          └── .active Klasse setzen auf passenden Nav-Link
         │              → CSS: weißer Text, Accent-Border, Accent-BG
         │
         └── 4. Click-Handler auf Nav-Links
                 Bei Klick sofort .active setzen
                 (smooth scroll via CSS scroll-behavior)
```

---

## 14. Behobene Einschränkungen & Verbleibende Limitierungen

### Behoben

```
 PROBLEM                          LÖSUNG
 ───────                          ──────

 render() existiert 2x            → render.js (UMD-Modul)
 (admin.html + build.js)            Shared zwischen Browser + Node.js.
                                     Änderungen nur noch an 1 Stelle.

 Base64 bläht JSON auf            → compressImage() in admin.html
 (~133% Originalgröße)              Bilder werden via Canvas auf max
                                     1200px Breite skaliert und als
                                     WebP (Quality 0.82) gespeichert.
                                     SVGs bleiben unverändert.

 Navigation Grid 3x2 fest         → auto-fill Grid in template.html
 (max 6 Sektionen)                  repeat(auto-fill, minmax(110px, 1fr))
                                     Passt sich automatisch an die
                                     Anzahl der Sektionen an.

 Vorschau nutzt eingebettetes     → fetch('template.html') mit Fallback
 Template (kann veralten)            Vorschau lädt immer die aktuelle
                                     template.html. Nur wenn fetch
                                     fehlschlägt (file://), wird das
                                     eingebettete Fallback-Template
                                     genutzt.

 _example-neue-seite.json         → build.js ignoriert jetzt Dateien
 wurde mitgebaut                     mit _ Prefix im Dateinamen.

 Assets pro Seite dupliziert      → Shared dist/assets/
 (3.5MB × N Seiten)                 Einmalig kopiert, HTML-Pfade
                                     umgeschrieben auf ../assets/

 Verwaiste dist/-Ordner           → dist/ wird vor Build geleert
                                     (behält .gitignore, .vercel)

 Slug mit Großbuchstaben          → Admin: auto-lowercase + sanitize
                                     Build: warnt bei Großbuchstaben

 HTML-Injection in Index          → escHtml() für title + slug
                                     in der Übersichtsseite

 Ein kaputtes JSON crasht Build   → try/catch pro Datei
                                     Fehler = Warnung, Rest baut weiter

 Kein Autosave                    → localStorage mit 1s Debounce
                                     Restore-Dialog beim Öffnen

 Keine SEO Meta-Tags              → meta description + Open Graph
                                     (og:title, og:description,
                                      og:image, og:type)

 accentLight manuell              → auto-berechnet aus accentColor
                                     (HSL +40% Lightness)

 Keine Validierung vor Export     → Warnt bei fehlendem Slug, Titel,
                                     Section-ID, NavLabel

 Template-Drift (admin ↔ tmpl)    → sync-template.js
                                     node sync-template.js
```

### Verbleibend (nicht behebbar / bewusste Entscheidung)

```
 BEREICH              EINSCHRÄNKUNG                    WARUM
 ────────             ──────────────                   ─────

 Template-Engine      Keine Fehlermeldungen            Einfachheit: Regex-Engine
                      bei falschem JSON                 hat kein Error-Reporting.
                                                        JSON-Import validiert aber
                                                        slug/title beim Laden.

 Build                Synchrones I/O                   Kein Problem bei
                      (readFileSync etc.)               wenigen Seiten. Bewusst
                                                        einfach gehalten.

 Export               Download → manuell               Browser-Sandbox erlaubt
                      nach pages/ verschieben           kein direktes Schreiben.
                                                        Kein Workaround möglich
                                                        ohne Server.

 Embedded Template    TEMPLATE_HTML in admin.html       Nötig als Fallback für
                      kann von template.html             file://-Zugriff (CORS).
                      abweichen                         Sync via:
                                                        node sync-template.js
```
