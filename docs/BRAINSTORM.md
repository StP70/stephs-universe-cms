# Steph's Universe CMS – Brainstorm & Struktur

## Projektidee
Ein einfaches, dateibasiertes CMS zum Erstellen von modernen Informationsseiten im Dark-Mode Design. Kein Server nötig – JSON rein, HTML raus.

## Projektstruktur

```
experiment-011/
├── template.html              # Design-Template (HTML + CSS + JS)
├── build.js                   # Build-Script: liest JSON → generiert HTML
├── assets/                    # Gemeinsame Bilder & Icons
│   ├── icon.png               # Nav-Icon (FLEXGATE, grün)
│   ├── Grundlagen.png         # Zell-Illustration
│   ├── human.png              # Mensch-Silhouette
│   ├── autophagy.png          # Autophagie-Zelle
│   └── Zeitstrahl.png         # Fasten-Zeitstrahl-Grafik
├── pages/                     # 1 JSON-Datei = 1 Seite
│   ├── autophagie-fasten.json # Erste fertige Seite
│   └── _example-neue-seite.json # Kopiervorlage für neue Seiten
└── dist/                      # Output nach `node build.js`
    ├── index.html             # Übersicht aller Seiten
    └── <slug>/index.html      # Einzelne Seiten
```

## Neue Seite erstellen – Schritt für Schritt

1. JSON-Datei in `pages/` anlegen (Kopie von `_example-neue-seite.json`)
2. `slug` vergeben (wird zum URL-Pfad, z.B. `mein-thema`)
3. Inhalte eintragen: Titel, Hero, Sektionen
4. Bilder in `assets/` ablegen
5. `node build.js` ausführen
6. Fertige Seite liegt in `dist/<slug>/index.html`

## Verfügbare Sektionstypen

| Typ        | JSON-Key     | Beschreibung                              |
|------------|--------------|-------------------------------------------|
| Text       | `paragraphs` | Fließtext mit HTML-Formatierung           |
| Cards      | `cards`      | Icon + Titel + Text Karten (Grid-Layout)  |
| Timeline   | `timeline`   | Zeitstrahl mit Zeitpunkt + Beschreibung   |
| Zitat      | `quote`      | Zitat-Block mit Quellenangabe             |
| Videos     | `videos`     | Video-Karten mit Thumbnail + Play-Button  |
| Warnung    | `warning`    | Gelber Hinweis-Block                      |
| Bild       | `image`      | Sektions-Bild (oben in der Sektion)       |

## JSON-Felder pro Seite (Toplevel)

| Feld          | Beschreibung                         |
|---------------|--------------------------------------|
| `slug`        | URL-Pfad / Ordnername               |
| `title`       | Browser-Tab-Titel                    |
| `accentColor` | Hauptakzentfarbe (z.B. `#10b981`)    |
| `accentLight` | Helle Akzentfarbe (z.B. `#6ee7b7`)  |
| `iconUrl`     | Pfad zum Nav-Icon                    |
| `iconLink`    | URL hinter dem Icon                  |
| `iconSize`    | Höhe des Nav-Icons in px (Standard: 46) |
| `heroBg`      | Hintergrundbild-URL für Hero         |
| `heroBadge`   | Kleiner Badge-Text über dem Titel    |
| `heroTitle`   | Haupttitel (HTML erlaubt)            |
| `heroSubtitle`| Untertitel                           |
| `ctaText`     | Call-to-Action Button Text           |
| `footerText`  | Fußzeile (HTML erlaubt)             |
| `sections`    | Array von Sektionen                  |

## JSON-Felder pro Sektion

| Feld         | Pflicht | Beschreibung                     |
|--------------|---------|----------------------------------|
| `id`         | Ja      | Anker-ID für Navigation          |
| `navLabel`   | Ja      | Text im Nav-Menü (Pille)         |
| `label`      | Ja      | Kleines Label über der Überschrift|
| `title`      | Ja      | Sektions-Überschrift             |
| `image`      | Nein    | Pfad zum Sektionsbild            |
| `paragraphs` | Nein    | Array von Textabsätzen           |
| `cards`      | Nein    | Array: `{icon, title, text}`     |
| `timeline`   | Nein    | Array: `{time, text}`            |
| `quote`      | Nein    | Objekt: `{text, cite}`           |
| `videos`     | Nein    | Array: `{url, thumbnail, title, description, badge, badgeType}` |
| `warning`    | Nein    | Objekt: `{title, text}`          |

## Design-System

- **Hintergrund:** `#0a0a0a` (fast schwarz)
- **Akzentfarbe:** `#10b981` (Emerald Green)
- **Schrift:** Inter (Google Fonts)
- **Cards:** Dunkle Karten mit Hover-Glow
- **Nav:** Glassmorphism + Pillen-Tags (3x2 Grid)
- **Animationen:** Fade-up beim Scrollen
- **Responsive:** Mobile-first, 2-Zeilen Nav

## Deployment

- **Vercel:** `dist/` Ordner deployen, auto-deploy bei Git Push
- **GitHub Pages:** `dist/` als Source
- **Manuell:** `dist/` Ordner auf beliebigen Webspace hochladen

## Ideen für die Zukunft

- [ ] Admin-Panel (Browser-UI zum Bearbeiten der JSON-Dateien)
- [ ] Live-Preview beim Bearbeiten
- [ ] Farbschema pro Seite wählbar
- [ ] Mehrsprachigkeit
- [ ] Automatischer Bild-Upload
- [ ] RSS-Feed Generierung
