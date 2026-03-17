---
title: "feat: Emoji-Grid-Picker für Card-Icons + globale Icon-Größe"
type: feat
date: 2026-03-17
---

# Emoji-Grid-Picker für Card-Icons + globale Icon-Größe

## Overview

Emoji-Grid-Picker als kategorisiertes Popup im Admin-Panel, mit dem Stephan Card-Icons aus einem vordefinierten Set auswählen kann. Zusätzlich ein globales Größenfeld (`cardIconSize`) in den Seiten-Einstellungen, das alle Card-Icons auf der Seite einheitlich skaliert.

## Proposed Solution

### 1. Emoji-Grid-Picker

Ein Singleton-Popup auf `document.body` mit 176 Emojis in 11 Kategorien (je 16). Wird einmalig erstellt, dann per Klasse ein-/ausgeblendet. `position: fixed` mit Viewport-Clamping. Größe: 420x520px.

**Kategorien (jeweils 16 Emojis):**

| Kategorie | Emojis |
|---|---|
| Wissenschaft | 🔬 🧬 🧪 🔭 📊 📈 📉 🧠 💊 🏥 |
| Gesundheit | ❤️ 💪 🫀 🩺 🧘 🏃 💤 🌡️ 🩸 🦷 |
| Ernährung | 🥗 🍎 🥦 🍽️ 🥤 🍵 💧 🧃 🥛 🍯 |
| Natur | 🌿 🌱 🍀 🌳 🌊 ☀️ 🌙 ⭐ 🔥 ❄️ |
| Zeit & Prozess | ⏰ ⏱️ 📅 🔄 ⚡ 🚀 📌 🎯 ✅ ⏳ |
| Objekte | 📋 📖 🔑 🛡️ 🔔 💡 🔧 🏠 📦 🎁 |
| Symbole | ⚙️ ⚠️ ℹ️ ❓ ✨ 💫 🔗 📎 🏷️ 🔒 |
| Personen & Aktivität | 🚶 👤 👥 🤝 👨‍⚕️ 👩‍🔬 🧑‍🍳 📝 🗣️ 👁️ |

**UI-Verhalten:**
- Singleton-DOM auf `document.body` (einmalig erstellt, wiederverwendet)
- `position: fixed` mit `getBoundingClientRect()` Viewport-Clamping
- Klick auf Emoji → Callback feuert, Picker schließt sich
- Click-Outside via `mousedown` + `requestAnimationFrame` (robuster als setTimeout)
- Escape → Picker schließt sich
- Scroll/Resize → Picker schließt sich
- `renderSectionBody()` Guard → schließt Picker vor DOM-Zerstörung

### 2. Globale Card-Icon-Größe

Ein `<input type="number">` in den Seiten-Einstellungen, Feldname `cardIconSize`.

**Entscheidungen:**

| Frage | Entscheidung | Begründung |
|---|---|---|
| Feldname | `cardIconSize` | Parallel zu bestehendem `iconSize` (Nav-Icon) |
| Default | `40` | Entspricht aktuellem Hardcoded-Wert (40x40px) |
| Min/Max | 20–80 | 20px = kleinstes erkennbares Emoji, 80px = max vor Card-Overflow |
| font-size Formel | `calc({{cardIconSize}}px * 0.6)` | Bei 40px → 24px. Valides CSS (CSS Values Level 4) |
| border-radius Formel | `calc({{cardIconSize}}px * 0.25)` | Bei 40px → 10px (entspricht aktuellem Wert) |
| Scope | Global (top-level pageData) | Einheitliche Optik, einfacher als per-Sektion |
| Platzierung im Editor | Neben `iconSize` in Seiten-Einstellungen | Gruppierung aller Größen-Einstellungen |

**CSS-Pattern:**

```css
.card-icon {
  width: {{cardIconSize}}px; height: {{cardIconSize}}px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(16,185,129,.08);
  border-radius: calc({{cardIconSize}}px * 0.25);
  font-size: calc({{cardIconSize}}px * 0.6);
  flex-shrink: 0;
}
```

