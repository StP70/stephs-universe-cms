# Admin-Panel für Steph's Universe CMS

**Datum:** 2026-03-16
**Status:** Brainstorm abgeschlossen
**Nächster Schritt:** `/workflows:plan`

---

## Was wir bauen

Ein visuelles Admin-Panel (`admin.html`) für das Steph's Universe CMS, mit dem Stephan Informationsseiten erstellen und bearbeiten kann – ohne JSON manuell schreiben zu müssen.

**Kernfunktionen:**
1. **Seiten-Editor** – Visuelles Bearbeiten aller Felder (Hero, Sektionen, Footer)
2. **Sektions-Management** – Sektionen hinzufügen, entfernen, sortieren (Hoch/Runter-Pfeile)
3. **7 Inhaltsblöcke pro Sektion** – Text, Cards, Timeline, Videos, Quote, Warning, Bild (frei kombinierbar)
4. **Akkordeon-Layout** – Jede Sektion auf-/zuklappbar für Übersicht
5. **Preview** – Button öffnet fertige Seite in neuem Browser-Tab
6. **JSON Import/Export** – Datei hochladen zum Bearbeiten, herunterladen zum Speichern

## Warum dieser Ansatz

- **Einzelne HTML-Datei:** Kein Server, kein npm, kein Build-Tool für das Admin-Panel selbst. Einfach `admin.html` öffnen und loslegen.
- **Download/Upload statt Backend:** Stephan arbeitet alleine – LocalStorage wäre komfortabler, aber Download/Upload ist expliziter und integriert sich besser mit dem bestehenden `build.js` Workflow (JSON in `pages/` ablegen → `node build.js`).
- **Akkordeon statt Scroll:** Bei 6+ Sektionen wird eine flache Liste unübersichtlich. Akkordeon hält den Fokus auf eine Sektion.
- **Preview in neuem Tab:** Einfacher als Split-View. Volle Breite für Editor UND Preview. Kein iframe-Rendering nötig.

## Key Decisions

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Architektur | Single HTML file | Kein Build-Schritt, sofort nutzbar |
| Layout | Volle Breite Editor | Maximaler Platz für Formulare |
| Sektionen | Akkordeon | Übersichtlich bei vielen Sektionen |
| Preview | Neuer Tab | Volle Breite, einfach zu bauen |
| Datei-I/O | JSON Download/Upload | Passt zum bestehenden build.js Workflow |
| Design | Dark Mode (wie CMS-Output) | Konsistentes Erlebnis |
| Sortierung | Hoch/Runter-Pfeile | Einfacher als Drag & Drop, weniger Code |
| Mehrsprachigkeit | Eine JSON pro Sprache | Kein neues System nötig, build.js braucht nur minimale Anpassung |
| Design-Themes | 3 Presets (Dark/Light/Colorful) | Deckt alle gängigen Styles ab, Akzentfarbe bleibt frei |

## Editor-Struktur (UI Aufbau)

