---
title: "feat: Bildergalerie-Block mit Lightbox"
type: feat
date: 2026-03-18
---

# Bildergalerie-Block mit Lightbox

## Overview

Neuer Inhaltsblock `gallery` im CMS. Mehrere Bilder als responsives Grid mit Lightbox-Navigation. Für Vereinshomepages: Event-Fotos, Mannschaftsbilder, Ausflüge etc. Folgt dem bestehenden Pattern (cards, timeline, videos).

## Proposed Solution

Array `gallery` im Sektions-Schema: `[{ src, caption }]`. Max 20 Bilder, WebP-Komprimierung, optional Bildunterschrift. CSS auto-fit Grid + Lightbox mit Vor/Zurück.

## Technical Approach

### Dateien und Änderungen

| Datei | Änderung |
|---|---|
| `template.html` | CSS für Gallery-Grid + Lightbox, HTML-Block, Lightbox-JS |
| `render.js` | Render-Logik für `{{#if this.gallery}}` Block |
| `admin.html` | Editor-UI (add/remove/update/sort), Bild-Upload, Defaults |
| `prompt.js` | Gallery in Schema + von KI-Generierung ausschließen |
| `sync-template.js` | Ausführen nach template.html-Änderung |

### Phase 1: template.html -- CSS + HTML + Lightbox-JS

#### CSS (nach `.badge-custom`, ~Zeile 250)

```css
/* ---- GALLERY ---- */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem; margin-top: 2rem;
}
.gallery-item {
  aspect-ratio: 4/3; overflow: hidden; border-radius: var(--radius);
  cursor: pointer; position: relative;
  border: 1px solid var(--border);
  transition: transform .25s ease, box-shadow .25s ease;
}
.gallery-item:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
.gallery-item img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform .3s;
}
.gallery-item:hover img { transform: scale(1.05); }
.gallery-caption {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,.7));
  color: #fff; font-size: .8rem; padding: .5rem .75rem;
  opacity: 0; transition: opacity .3s;
}
.gallery-item:hover .gallery-caption { opacity: 1; }

/* ---- LIGHTBOX ---- */
.lightbox-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,.92);
  display: none; align-items: center; justify-content: center;
  flex-direction: column;
}
.lightbox-overlay.active { display: flex; }
.lightbox-overlay img {
  max-width: 90vw; max-height: 80vh; object-fit: contain;
  border-radius: 8px;
}
.lightbox-caption {
  color: #fff; font-size: .9rem; margin-top: .75rem;
  max-width: 90vw; text-align: center;
}
.lightbox-close {
  position: absolute; top: 1rem; right: 1.5rem;
  background: none; border: none; color: #fff;
  font-size: 2rem; cursor: pointer; opacity: .7;
  transition: opacity .2s;
}
.lightbox-close:hover { opacity: 1; }
.lightbox-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  background: rgba(255,255,255,.1); border: none; color: #fff;
  font-size: 2rem; padding: .5rem 1rem; cursor: pointer;
  border-radius: 8px; opacity: .7; transition: opacity .2s;
}
.lightbox-nav:hover { opacity: 1; background: rgba(255,255,255,.2); }
.lightbox-prev { left: 1rem; }
.lightbox-next { right: 1rem; }
```

#### HTML (nach Videos `{{/if}}`, ~Zeile 353)

```handlebars
{{#if this.gallery}}
<div class="gallery-grid" data-gallery>
  {{#each this.gallery}}
  <div class="gallery-item" onclick="openLightbox(this)">
    <img src="{{this.src}}" alt="{{this.caption}}" loading="lazy">
    {{#if this.caption}}<div class="gallery-caption">{{this.caption}}</div>{{/if}}
  </div>
  {{/each}}
</div>
{{/if}}
```

#### Lightbox HTML + JS (dynamisch per JS erstellt, kein statisches HTML nötig)

Die Lightbox wird **nicht** statisch in template.html eingefügt, sondern vom Lightbox-JS bei Bedarf erstellt. So haben Seiten ohne Galerie kein überflüssiges HTML.