## Technical Approach

### Dateien und Änderungen

#### render.js (~3 Zeilen)

```javascript
// Zeile ~12, nach iconSize default:
if (!data.cardIconSize || isNaN(Number(data.cardIconSize)) || Number(data.cardIconSize) < 16) {
  data.cardIconSize = '40';
}
```

#### template.html (6 Zeilen)

`.card-icon` CSS von hardcoded auf `{{cardIconSize}}`-basiert ändern:

```css
.card-icon {
  width: {{cardIconSize}}px; height: {{cardIconSize}}px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(16,185,129,.08);
  border-radius: calc({{cardIconSize}}px * 0.25);
  font-size: calc({{cardIconSize}}px * 0.6);
  flex-shrink: 0;
}
```

#### admin.html – Daten & Settings

1. **pageData defaults** (~Zeile 372): `cardIconSize: '40'` hinzufügen
2. **Import merge defaults** (~Zeile 1108): `cardIconSize: '40'` hinzufügen
3. **Settings UI** (neben iconSize ~Zeile 311): Neues Feld:

```html
<div class="field">
  <label>Card-Icon-Größe (px)</label>
  <input type="number" data-field="cardIconSize" placeholder="40" min="20" max="80" style="max-width:100px">
</div>
```

#### admin.html – Emoji-Picker CSS

```css
/* ---- EMOJI PICKER ---- */
.emoji-picker {
  position: fixed; z-index: 200;
  width: 320px; max-height: 360px; overflow-y: auto;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: .75rem;
  box-shadow: 0 12px 40px rgba(0,0,0,.5);
  opacity: 0; visibility: hidden; transform: translateY(-4px);
  transition: opacity .12s, transform .12s, visibility .12s;
  scrollbar-color: rgba(255,255,255,.15) transparent; scrollbar-width: thin;
}
.emoji-picker::-webkit-scrollbar { width: 6px; }
.emoji-picker::-webkit-scrollbar-track { background: transparent; }
.emoji-picker::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
.emoji-picker.visible { opacity: 1; visibility: visible; transform: translateY(0); }
.emoji-picker-cat { font-size: .65rem; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: .05em; margin: .5rem 0 .25rem; }
.emoji-picker-cat:first-child { margin-top: 0; }
.emoji-picker-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; }
.emoji-picker-grid button { background: none; border: 2px solid transparent;
  font-size: 1.3rem; padding: .25rem; border-radius: 6px; cursor: pointer;
  transition: background 32ms; display: flex; align-items: center; justify-content: center; }
.emoji-picker-grid button:hover { background: rgba(255,255,255,.08); }
.emoji-picker-grid button:focus-visible { outline: none; border-color: var(--accent); }
```

#### admin.html – Emoji-Picker JS (Singleton-Pattern)

