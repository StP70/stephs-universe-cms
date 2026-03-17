# Steph's Universe CMS – Features

**Stand:** 2026-03-17

---

## Admin-Panel (Visueller Editor)

| Feature | Beschreibung |
|---|---|
| Single-File Editor | `admin.html` – im Browser öffnen, kein Server nötig |
| JSON Import | Bestehende Seite laden und weiterbearbeiten |
| JSON Export | Seite als `.json` herunterladen → in `pages/` ablegen |
| Live-Vorschau | Fertige Seite in neuem Tab anzeigen (Popup-Blocker-sicher) |
| Autosave | Änderungen werden automatisch im Browser gespeichert (localStorage). Restore-Dialog beim nächsten Öffnen |
| Validierung | Warnt vor dem Speichern bei fehlendem Slug, Titel oder Sektions-IDs |
| Slug-Sanitize | URL-Pfad wird automatisch kleingeschrieben, nur `a-z`, `0-9`, `-` erlaubt |
| Dark-Mode UI | Editor im gleichen dunklen Design wie die generierten Seiten |

## Sektions-Editor

| Feature | Beschreibung |
|---|---|
| Akkordeon-Layout | Sektionen auf-/zuklappbar für Übersicht |
| Hinzufügen / Löschen | Neue Sektionen anlegen, bestehende entfernen (mit Bestätigung) |
| Sortieren | Sektionen per Pfeil-Buttons nach oben/unten verschieben |
| 7 Inhaltsblöcke | Text, Cards, Timeline, Videos, Zitat, Warnung, Bild – frei kombinierbar pro Sektion |

## Inhaltsblöcke

| Block | Features |
|---|---|
| **Absätze** | Dynamische Liste, Formatierungs-Toolbar (Fett, Kursiv, Link), Zeilenumbrüche automatisch |
| **Cards** | Icon (Emoji-Picker mit 128 Icons in 8 Kategorien oder manuelle Eingabe) + Titel + Text, Grid-Layout, Hover-Glow, globale Icon-Größe einstellbar |
| **Timeline** | Zeitpunkt + Beschreibung, 2-Spalten Layout, Card-Styling (gleiche Helligkeit wie Cards) |
| **Videos** | URL + Thumbnail + Titel + Badge, YouTube-Thumbnail wird automatisch erkannt |
| **Zitat** | Text + Quellenangabe, dekoratives Anführungszeichen |
| **Warnung** | Titel + Text, gelber Hinweis-Block |
| **Bild** | Datei-Upload oder URL, Sektions-Kopfbild |

## Bilder

| Feature | Beschreibung |
|---|---|
| Datei-Upload | Bilder direkt vom Rechner auswählen per [Datei]-Button |
| WebP-Komprimierung | Bilder werden automatisch auf max 1200px Breite skaliert und als WebP (Quality 82%) eingebettet |
| SVG-Support | SVG-Dateien werden verlustfrei eingebettet (kein Canvas-Resize) |
| Online-URLs | Alternativ: Bild-URL direkt eingeben (z.B. Unsplash-Link) |
| Base64-Einbettung | Bilder werden in der JSON-Datei eingebettet – kein separater Upload nötig |

## Design & Themes

| Feature | Beschreibung |
|---|---|
| 3 Themes | Dark (Standard), Light, Colorful – per Dropdown wählbar |
| Akzentfarbe | Frei wählbar per Color-Picker, gilt für Buttons, Links, Badges |
| Helle Akzentfarbe | Wird automatisch aus der Akzentfarbe berechnet (HSL +40% Lightness), manuell überschreibbar |
| Card-Icon-Größe | Global einstellbar (20–80px), steuert Box-Größe, font-size und border-radius proportional |
| Responsive | Mobile-first Design, Breakpoint bei 640px |
| Auto-responsive Nav | Pillen-Grid passt sich automatisch an die Anzahl der Sektionen an |
| Glassmorphism Nav | Sticky Navigation mit Blur-Effekt und Pillen-Tags |
| Fade-Up Animationen | Sektionen blenden beim Scrollen ein (respektiert `prefers-reduced-motion`) |
| Scroll-Navigation | Aktive Sektion wird in der Nav automatisch markiert |
| Hero-Bereich | Vollbild mit Hintergrundbild, Badge, Titel, Untertitel, CTA-Button |

## SEO & Social Media

| Feature | Beschreibung |
|---|---|
| Meta Description | Automatisch aus `heroSubtitle` generiert, HTML-Tags entfernt, Quotes escaped |
| Open Graph Tags | `og:title`, `og:description`, `og:type`, `og:image` – für WhatsApp, Telegram, Twitter etc. |
| Sprachattribut | `<html lang="de">` aus dem Sprach-Feld im Editor |

## Build-System

| Feature | Beschreibung |
|---|---|
| Static Site Generator | `node build.js` – JSON rein, HTML raus, keine Dependencies |
| Shared Template-Engine | `render.js` – UMD-Modul, identisch in Browser und Node.js |
| Shared Assets | Bilder einmalig in `dist/assets/` kopiert (nicht pro Seite dupliziert) |
| Asset-Pfad-Rewrite | `assets/X` → `../assets/X` in generierten Seiten |
| dist-Cleanup | Verwaiste Seiten werden vor dem Build entfernt |
| Übersichtsseite | `dist/index.html` mit Links zu allen Seiten |
| _Prefix ignoriert | Dateien mit `_` Prefix (z.B. `_example-neue-seite.json`) werden nicht gebaut |
| Fehlertoleranz | try/catch pro JSON-Datei – ein Fehler stoppt nicht den ganzen Build |
| Slug-Validierung | Warnung bei Großbuchstaben im Slug, Fehler bei leerem Slug |
| HTML-Escaping | Titel und Slug in der Übersichtsseite werden sicher escaped |
| Template-Sync | `node sync-template.js` synchronisiert `template.html` → eingebettetes Fallback-Template in `admin.html` |

## Mehrsprachigkeit

| Feature | Beschreibung |
|---|---|
| Sprach-Feld | Pro Seite einstellbar (`de`, `en`, etc.) |
| Eine JSON pro Sprache | Gleiche Struktur, separater Inhalt, separate Slugs |
| `<html lang>` | Sprachcode wird im generierten HTML ausgegeben |

## Deployment

| Option | Beschreibung |
|---|---|
| Vercel | `git push` → automatisches Deployment |
| GitHub Pages | `dist/` als Source-Ordner |
| Manuell | `dist/` auf beliebigen Webserver kopieren |

---

## Nicht implementiert (bewusste Entscheidung)

| Feature | Warum nicht |
|---|---|
| Drag & Drop Sortierung | Pfeil-Buttons reichen, weniger Code |
| Inline-Editing | Zu komplex, Formular-basiert reicht |
| Mehrbenutzer | Stephan arbeitet alleine |
| Versionierung | Git reicht |
| Mobile-optimierter Editor | Desktop-first, Admin-Arbeit am Laptop |
| Server-Backend | Kein Server nötig – alles läuft lokal |
| RSS-Feed | Offen als Zukunfts-Idee |
