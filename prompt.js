/**
 * Steph's Universe CMS - Shared Prompt & Validation for KI-Generator
 * Used by server.js and generate.js
 */

// ---- Varianten-Matrix ----
const VARIANT_MATRIX = [
  { theme: 'dark',     tone: 'seriös und professionell', focus: 'Cards + Timeline' },
  { theme: 'light',    tone: 'locker und freundlich',    focus: 'Text-Absätze + Zitate' },
  { theme: 'colorful', tone: 'emotional und einladend',  focus: 'Cards + Hinweise' },
  { theme: 'dark',     tone: 'technisch und detailliert', focus: 'Timeline + Text-Absätze' },
  { theme: 'light',    tone: 'kreativ und verspielt',    focus: 'Cards + Zitate' },
];

// ---- Accent-Farben pro Theme ----
const THEME_COLORS = {
  dark:     '#10b981',
  light:    '#0d9488',
  colorful: '#8b5cf6',
};

// ---- Prompt-Builder ----
function buildPrompt(description, variantIndex) {
  const variant = VARIANT_MATRIX[variantIndex % VARIANT_MATRIX.length];

  return {
    system: `Du bist ein Webdesign-Content-Generator. Du erstellst vollständige JSON-Dateien für ein CMS.

REGELN:
- Antworte NUR mit validem JSON. Kein Markdown, keine Erklärungen.
- Verwende das exakte Schema unten.
- Erstelle 4-6 Sektionen mit sinnvollem Inhalt passend zur Beschreibung.
- Theme: "${variant.theme}"
- Schreibstil: ${variant.tone}
- Sektions-Fokus: Nutze bevorzugt ${variant.focus}
- Sprache: Erkenne die Sprache der Beschreibung und schreibe in dieser Sprache.
- Card-Icons: Verwende passende Emojis (z.B. 🔬 💪 ⏰ 📋).
- section.id: Nur lowercase a-z, 0-9, Bindestrich. Keine Leerzeichen.
- heroTitle: Darf <br> für Zeilenumbruch enthalten.
- paragraphs: Dürfen <strong>, <em>, <a href="..."> enthalten.
- footerText: Verwende HTML-Entities: &copy; 2026 &middot; [Firmenname]
- heroBg: Leer lassen (wird manuell gesetzt).
- Keine Videos generieren (videos-Array leer lassen oder weglassen).

JSON-SCHEMA:
{
  "slug": "url-pfad-lowercase",
  "title": "Seitentitel",
  "accentColor": "#hexfarbe",
  "theme": "dark|light|colorful",
  "heroBg": "",
  "heroBadge": "Badge-Text",
  "heroTitle": "Großer Titel",
  "heroSubtitle": "Kurze Beschreibung",
  "ctaText": "Button-Text",
  "footerText": "&copy; 2026 ...",
  "sections": [
    {
      "id": "section-id",
      "navLabel": "Nav-Text",
      "label": "KATEGORIE",
      "title": "Sektions-Titel",
      "paragraphs": ["Text..."],
      "cards": [{"icon": "emoji", "title": "Titel", "text": "Text"}],
      "timeline": [{"time": "Zeitpunkt", "text": "Beschreibung"}],
      "quote": {"text": "Zitat", "cite": "Quelle"},
      "warning": {"title": "Hinweis:", "text": "Warnungstext"}
    }
  ]
}

Nur Blöcke einfügen die Sinn ergeben. Leere Arrays/Objekte weglassen.`,

    user: `Erstelle eine komplette Homepage für:\n\n${description}\n\nTheme: ${variant.theme}\nAkzentfarbe: ${THEME_COLORS[variant.theme] || '#10b981'}`
  };
}

