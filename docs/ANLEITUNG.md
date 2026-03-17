# Steph's Universe CMS – Anleitung

**Stand:** 2026-03-17
**Für:** Stephan Peham

---

## Übersicht

Mit dem Steph's Universe CMS kannst du moderne Informationsseiten erstellen – ohne zu programmieren. Du arbeitest mit einem visuellen Editor (Admin-Panel), der fertige JSON-Dateien erzeugt. Diese werden dann automatisch zu fertigen HTML-Seiten gebaut.

**Deine Werkzeuge:**

| Datei | Was sie tut |
|---|---|
| `admin.html` | Visueller Editor – im Browser öffnen |
| `build.js` | Baut JSON-Dateien zu fertigen HTML-Seiten |
| `template.html` | Das Design-Template (musst du nicht anfassen) |
| `pages/` | Hier liegen deine JSON-Dateien (eine pro Seite) |
| `assets/` | Hier liegen deine Bilder |
| `dist/` | Hier landen die fertigen HTML-Seiten nach dem Build |

---

## Schritt 1: Admin-Panel öffnen

1. Gehe zum Ordner `project-001/experiment-011/`
2. Doppelklicke auf **`admin.html`**
3. Die Datei öffnet sich im Browser

Du siehst den Editor mit den Beispieldaten der Autophagie & Fasten Seite.

---

## Schritt 2: Bestehende Seite bearbeiten

### JSON laden

1. Klicke oben auf **[JSON laden]**
2. Wähle eine `.json`-Datei aus dem `pages/` Ordner
3. Alle Felder im Editor werden mit den Inhalten der Datei befüllt

### Felder bearbeiten

**Seiten-Einstellungen** (immer sichtbar oben):

| Feld | Beschreibung | Beispiel |
|---|---|---|
| Slug | URL-Pfad deiner Seite | `autophagie-fasten` |
| Seitentitel | Titel im Browser-Tab | `Autophagie & Fasten` |
| Theme | Farbschema der Seite | Dark / Light / Colorful |
| Sprache | Sprachcode | `de`, `en` |
| Akzentfarbe | Hauptfarbe für Buttons, Links | `#10b981` (Grün) |
| Icon Größe | Höhe des Nav-Icons in Pixel | `46` (Standard) |
| Hero Hintergrundbild | URL zu einem Bild | Unsplash-Link oder lokaler Pfad |
| Hero Badge | Kleiner Text über dem Titel | `Wissenschaftlich fundiert` |
| Hero Titel | Großer Titel (HTML erlaubt) | `Autophagie<br>&amp; Fasten` |
| Hero Untertitel | Beschreibungstext | Kurzer Satz |
| CTA Button | Text des Buttons | `Mehr erfahren` |
| Footer | Fußzeile (HTML erlaubt) | `&copy; 2026 &middot; by ...` |

**Sektionen** (Akkordeon darunter):

- Klicke auf eine Sektion um sie **aufzuklappen**
- Bearbeite die Felder direkt in den Textfeldern
- Du kannst in jedem Feld **Teile markieren und überschreiben**

---

## Schritt 3: Sektionen verwalten

### Neue Sektion hinzufügen

1. Klicke auf **[+ Neue Sektion]**
2. Eine leere Sektion wird unten angefügt und automatisch geöffnet
3. Fülle die Felder aus: ID, Nav-Label, Label, Titel

### Sektion löschen

1. Klicke auf das **🗑-Symbol** rechts neben der Sektion
2. Bestätige die Löschung im Dialog

### Sektionen sortieren

- **↑** verschiebt die Sektion nach oben
- **↓** verschiebt die Sektion nach unten

---

## Schritt 4: Inhalte hinzufügen

Jede Sektion kann diese Inhaltsblöcke haben (alle optional):

### Bild

- Klicke den **[Datei]**-Button neben dem Bild-Feld und wähle ein Bild von deinem Rechner – es wird automatisch eingebettet
- Alternativ: Trage eine Online-Bild-URL direkt ins Feld ein (z.B. Unsplash-Link)

### Absätze

1. Klicke **[+ Absatz]**
2. Schreibe deinen Text ins Textarea
3. HTML ist erlaubt: `<strong>fett</strong>`, `<em>kursiv</em>`
4. Weitere Absätze mit **[+ Absatz]** hinzufügen
5. Absatz löschen mit dem **🗑-Symbol**

### Cards (Karten)

1. Klicke **[+ Karte]**
2. Fülle aus:
   - **Icon:** Ein Emoji (z.B. `🔬`, `⚡`, `🧘`)
   - **Titel:** Kurzer Titel
   - **Text:** Beschreibung
3. Weitere Karten mit **[+ Karte]**

### Timeline (Zeitstrahl)

1. Klicke **[+ Zeitpunkt]**
2. Fülle aus:
   - **Zeitpunkt:** z.B. `0–4 h`, `12–18 h`
   - **Beschreibung:** Was passiert zu diesem Zeitpunkt
3. Weitere Einträge mit **[+ Zeitpunkt]**

### Videos

1. Klicke **[+ Video]**
2. Fülle aus:
   - **Video URL:** YouTube- oder ARTE-Link
   - **Thumbnail:** Wird bei YouTube automatisch gesetzt!
   - **Titel:** Titel des Videos
   - **Beschreibung:** Kurze Beschreibung
   - **Badge:** z.B. `YouTube`, `ARTE`, `YouTube Short`
   - **Badge-Typ:** Dropdown (YouTube / ARTE / Custom)
3. Weitere Videos mit **[+ Video]**

**Tipp:** Bei YouTube-Links wird das Thumbnail-Bild automatisch gesetzt.

### Zitat

- **Zitat-Text:** Das Zitat selbst
- **Quelle:** Wer hat es gesagt

