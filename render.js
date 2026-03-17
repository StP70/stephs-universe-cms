/**
 * Steph's Universe CMS - Shared Template Engine
 * Works in both Node.js (require) and Browser (<script src>)
 */
(function(exports) {

  exports.render = function render(tpl, data) {
    data.firstSectionId = data.sections[0]?.id || '';
    if (!data.theme) data.theme = 'dark';
    if (!data.lang) data.lang = 'de';
    if (!data.iconSize) data.iconSize = '46';
    if (!data.cardIconSize || isNaN(Number(data.cardIconSize)) || Number(data.cardIconSize) < 16) {
      data.cardIconSize = '40';
    }
    // Meta-Description: explizites Feld oder Fallback auf heroSubtitle
    // HTML-Tags entfernen, Anführungszeichen escapen (für content="...")
    if (!data.metaDescription) {
      data.metaDescription = (data.heroSubtitle || data.title || '')
        .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        .replace(/"/g, '&quot;');
    }

    let html = tpl;

    // 1. {{{key}}} raw HTML FIRST – skip {{{this}}} (used in loops)
    html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
      if (key === 'this') return `{{{${key}}}}`;
      return data[key] !== undefined ? data[key] : '';
    });

    // 2. Simple values: {{key}} – skip template keywords
    html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (key === 'this' || key === 'each' || key === 'if' || key === 'unless') return `{{${key}}}`;
      return data[key] !== undefined ? data[key] : '';
    });

    // 3. {{#if key}} ... {{/if}}
    html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
      return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (__, k) => data[k] || '') : '';
    });

    // 4. Process sections – find outer #each sections blocks (handles nesting)
    function findOuterEachSections(str) {
      const allMatches = [];
      const re = /\{\{#each sections\}\}/g;
      let m;
      while ((m = re.exec(str)) !== null) {
        const start = m.index;
        const contentStart = start + m[0].length;
        let depth = 1;
        let pos = contentStart;
        while (depth > 0 && pos < str.length) {
          const nextOpen = str.indexOf('{{#each', pos);
          const nextClose = str.indexOf('{{/each}}', pos);
          if (nextClose === -1) break;
          if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            pos = nextOpen + 7;
          } else {
            depth--;
            if (depth === 0) {
              allMatches.push({
                full: str.substring(start, nextClose + 9),
                content: str.substring(contentStart, nextClose),
                index: start
              });
            }
            pos = nextClose + 9;
          }
        }
      }
      return allMatches;
    }

    const sectionMatches = findOuterEachSections(html);
    const sectionMatch = sectionMatches.length > 1
      ? { 0: sectionMatches[1].full, 1: sectionMatches[1].content }
      : (sectionMatches[0] ? { 0: sectionMatches[0].full, 1: sectionMatches[0].content } : null);

    if (sectionMatch) {
      const sectionTpl = sectionMatch[1];
      const sectionsHtml = data.sections.map((section, idx) => {
        let s = sectionTpl;

        // @first
        s = s.replace(/\{\{#unless @first\}\}([\s\S]*?)\{\{\/unless\}\}/, (_, content) => {
          return idx === 0 ? '' : content;
        });

        // Process ALL block-level constructs FIRST (before simple field replacement)

        // Image conditional
        s = s.replace(/\{\{#if this\.image\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
          if (!section.image) return '';
          return content.replace(/\{\{this\.image\}\}/g, section.image).replace(/\{\{this\.title\}\}/g, section.title);
        });

        // Paragraphs
        s = s.replace(/\{\{#each this\.paragraphs\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, content) => {
          if (!section.paragraphs) return '';
          return section.paragraphs.map((p, pi) => {
            let c = content;
            c = c.replace(/\{\{\{this\}\}\}/g, p.replace(/\n/g, '<br>'));
            c = c.replace(/\{\{#unless @first\}\}([\s\S]*?)\{\{\/unless\}\}/g, (__, inner) => pi === 0 ? '' : inner);
            return c;
          }).join('\n');
        });

        // Quote
        s = s.replace(/\{\{#if this\.quote\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
          if (!section.quote) return '';
          return content
            .replace(/\{\{this\.quote\.text\}\}/g, section.quote.text || '')
            .replace(/\{\{this\.quote\.cite\}\}/g, section.quote.cite || '');
        });

        // Cards
        s = s.replace(/\{\{#if this\.cards\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
          if (!section.cards) return '';
          const cardMatch = content.match(/\{\{#each this\.cards\}\}([\s\S]*?)\{\{\/each\}\}/);
          if (!cardMatch) return content;
          const cardsHtml = section.cards.map(card => {
            return cardMatch[1]
              .replace(/\{\{this\.icon\}\}/g, card.icon)
              .replace(/\{\{this\.title\}\}/g, card.title)
              .replace(/\{\{this\.text\}\}/g, card.text);
          }).join('\n');
          return content.replace(cardMatch[0], cardsHtml);
        });

        // Timeline
        s = s.replace(/\{\{#if this\.timeline\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
          if (!section.timeline) return '';
          const tlMatch = content.match(/\{\{#each this\.timeline\}\}([\s\S]*?)\{\{\/each\}\}/);
          if (!tlMatch) return content;
          const tlHtml = section.timeline.map(item => {
            return tlMatch[1]
              .replace(/\{\{this\.time\}\}/g, item.time)
              .replace(/\{\{this\.text\}\}/g, item.text);
          }).join('\n');
          return content.replace(tlMatch[0], tlHtml);
        });

        // Videos
        s = s.replace(/\{\{#if this\.videos\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
          if (!section.videos) return '';
          const vMatch = content.match(/\{\{#each this\.videos\}\}([\s\S]*?)\{\{\/each\}\}/);
          if (!vMatch) return content;
          const vHtml = section.videos.map(video => {
            return vMatch[1]
              .replace(/\{\{this\.url\}\}/g, video.url || '')
              .replace(/\{\{this\.thumbnail\}\}/g, video.thumbnail || '')
              .replace(/\{\{this\.title\}\}/g, video.title || '')
              .replace(/\{\{this\.description\}\}/g, video.description || '')
              .replace(/\{\{this\.badge\}\}/g, video.badge || '')
              .replace(/\{\{this\.badgeType\}\}/g, video.badgeType || '');
          }).join('\n');
          return content.replace(vMatch[0], vHtml);
        });

        // Warning
        s = s.replace(/\{\{#if this\.warning\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, content) => {
          if (!section.warning) return '';
          return content
            .replace(/\{\{this\.warning\.title\}\}/g, section.warning.title || '')
            .replace(/\{\{this\.warning\.text\}\}/g, section.warning.text || '');
        });

        // LAST: Simple section fields (only replaces remaining {{this.X}} not inside blocks)
        s = s.replace(/\{\{this\.(\w+)\}\}/g, (_, key) => {
          if (typeof section[key] === 'string') return section[key];
          return '';
        });

        return s;
      }).join('\n');

      html = html.replace(sectionMatch[0], sectionsHtml);
    }

    // 5. Nav sections
    const navMatch = html.match(/\{\{#each sections\}\}([\s\S]*?)\{\{\/each\}\}/);
    if (navMatch) {
      const navTpl = navMatch[1];
      const navHtml = data.sections.map(s => {
        return navTpl
          .replace(/\{\{this\.id\}\}/g, s.id)
          .replace(/\{\{this\.navLabel\}\}/g, s.navLabel);
      }).join('\n');
      html = html.replace(navMatch[0], navHtml);
    }

    // 6. Footer raw HTML
    html = html.replace(/\{\{footerText\}\}/g, data.footerText || '');

    return html;
  };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CMS = window.CMS || {}));