#### Lightbox JS (im bestehenden `<script>` Block, nach IntersectionObserver)

```javascript
// ---- Lightbox (erstellt DOM bei erstem Aufruf) ----
let lbItems = [], lbIndex = 0, lbOverlay = null;
function ensureLightbox() {
  if (lbOverlay) return;
  lbOverlay = document.createElement('div');
  lbOverlay.className = 'lightbox-overlay';
  lbOverlay.innerHTML = '<button class="lightbox-close" onclick="closeLightbox()">&times;</button>' +
    '<button class="lightbox-nav lightbox-prev" onclick="navLightbox(-1)">&#8249;</button>' +
    '<button class="lightbox-nav lightbox-next" onclick="navLightbox(1)">&#8250;</button>' +
    '<img id="lightboxImg" src="" alt="">' +
    '<div class="lightbox-caption" id="lightboxCaption"></div>';
  lbOverlay.addEventListener('click', function(e) { if (e.target === lbOverlay) closeLightbox(); });
  document.body.appendChild(lbOverlay);
}
function openLightbox(el) {
  ensureLightbox();
  const grid = el.closest('[data-gallery]');
  lbItems = Array.from(grid.querySelectorAll('.gallery-item'));
  lbIndex = lbItems.indexOf(el);
  showLightboxImage();
  lbOverlay.classList.add('active');
  document.addEventListener('keydown', lbKeyHandler);
}
function closeLightbox() {
  if (lbOverlay) lbOverlay.classList.remove('active');
  document.removeEventListener('keydown', lbKeyHandler);
}
function navLightbox(dir) {
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  showLightboxImage();
}
function showLightboxImage() {
  const img = lbItems[lbIndex].querySelector('img');
  const cap = lbItems[lbIndex].querySelector('.gallery-caption');
  document.getElementById('lightboxImg').src = img.src;
  document.getElementById('lightboxCaption').textContent = cap ? cap.textContent : '';
}
function lbKeyHandler(e) {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
}
```

### Phase 2: render.js -- Gallery-Block Rendering

Nach Videos-Block (~Zeile 160), vor Warning-Block:

```javascript
// Gallery
s = s.replace(/\{\{#if this\.gallery\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
  if (!section.gallery) return '';
  const gMatch = content.match(/\{\{#each this\.gallery\}\}([\s\S]*?)\{\{\/each\}\}/);
  if (!gMatch) return content;
  const gHtml = section.gallery.map(item => {
    let itemHtml = gMatch[1]
      .replace(/\{\{this\.src\}\}/g, item.src || '')
      .replace(/\{\{this\.caption\}\}/g, item.caption || '');
    // Caption-Conditional innerhalb des each
    itemHtml = itemHtml.replace(/\{\{#if this\.caption\}\}([\s\S]*?)\{\{\/if\}\}/g,
      item.caption ? '$1' : '');
    return itemHtml;
  }).join('\n');
  return content.replace(gMatch[0], gHtml);
});
```

### Phase 3: admin.html -- Editor-Funktionen

#### 3a. Defaults (3 Stellen)

**addSection()** (~Zeile 1441): `gallery: []` hinzufügen

**restoreAutosave()** (~Zeile 1415): `gallery: []` in Section-Defaults

**importJSON()** (~Zeile 2031): `gallery: []` in Section-Defaults

#### 3b. CRUD-Funktionen (nach Videos, ~Zeile 1601)