```javascript
const EMOJI_SET = [
  { cat: 'Wissenschaft', icons: ['🔬','🧬','🧪','🔭','📊','📈','📉','🧠','💊','🏥'] },
  { cat: 'Gesundheit',   icons: ['❤️','💪','🫀','🩺','🧘','🏃','💤','🌡️','🩸','🦷'] },
  { cat: 'Ernährung',    icons: ['🥗','🍎','🥦','🍽️','🥤','🍵','💧','🧃','🥛','🍯'] },
  { cat: 'Natur',        icons: ['🌿','🌱','🍀','🌳','🌊','☀️','🌙','⭐','🔥','❄️'] },
  { cat: 'Zeit & Prozess', icons: ['⏰','⏱️','📅','🔄','⚡','🚀','📌','🎯','✅','⏳'] },
  { cat: 'Objekte',      icons: ['📋','📖','🔑','🛡️','🔔','💡','🔧','🏠','📦','🎁'] },
  { cat: 'Symbole',      icons: ['⚙️','⚠️','ℹ️','❓','✨','💫','🔗','📎','🏷️','🔒'] },
  { cat: 'Personen',     icons: ['🚶','👤','👥','🤝','👨‍⚕️','👩‍🔬','🧑‍🍳','📝','🗣️','👁️'] },
];

let emojiPickerBuilt = false;
let emojiPickerCallback = null;
let emojiTriggerEl = null;

function ensureEmojiPicker() {
  if (emojiPickerBuilt) return;
  emojiPickerBuilt = true;
  const picker = document.createElement('div');
  picker.id = 'emojiPicker';
  picker.className = 'emoji-picker';
  EMOJI_SET.forEach(cat => {
    const label = document.createElement('div');
    label.className = 'emoji-picker-cat';
    label.textContent = cat.cat;
    picker.appendChild(label);
    const grid = document.createElement('div');
    grid.className = 'emoji-picker-grid';
    cat.icons.forEach(emoji => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = emoji;
      b.onclick = () => {
        if (emojiPickerCallback) emojiPickerCallback(emoji);
        closeEmojiPicker();
      };
      grid.appendChild(b);
    });
    picker.appendChild(grid);
  });
  document.body.appendChild(picker);
}

function openEmojiPicker(sIdx, cIdx, btn) {
  closeEmojiPicker();
  ensureEmojiPicker();
  const picker = document.getElementById('emojiPicker');

  // Callback: aktualisiert Card-Daten und Input-Feld
  emojiPickerCallback = (emoji) => {
    const section = pageData.sections[sIdx];
    if (!section || !section.cards || !section.cards[cIdx]) return;
    updateCard(sIdx, cIdx, 'icon', emoji);
    const input = document.getElementById('cardIcon-' + sIdx + '-' + cIdx);
    if (input) input.value = emoji;
  };
  emojiTriggerEl = btn;

  // Position: fixed + Viewport-Clamping
  const rect = btn.getBoundingClientRect();
  const pw = 320, ph = 360, m = 8;
  let top = rect.bottom + m, left = rect.left;
  if (left + pw > window.innerWidth - m) left = window.innerWidth - pw - m;
  if (left < m) left = m;
  if (top + ph > window.innerHeight - m) top = rect.top - ph - m;
  if (top < m) top = m;
  picker.style.left = left + 'px';
  picker.style.top = top + 'px';
  picker.classList.add('visible');

  // Click-Outside via mousedown + rAF (robust)
  requestAnimationFrame(() => {
    document.addEventListener('mousedown', emojiOutsideClick);
  });
  document.addEventListener('keydown', emojiEscapeHandler);
  window.addEventListener('scroll', closeEmojiPicker, true);
  window.addEventListener('resize', closeEmojiPicker);
}

function closeEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  if (picker) picker.classList.remove('visible');
  document.removeEventListener('mousedown', emojiOutsideClick);
  document.removeEventListener('keydown', emojiEscapeHandler);
  window.removeEventListener('scroll', closeEmojiPicker, true);
  window.removeEventListener('resize', closeEmojiPicker);
  emojiPickerCallback = null;
  emojiTriggerEl = null;
}

function emojiOutsideClick(e) {
  const picker = document.getElementById('emojiPicker');
  if (picker && !picker.contains(e.target) &&
      (!emojiTriggerEl || !emojiTriggerEl.contains(e.target))) {
    closeEmojiPicker();
  }
}

function emojiEscapeHandler(e) {
  if (e.key === 'Escape') closeEmojiPicker();
}
```

**Kritischer Guard in renderSectionBody:**

```javascript
function renderSectionBody(idx) {
  // Picker schließen wenn er diese Sektion betrifft
  if (emojiTriggerEl) {
    const body = document.getElementById('sectionBody-' + idx);
    if (body && body.contains(emojiTriggerEl)) closeEmojiPicker();
  }
  // ... bestehender Code ...
}
```

#### admin.html – Card-Rendering (renderSectionBody)

Icon-Input bekommt eine ID und einen Picker-Button:

```html
<div style="display:flex;gap:.3rem;align-items:center">
  <input type="text" id="cardIcon-${idx}-${ci}" value="${esc(c.icon)}"
    placeholder="😀" style="max-width:50px;text-align:center;font-size:1.2rem"
    oninput="updateCard(${idx},${ci},'icon',this.value)">
  <button type="button" class="btn btn-sm" style="padding:.2rem .5rem;font-size:.75rem"
    onclick="openEmojiPicker(${idx},${ci},this)">☰</button>
</div>
```

#### sync-template.js

Nach template.html Änderung ausführen: `node sync-template.js`

## Acceptance Criteria

### Funktional

- [x] Emoji-Picker öffnet sich bei Klick auf ☰-Button neben dem Icon-Feld
- [x] 11 Kategorien mit je 16 Emojis werden im Grid angezeigt
- [x] Klick auf Emoji → Icon-Feld befüllt, Picker schließt sich
- [x] Klick außerhalb (mousedown) oder Escape → Picker schließt sich
- [x] Scroll/Resize → Picker schließt sich
- [x] Textfeld bleibt für manuelle Emoji-Eingabe nutzbar
- [x] `cardIconSize` Feld in Seiten-Einstellungen sichtbar (Default: 40)
- [x] Änderung von `cardIconSize` wirkt sich auf Vorschau aus
- [x] `node build.js` rendert Card-Icons in der konfigurierten Größe
- [x] JSON-Export enthält `cardIconSize` wenn gesetzt
- [x] JSON-Import lädt `cardIconSize` korrekt
- [x] Bestehende JSON-Dateien ohne `cardIconSize` funktionieren (Default 40)

### Robustheit (aus Reviews)

- [x] Singleton-Picker wird nur einmal erstellt (create-once, show/hide)
- [x] Picker auf `document.body` (kein Overflow-Clipping im Akkordeon)
- [x] `position: fixed` mit Viewport-Clamping (Flip oben wenn unten kein Platz)
- [x] renderSectionBody-Guard schließt Picker vor innerHTML-Zerstörung
- [x] selectEmoji validiert dass Ziel-Card noch existiert (Stale-Closure-Schutz)
- [x] NaN-Guard in render.js für cardIconSize
- [x] Scrollbar-Styling für Dark-Mode (scrollbar-color + webkit-Fallback)
- [x] Autosave erfasst `cardIconSize` und Emoji-Änderungen
- [x] Embedded Template via `sync-template.js` synchronisiert

## Implementation Phases

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
cardIconSize  Emoji-Picker  Sync +     Test
(render.js,   (CSS, JS,     Build      Roundtrip
 template,    renderBody,
 settings)    Guards)
```

## References

### Interne Referenzen

- Bestehendes iconSize-Pattern: `template.html:72`, `render.js:11`, `admin.html:311`
- Card-Rendering: `admin.html:961-977` (renderSectionBody)
- Card-CRUD: `admin.html:737-749` (addCard, removeCard, updateCard)
- Color-Picker-Pattern: `admin.html:280-293`
- Image-Picker-Pattern: `admin.html:826-856`
- Card-Icon CSS: `template.html:177-182`
- Embedded Template: `admin.html:~1392` (TEMPLATE_HTML)

### Research-Ergebnisse

- CSS calc() mit Template-Variablen: `calc(<length> * <number>)` ist valides CSS (CSS Values Level 4), universell unterstützt
- Popup-Positioning: `position: fixed` + `getBoundingClientRect()` vermeidet Stacking-Context-Probleme
- Click-Outside: `mousedown` + `requestAnimationFrame` robuster als `setTimeout(0)`
- Emoji-Rendering: Native Unicode-Emojis (kein Sprite/Font nötig), Stick to Unicode 13.0 oder früher
- DOM-Strategie: Create-once/show-hide für 176 Buttons (triviale Speicherkosten, schnelleres Öffnen)
- Scrollbar: `scrollbar-color` (Standard) + `::-webkit-scrollbar` (Safari-Fallback)
- Z-Index: Picker bei 200, über Sticky-Header (100)