### Hinweis (Warnung)

- **Hinweis Titel:** z.B. `Wichtiger Hinweis:`
- **Hinweis Text:** Der Warnungstext

---

## Schritt 5: Vorschau ansehen

1. Klicke oben auf **[Vorschau ▶]**
2. Ein neuer Browser-Tab öffnet sich mit der fertigen Seite
3. Prüfe ob alles passt
4. Schließe den Tab und korrigiere bei Bedarf im Editor

---

## Schritt 6: Seite speichern

1. Klicke oben auf **[JSON speichern]**
2. Eine `.json`-Datei wird heruntergeladen (Name = dein Slug, z.B. `autophagie-fasten.json`)
3. Verschiebe die Datei in den Ordner `project-001/experiment-011/pages/`

---

## Schritt 7: HTML-Seite bauen

1. Öffne ein Terminal / Eingabeaufforderung
2. Navigiere zum Projektordner:
   ```
   cd C:\project-001\experiment-011
   ```
3. Starte den Build:
   ```
   node build.js
   ```
4. Die fertigen Seiten liegen jetzt in `dist/`

**Ausgabe:**
```
Steph's Universe CMS - Build

2 Seite(n) gefunden.

-> autophagie-fasten/index.html
-> index.html (Übersicht)

Build fertig! -> dist/
```

---

## Schritt 8: Seite online stellen

### Option A: Vercel (empfohlen)

1. Pushe die Änderungen zu GitHub:
   ```
   git add .
   git commit -m "Neue Seite hinzugefügt"
   git push
   ```
2. Vercel deployed automatisch
3. Deine Seite ist live unter deiner Vercel-URL

### Option B: Manuell

1. Kopiere den Inhalt von `dist/` auf deinen Webserver
2. Fertig

---

## Neue Seite von Grund auf erstellen

1. Öffne `admin.html` im Browser
2. Überschreibe die Beispieldaten mit deinen Inhalten:
   - Neuer Slug (z.B. `ernaehrung-basics`)
   - Neuer Titel
   - Eigene Sektionen hinzufügen
3. Vorschau prüfen mit **[Vorschau ▶]**
4. Speichern mit **[JSON speichern]**
5. JSON in `pages/` ablegen
6. `node build.js` ausführen
7. Pushen / deployen

---

## Mehrsprachige Seite erstellen

1. Erstelle die deutsche Version: `meine-seite-de.json`
2. Öffne `admin.html`, lade die deutsche JSON
3. Ändere **Sprache** auf `en`
4. Übersetze alle Texte
5. Speichere als `meine-seite-en.json`
6. Beide Dateien in `pages/` → `node build.js`

---

## Bilder hinzufügen

**Empfohlen:** Klicke den **[Datei]**-Button neben dem jeweiligen Bild-Feld (Icon, Hero, Sektionsbild). Du kannst jede Bilddatei von deinem Rechner auswählen – sie wird automatisch eingebettet. Kein manuelles Kopieren nötig.

**Alternativ:** Online-Bilder per URL eintragen (z.B. Unsplash-Link direkt ins Textfeld).

**Unterstützte Formate:** PNG, JPG, WebP, SVG

---

## Design-Themes

| Theme | Aussehen |
|---|---|
| **Dark** | Schwarzer Hintergrund, helle Schrift (Standard) |
| **Light** | Weißer Hintergrund, dunkle Schrift |
| **Colorful** | Dunkler Hintergrund mit farbigen Akzenten und Gradient-Hero |

Die **Akzentfarbe** ist unabhängig vom Theme frei wählbar.

---

## Projektstruktur

```
experiment-011/
├── admin.html              ← EDITOR: Im Browser öffnen
├── build.js                ← BUILD: node build.js
├── template.html           ← Design (nicht bearbeiten)
├── assets/                 ← Deine Bilder hierher
│   ├── icon.png
│   ├── Grundlagen.png
│   └── ...
├── pages/                  ← Deine JSON-Dateien hierher
│   ├── autophagie-fasten.json
│   └── _example-neue-seite.json
├── dist/                   ← Fertige Seiten (nach Build)
│   ├── index.html (Übersicht)
│   └── autophagie-fasten/
│       └── index.html
└── docs/
    ├── ANLEITUNG.md        ← Diese Datei
    ├── BRAINSTORM.md
    └── PROZESS.md
```

---

## Häufige Fragen

**Kann ich HTML in Textfeldern verwenden?**
Ja, in den Feldern Hero Titel, Footer und Absätzen. Zum Beispiel: `<strong>fett</strong>`, `<em>kursiv</em>`, `<br>` für Zeilenumbruch.

**Was passiert wenn ich ein Feld leer lasse?**
Leere Felder werden beim Speichern ignoriert und nicht in die JSON geschrieben. Die Seite zeigt den entsprechenden Block einfach nicht an.

**Kann ich die Beispieldaten behalten?**
Ja! Wenn du nichts änderst und speicherst, werden die Beispieldaten genau so exportiert.

**Muss ich alle Blöcke in einer Sektion nutzen?**
Nein. Alle Blöcke (Cards, Timeline, Videos, Zitat, Hinweis) sind optional. Nutze nur was du brauchst.

**Wie ändere ich das Icon in der Navigationsleiste?**
Klicke den **[Datei]**-Button neben "Icon URL" und wähle dein Bild aus. Die Größe kannst du über das Feld "Icon Größe (px)" anpassen (Standard: 46px).

---

## Kurzanleitung (Spickzettel)

```
1. admin.html öffnen
2. Inhalte bearbeiten oder JSON laden
3. [Vorschau ▶] klicken → prüfen
4. [JSON speichern] → in pages/ ablegen
5. node build.js
6. git push (für Vercel)
```