```javascript
// ---- Gallery ----
function addGalleryImage(idx) {
  if (!pageData.sections[idx].gallery) pageData.sections[idx].gallery = [];
  if (pageData.sections[idx].gallery.length >= 20) {
    alert('Maximal 20 Bilder pro Galerie.');
    return;
  }
  pageData.sections[idx].gallery.push({ src: '', caption: '' });
  renderSectionBody(idx);
  scheduleAutosave();
}

function removeGalleryImage(sIdx, gIdx) {
  pageData.sections[sIdx].gallery.splice(gIdx, 1);
  renderSectionBody(sIdx);
  scheduleAutosave();
}

function updateGalleryImage(sIdx, gIdx, field, value) {
  if (!pageData.sections[sIdx].gallery[gIdx]) return;
  pageData.sections[sIdx].gallery[gIdx][field] = value;
  scheduleAutosave();
}

function moveGalleryImage(sIdx, gIdx, dir) {
  var arr = pageData.sections[sIdx].gallery;
  var newIdx = gIdx + dir;
  if (newIdx < 0 || newIdx >= arr.length) return;
  var tmp = arr[gIdx];
  arr[gIdx] = arr[newIdx];
  arr[newIdx] = tmp;
  renderSectionBody(sIdx);
  scheduleAutosave();
}

function pickGalleryImage(sIdx, gIdx) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(e) { handleGalleryImagePick(sIdx, gIdx, e); };
  input.click();
}

async function handleGalleryImagePick(sIdx, gIdx, event) {
  var file = event.target.files[0];
  if (!file) return;
  var dataUrl = await compressImage(file);
  pageData.sections[sIdx].gallery[gIdx].src = dataUrl;
  var thumb = document.getElementById('galThumb-' + sIdx + '-' + gIdx);
  if (thumb) { thumb.src = dataUrl; thumb.style.display = 'block'; }
  var urlInput = document.getElementById('galUrl-' + sIdx + '-' + gIdx);
  if (urlInput) urlInput.value = file.name;
  scheduleAutosave();
}
```

#### 3c. renderSectionBody() -- Galerie-UI (nach Videos, ~Zeile 1941)

```javascript
// ---- Galerie ----
'<div class="block-header" style="margin-top:1.5rem">' +
  '<span style="font-weight:600;font-size:.85rem">Galerie</span>' +
  '<button class="btn btn-sm" onclick="addGalleryImage(' + idx + ')" style="margin-left:auto">' +
    '+ Bild hinzufügen (' + (s.gallery || []).length + '/20)</button>' +
'</div>' +
(s.gallery || []).map(function(g, gi) {
  return '<div class="list-item" style="align-items:flex-start">' +
    '<img id="galThumb-' + idx + '-' + gi + '" src="' + (g.src && g.src.startsWith('data:') ? g.src : '') + '"' +
    ' style="width:60px;height:45px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;' +
    (g.src && g.src.startsWith('data:') ? '' : 'display:none;') + '">' +
    '<div class="list-fields">' +
      '<div style="display:flex;gap:.3rem;align-items:center">' +
        '<button type="button" class="btn btn-sm" onclick="pickGalleryImage(' + idx + ',' + gi + ')" ' +
          'style="padding:.2rem .5rem;font-size:.75rem">Datei</button>' +
        '<input type="text" id="galUrl-' + idx + '-' + gi + '" value="' + esc(g.src && !g.src.startsWith('data:') ? g.src : (g.src ? 'Bild hochgeladen' : '')) + '"' +
          ' placeholder="URL oder Datei wählen" oninput="updateGalleryImage(' + idx + ',' + gi + ',\'src\',this.value)">' +
      '</div>' +
      '<input type="text" value="' + esc(g.caption || '') + '" placeholder="Bildunterschrift (optional)"' +
        ' oninput="updateGalleryImage(' + idx + ',' + gi + ',\'caption\',this.value)">' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:.15rem">' +
      '<button class="btn btn-icon btn-sm" onclick="moveGalleryImage(' + idx + ',' + gi + ',-1)" title="Nach oben">↑</button>' +
      '<button class="btn btn-icon btn-sm" onclick="moveGalleryImage(' + idx + ',' + gi + ',1)" title="Nach unten">↓</button>' +
    '</div>' +
    '<button class="btn btn-icon btn-sm btn-danger" onclick="removeGalleryImage(' + idx + ',' + gi + ')">&#128465;</button>' +
  '</div>';
}).join('') +
```

#### 3d. exportJSON() -- Cleanup (~Zeile 1993, nach Videos)