// ---- JSON-Schema für Claude tool_use ----
const JSON_SCHEMA = {
  type: 'object',
  properties: {
    slug: { type: 'string', description: 'URL-Pfad, lowercase, nur a-z/0-9/-' },
    title: { type: 'string', description: 'Browser-Tab-Titel' },
    accentColor: { type: 'string', description: 'Hex-Farbe z.B. #10b981' },
    theme: { type: 'string', enum: ['dark', 'light', 'colorful'] },
    heroBg: { type: 'string', description: 'Leer lassen' },
    heroBadge: { type: 'string' },
    heroTitle: { type: 'string', description: 'Darf <br> enthalten' },
    heroSubtitle: { type: 'string' },
    ctaText: { type: 'string' },
    footerText: { type: 'string', description: 'HTML mit &copy; etc.' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          navLabel: { type: 'string' },
          label: { type: 'string' },
          title: { type: 'string' },
          paragraphs: { type: 'array', items: { type: 'string' } },
          cards: { type: 'array', items: {
            type: 'object',
            properties: {
              icon: { type: 'string' },
              title: { type: 'string' },
              text: { type: 'string' }
            }, required: ['icon', 'title', 'text']
          }},
          timeline: { type: 'array', items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              text: { type: 'string' }
            }, required: ['time', 'text']
          }},
          quote: { type: 'object', properties: {
            text: { type: 'string' },
            cite: { type: 'string' }
          }},
          warning: { type: 'object', properties: {
            title: { type: 'string' },
            text: { type: 'string' }
          }}
        },
        required: ['id', 'navLabel', 'label', 'title']
      }
    }
  },
  required: ['slug', 'title', 'accentColor', 'theme', 'sections']
};

// ---- JSON-Validierung + Sanitize ----
function validateAndFix(data) {
  const errors = [];

  if (!data || typeof data !== 'object') return { errors: ['Kein JSON-Objekt'], data: null };
  if (!data.slug) errors.push('slug fehlt');
  if (!data.title) errors.push('title fehlt');
  if (!data.sections || !Array.isArray(data.sections)) errors.push('sections fehlt');
  if (data.theme && !['dark', 'light', 'colorful'].includes(data.theme)) data.theme = 'dark';
  if (data.accentColor && !/^#[0-9a-fA-F]{6}$/.test(data.accentColor)) data.accentColor = '#10b981';

  // Slug sanitize
  if (data.slug) data.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // Defaults für fehlende Felder
  if (!data.heroBg) data.heroBg = '';
  if (!data.ctaText) data.ctaText = 'Mehr erfahren';
  if (!data.footerText) data.footerText = '&copy; 2026';

  // accentLight berechnen
  if (data.accentColor) data.accentLight = lightenHex(data.accentColor, 40);

  // Icon-Defaults
  data.iconUrl = data.iconUrl || 'assets/icon.png';
  data.iconLink = data.iconLink || '';
  data.iconSize = data.iconSize || '46';
  data.cardIconSize = data.cardIconSize || '40';
  data.lang = data.lang || 'de';

  // Sektionen validieren
  if (data.sections) {
    data.sections.forEach((s, i) => {
      if (!s.id) errors.push('Section ' + (i + 1) + ': id fehlt');
      if (!s.navLabel) errors.push('Section ' + (i + 1) + ': navLabel fehlt');
      if (s.id) s.id = s.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      // Leere optionale Blöcke entfernen
      if (s.cards && s.cards.length === 0) delete s.cards;
      if (s.timeline && s.timeline.length === 0) delete s.timeline;
      if (s.paragraphs && s.paragraphs.length === 0) delete s.paragraphs;
      if (s.videos && s.videos.length === 0) delete s.videos;
      if (s.quote && !s.quote.text) delete s.quote;
      if (s.warning && !s.warning.text) delete s.warning;
    });
  }

  return { errors, data };
}

// ---- Farbe aufhellen (HSL) ----
function lightenHex(hex, amount) {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return '#' + hex;
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  l = Math.min(1, l + amount / 100);
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  g = Math.round(hue2rgb(p, q, h) * 255);
  b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// ---- JSON aus API-Response extrahieren ----
function extractJSON(raw) {
  if (typeof raw === 'object') return raw;
  let cleaned = String(raw).trim();
  // Markdown-Fences entfernen
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

module.exports = { buildPrompt, JSON_SCHEMA, VARIANT_MATRIX, validateAndFix, lightenHex, extractJSON };
