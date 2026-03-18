---
title: "Bildergalerie-Block für Vereinshomepages"
date: 2026-03-18
status: decided
---

# Bildergalerie-Block (gallery)

## Was wir bauen

Ein neuer Inhaltsblock `gallery` für das CMS, der mehrere Bilder als responsives Grid mit Lightbox anzeigt. Hauptzielgruppe: Vereinshomepages (Events, Mannschaften, Ausflüge, Veranstaltungen).

## Warum

Das CMS hat aktuell keinen Weg, mehrere Bilder zusammen darzustellen. Das bestehende "Bild" ist nur ein einzelnes Sektions-Kopfbild. Vereine brauchen Fotogalerien -- das ist eines der häufigsten Features auf Vereinswebsites.

## Gewählter Ansatz

Neuer Block `gallery` als Array von Bild-Objekten im bestehenden Sektions-Schema. Folgt dem gleichen Pattern wie `cards`, `timeline`, `videos`.

### JSON-Struktur

```json
{
  "gallery": [
    { "src": "data:image/webp;base64,...", "caption": "Sommerfest 2026" },
    { "src": "data:image/webp;base64,...", "caption": "" },
    { "src": "https://example.com/bild.jpg" }
  ]
}
```

- `src`: Base64-Data-URL (Upload) oder externe URL
- `caption`: Optionale Bildunterschrift (kann leer sein oder weggelassen werden)

## Key Decisions

| Frage | Entscheidung | Begründung |
|---|---|---|
| Lightbox | Mit Navigation (Vor/Zurück) | Bessere UX beim Durchblättern von Event-Fotos |
| Captions | Optional pro Bild | Flexibel -- manche Bilder brauchen Beschriftung, manche nicht |
| Grid-Layout | CSS auto-fit (min 200px), aspect-ratio 4/3 + object-fit cover | Gleichmäßiges Grid auch bei unterschiedlichen Bildformaten |
| Galerie-Titel | Sektionstitel reicht | Kein extra Feld nötig, YAGNI |
| Max Bilder | 20 pro Galerie | Bei WebP ~50-100KB/Bild = max ~2MB. Schützt vor riesigen JSONs |
| Bildformat | WebP (wie bestehend) | Bestehende `compressImage()` Funktion wiederverwenden |
| Feldname | `gallery` | Konsistent mit `cards`, `timeline`, `videos` (Plural, lowercase) |
| Galerien pro Sektion | Eine | Für mehrere Galerien: separate Sektionen anlegen |
| KI-Generator | Generiert keine Galerien | Bilder kommen vom User, nicht von der KI |
| Lightbox-JS | Inline in template.html | Generierte Seiten haben bereits IntersectionObserver-JS. Lightbox-JS (~30 Zeilen) passt dazu. |

## Lightbox-Verhalten

- Klick auf Bild öffnet Vollbild-Overlay (dunkler Hintergrund)
- Vor/Zurück-Pfeile zum Navigieren (← →)
- Tastatur: Pfeiltasten + Escape zum Schließen
- Klick auf Hintergrund schließt Lightbox
- Caption wird unter dem Bild angezeigt (wenn vorhanden)
- Kein externes Library -- reines CSS + minimales JS (~30 Zeilen inline in template.html)

## Editor-UI

- Block-Header "Galerie" mit [+ Bild hinzufügen]-Button
- Pro Bild: Vorschau-Thumbnail + [Datei]-Button + URL-Eingabe + Caption-Feld + [Löschen]
- Sortierung per Pfeil-Buttons (↑↓), konsistent mit Sektionen. Kein Drag & Drop.
- Warnung bei >20 Bildern
- Bestehende `compressImage()` und `readFileAsDataUrl()` Funktionen wiederverwenden

## Open Questions

Keine -- alle Fragen geklärt.

## Referenzen

- Bestehendes Bild-Upload-Pattern: `admin.html` (compressImage, handleImagePick)
- Cards-Block als Struktur-Vorlage: `admin.html` (addCard, removeCard, updateCard, renderSectionBody)
- Template-Rendering: `template.html` + `render.js` ({{#each}}/{{#if}} Pattern)