```
┌──────────────────────────────────────────────────┐
│  HEADER: "Steph's Universe CMS"                  │
│  [JSON laden]  [JSON speichern]  [Vorschau ▶]    │
├──────────────────────────────────────────────────┤
│                                                   │
│  SEITEN-EINSTELLUNGEN (immer sichtbar)            │
│  ┌───────────────────────────────────────────┐   │
│  │ Slug: [________]  Titel: [____________]    │   │
│  │ Theme: [Dark ▼]  Sprache: [de]            │   │
│  │ Akzentfarbe: [#10b981]  Helle: [#6ee7b7]  │   │
│  │ Icon URL: [________]  Icon Link: [_____]   │   │
│  │ Hero BG: [________]  Badge: [__________]   │   │
│  │ Hero Titel: [________]                     │   │
│  │ Hero Untertitel: [________________________]│   │
│  │ CTA Text: [________]                      │   │
│  │ Footer: [_________________________________]│   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  SEKTIONEN                    [+ Neue Sektion]    │
│  ┌───────────────────────────────────────────┐   │
│  │ ▼ Autophagie [Grundlagen]    [↑][↓][🗑]   │   │
│  │   ID: [autophagie]  Nav: [Autophagie]      │   │
│  │   Label: [Grundlagen]  Titel: [Was ist..]  │   │
│  │   Bild: [assets/Grundlagen.png]            │   │
│  │                                             │   │
│  │   Absätze:                    [+ Absatz]    │   │
│  │   1. [F] [K] [🔗]  ← Toolbar              │   │
│  │      [Das Wort Autophagie...]    [🗑]      │   │
│  │   2. [F] [K] [🔗]                          │   │
│  │      [Dieser Mechanismus...]     [🗑]      │   │
│  │                                             │   │
│  │   Zitat:                                    │   │
│  │   Text: [Autophagie ist das...]             │   │
│  │   Quelle: [– frei nach Ohsumi...]          │   │
│  │                                             │   │
│  │   Cards:                      [+ Karte]     │   │
│  │   1. Icon[🔬] Titel[Zellern..] Text[..] [🗑]│  │
│  │   2. Icon[🛡] Titel[Immun..]  Text[..] [🗑]│  │
│  │   3. Icon[⚡] Titel[Energie..] Text[..] [🗑]│  │
│  └───────────────────────────────────────────┘   │
│  ▶ Fasten [Methoden]              [↑][↓][🗑]    │
│  ▶ Wissenschaft                   [↑][↓][🗑]    │
│  ▶ Zeitstrahl                     [↑][↓][🗑]    │
│  ▶ Tipps                          [↑][↓][🗑]    │
│  ▶ Videos                         [↑][↓][🗑]    │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Inhaltsblöcke im Editor

| Typ | Felder im Editor |
|---|---|
| **Basis** (immer) | ID, Nav-Label, Label, Titel, Bild-URL (optional) |
| **Text** | Absätze (dynamische Liste von Textareas) |
| **Cards** | Liste von: Icon (Emoji-Picker/Input) + Titel + Text |
| **Timeline** | Liste von: Zeitpunkt + Beschreibung |
| **Videos** | Liste von: URL + Thumbnail + Titel + Beschreibung + Badge + Badge-Typ |
| **Quote** | Text + Quellenangabe |
| **Warning** | Titel + Text |

Alle Blöcke sind optional und kombinierbar pro Sektion (wie im JSON-Schema).
Beim Klick auf **[+ Neue Sektion]** wird eine leere Sektion mit allen Feldern angelegt – unbenutzte Blöcke bleiben leer und werden beim Export ignoriert.

## Preview-Generierung

Die Preview nutzt das **gleiche Template-Rendering** wie `build.js`:
1. Admin-Panel baut JSON aus den Formularfeldern
2. Rendert HTML clientseitig mit einer JS-Version der Template-Engine
3. Öffnet das Ergebnis als `blob:` URL in neuem Tab

## Design-Themes

Der Editor bietet ein **Theme-Dropdown** in den Seiten-Einstellungen mit 3 Voreinstellungen:

| Theme | Hintergrund | Text | Cards | Akzent |
|---|---|---|---|---|
| **Dark** (Standard) | `#0a0a0a` | `#f5f5f5` | `#1a1a1a` | frei wählbar |
| **Light** | `#fafafa` | `#111827` | `#ffffff` | frei wählbar |
| **Colorful** | Gradient (Akzentfarbe) | `#ffffff` | halbtransparent weiß | frei wählbar |

- Theme-Wahl wird als `theme`-Feld in der JSON gespeichert (`"dark"`, `"light"`, `"colorful"`)
- `template.html` bekommt 3 CSS-Variablen-Sets, aktiviert per `data-theme` Attribut auf `<html>`
- Akzentfarbe bleibt unabhängig vom Theme frei wählbar
- Preview zeigt das gewählte Theme sofort

## Mehrsprachigkeit

Ansatz: **Eine JSON-Datei pro Sprache.** Gleiche Struktur, separater Inhalt.

```
pages/
  autophagie-fasten-de.json   → dist/de/autophagie-fasten/
  autophagie-fasten-en.json   → dist/en/autophagie-fasten/
```

- Kein Sprachumschalter im Admin-Panel nötig – einfach die gewünschte Sprachdatei laden
- `build.js` braucht minimal Anpassung – leitet `lang`-Feld an `<html lang="...">` weiter, Slug bestimmt den Ausgabepfad
- Sprachkürzel wird im Slug kodiert (z.B. `autophagie-fasten-en`)
- Template identisch, nur `<html lang="...">` variiert
- Sprachen können unabhängig voneinander erstellt werden

## Nicht im Scope (YAGNI)

- ~~Drag & Drop Sortierung~~ → Pfeile reichen
- ~~Bild-Upload~~ → Pfade manuell eingeben, Bilder separat in assets/ ablegen
- ~~Mehrbenutzer~~ → Stephan arbeitet alleine
- ~~Versionierung~~ → Git reicht
- ~~Inline-Editing~~ → Zu komplex, Formular-basiert reicht
- ~~Mobile-optimiert~~ → Desktop-first, Admin-Arbeit passiert am Laptop
- ~~Sprachen in einer JSON~~ → Zu komplex, separate Dateien pro Sprache reichen

## Open Questions

*Keine – alle Fragen wurden in der Brainstorm-Phase geklärt.*