```javascript
if (s.gallery && s.gallery.length && s.gallery.some(function(g) { return g.src; })) {
  clean.gallery = s.gallery.filter(function(g) { return g.src; });
}
```

### Phase 4: prompt.js -- Schema + KI-Ausschluss

#### JSON_SCHEMA (~Zeile 140, nach warning)

Nicht nötig -- Gallery wird nicht von der KI generiert. Kein Schema-Eintrag.

#### buildPrompt() (~Zeile 57, nach "Keine Videos")

```
- Keine gallery/Bildergalerie generieren (Bilder kommen vom User).
```

#### validateAndFix() (~Zeile 187, nach videos cleanup)

```javascript
if (s.gallery && s.gallery.length === 0) delete s.gallery;
```

### Phase 5: Sync + Test

1. `node sync-template.js` -- Embedded Template aktualisieren
2. `node build.js` -- Bestehende Seiten bauen (Backward Compatibility)
3. Test: Galerie im Editor anlegen, Bilder hochladen, Vorschau prüfen
4. Test: Lightbox öffnen, navigieren, schließen (Klick, Escape, Pfeiltasten)
5. Test: JSON exportieren/importieren mit Gallery-Daten
6. Test: Seite ohne Gallery baut weiter korrekt

## Acceptance Criteria

### Funktional

- [x] "Galerie" Block im Editor sichtbar mit [+ Bild hinzufügen]-Button
- [x] Bilder per Datei-Upload (WebP-Komprimierung) oder URL hinzufügbar
- [x] Optionale Bildunterschrift pro Bild
- [x] Bilder sortierbar per ↑↓ Buttons
- [x] Bilder löschbar per 🗑️ Button
- [x] Max 20 Bilder pro Galerie (Warnung bei Überschreitung)
- [x] Vorschau-Thumbnail im Editor nach Upload
- [x] Grid-Darstellung auf der generierten Seite (auto-fit, min 200px)
- [x] Aspect-Ratio 4/3 + object-fit cover im Grid
- [x] Lightbox öffnet bei Klick auf Bild
- [x] Lightbox: Vor/Zurück Navigation (Pfeile + Tasten)
- [x] Lightbox: Schließen per × Button, Escape, Klick auf Hintergrund
- [x] Lightbox: Caption wird angezeigt (wenn vorhanden)
- [x] JSON-Export enthält `gallery` Array
- [x] JSON-Import lädt `gallery` korrekt
- [x] Autosave erfasst Gallery-Änderungen
- [x] `node build.js` rendert Galerie korrekt

### Robustheit

- [x] Bestehende Seiten ohne Gallery bauen weiter korrekt
- [x] Leere Gallery-Arrays werden im Export entfernt
- [x] KI-Generator erzeugt keine Gallery-Blöcke
- [x] Embedded Template via `sync-template.js` synchronisiert
- [x] Bilder mit unterschiedlichen Seitenverhältnissen sehen im Grid gleichmäßig aus

## Implementation Phases

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
template.html  render.js   admin.html   prompt.js   Sync +
(CSS, HTML,    (Gallery-   (CRUD, UI,   (Ausschluss Test
 Lightbox-JS)  Rendering)  Export/Import) Cleanup)
```

## References

### Brainstorm
- `docs/brainstorms/2026-03-18-bildergalerie-brainstorm.md`

### Interne Referenzen
- Videos-Block CSS: `template.html:217-250`
- Videos-Block HTML: `template.html:337-353`
- Videos Render-Logik: `render.js:146-160`
- Videos Editor-UI: `admin.html:1913-1941`
- Video CRUD: `admin.html:1575-1601`
- Bild-Komprimierung: `admin.html:1715-1732` (compressImage)
- Bild-Upload: `admin.html:1750-1763` (pickImage, handleImagePick)
- Section Defaults: `admin.html:1434-1446` (addSection)
- Import Defaults: `admin.html:2021-2035` (importJSON)
- Export Cleanup: `admin.html:1978-1997` (exportJSON)
- IntersectionObserver: `template.html:370-373`
