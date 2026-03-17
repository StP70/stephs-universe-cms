# Varianten-Remix: Beste Teile aus mehreren Homepages kombinieren

**Datum:** 2026-03-17
**Status:** Brainstorm abgeschlossen
**Nächster Schritt:** `/workflows:plan`

---

## Was wir bauen

Nach der Generierung von 5 Homepage-Varianten kann der User die besten Sektionen aus verschiedenen Varianten ankreuzen und per KI-Remix zu einer neuen Homepage kombinieren lassen. Der Workflow nutzt den gleichen manuellen Modus (Prompt kopieren → claude.ai → JSON zurück pasten).

**Kernfunktionen:**
1. **Sektions-Picker** -- Für jede Variante werden die Sektionen als ankreuzbare Liste angezeigt
2. **Remix-Prompt** -- Ein Prompt der die ausgewählten Sektionen + Hero/Theme-Infos enthält und Claude anweist, daraus eine neue Homepage zu bauen
3. **Gleicher Workflow** -- [Remix-Prompt kopieren] → [Claude.ai öffnen] → JSON zurück pasten

## Warum dieser Ansatz

- **Kein neues UI-Paradigma:** Baut auf dem bestehenden Generator-Workflow auf (Prompt kopieren → claude.ai → einfügen)
- **KI statt manuellem Copy-Paste:** Sektionen manuell zusammenkopieren wäre möglich, aber die KI kann die Übergänge glätten, Texte anpassen und ein konsistentes Design sicherstellen
- **Sektions-Level-Granularität:** Feingranularer als "nimm ganz V1" aber nicht so komplex wie Feld-für-Feld Editing (das kann man danach im Editor machen)

## Key Decisions

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Wann sichtbar | Nur wenn ≥2 Varianten generiert/geladen sind | Remix macht nur mit mehreren Varianten Sinn |
| Granularität | Sektions-Level + Hero/Theme wählbar | Gute Balance zwischen Kontrolle und Einfachheit |
| KI-Anweisung | Die ausgewählten Sektionen werden als JSON im Prompt übergeben, Claude kombiniert | KI kann Übergänge glätten und Konsistenz herstellen |
| Steuerung | Optionales Freitext-Feld für Zusatzanweisungen (z.B. "verwende den lockeren Ton von V2") | Flexibilität ohne Zwang |
| Output | Eine neue Homepage-JSON (gleicher Workflow: einfügen → Editor laden) | Konsistenz mit bestehendem Flow |

## Remix-UI (im KI-Generator Panel)

```
┌──────────────────────────────────────────────────┐
│  REMIX                                            │
│  Wähle die besten Teile aus deinen Varianten:     │
│                                                    │
│  ── Hero & Design ──                              │
│  ○ V1 (Dark, #10b981, "Zahnarzt Wien")            │
│  ○ V2 (Light, #0d9488, "Ihre Zahnarztpraxis")     │
│  ○ V3 (Colorful, #8b5cf6, "Zahngesundheit")       │
│                                                    │
│  ── Sektionen ──                                  │
│  ☑ V1: Unsere Leistungen (Cards)                  │
│  ☐ V1: Unser Team (Text + Zitat)                  │
│  ☑ V2: Services im Überblick (Timeline)           │
│  ☐ V2: Über uns (Text)                            │
│  ☑ V3: Behandlungen (Cards)                       │
│  ☐ V3: Ablauf (Timeline)                          │
│  ☑ V3: Kontakt (Warnung)                          │
│                                                    │
│  ── Zusätzliche Anweisung (optional) ──           │
│  [Verwende den lockeren Ton von V2             ]   │
│                                                    │
│  [Remix-Prompt kopieren] [Claude.ai öffnen]        │
└──────────────────────────────────────────────────┘
```

## Prompt-Strategie

Der Remix-Prompt enthält:
1. **System-Rolle:** "Kombiniere die folgenden Homepage-Teile zu einer neuen, konsistenten Homepage"
2. **Gewählter Hero/Theme:** Das komplette Toplevel-JSON der gewählten Variante (slug, title, theme, accentColor, hero-Felder)
3. **Gewählte Sektionen:** Die ausgewählten Sektionen als JSON-Array
4. **Anweisung:** "Erstelle eine neue Homepage die diese Sektionen integriert. Passe IDs, Nav-Labels und Übergänge an."
5. **Optionale User-Anweisung:** Freitext wenn vorhanden

## Technische Umsetzung

- **Daten:** `window._generatedVariants` enthält bereits alle Varianten als JS-Objekte
- **UI:** Neuer `<div id="genRemix">` Block der erscheint wenn ≥2 Varianten vorhanden sind
- **Hero-Auswahl:** Radio-Buttons (nur 1 Hero/Theme möglich)
- **Sektions-Auswahl:** Checkboxen (mehrere aus verschiedenen Varianten)
- **Sektionstyp-Erkennung:** Label zeigt Typ basierend auf vorhandenen Feldern (hat `cards` → "Cards", hat `timeline` → "Timeline", hat `paragraphs` → "Text", hat `quote` → "Zitat", etc.)
- **Prompt-Bau:** JSON der gewählten Teile + Anweisungen zusammenbauen
- **Prompt-Anweisung:** Sektionen möglichst 1:1 übernehmen, nur IDs/NavLabels anpassen, keine Inhalte umschreiben
- **Buttons:** [Remix-Prompt kopieren] + [Claude.ai öffnen] (gleiche Buttons wie beim Generator)
- **Ergebnis:** Gleicher Paste-Flow wie beim Generator (JSON einfügen → in Editor laden)

## Token-Kosten-Anzeige

Dynamische Kostenanzeige im gesamten KI-Generator (nicht nur Remix):

**Anzeige bei Varianten-Checkboxen (Generator):**
- Pro Variante: ~2.000 Tokens Prompt + ~2.000 Tokens Antwort = ~4.000 Tokens
- Zeigt live: "Geschätzt: ~12.000 Tokens" (bei 3 gewählten Varianten)

**Anzeige beim Remix:**
- Berechnet aus: Größe der ausgewählten Sektionen (JSON.stringify().length / 4 ≈ Tokens) + Prompt-Overhead
- Zeigt live: "Geschätzt: ~8.500 Tokens"

**Gesamtverbrauch:**
- `window._totalTokensUsed` zählt alle bisherigen Prompt+Antwort-Tokens der Session
- Anzeige unten im Generator-Panel: "Bisheriger Verbrauch: ~24.000 Tokens"
- 1.000er-Interpunktion (Punkt als Tausendertrenner): `24.000` statt `24000`

**Berechnung:**
- Input-Tokens ≈ Zeichen / 4 (grobe Faustregel für Deutsch)
- Output-Tokens ≈ ~2.000 pro Variante (geschätzt)
- Im API-Modus: Exakte Token-Zahlen aus der API-Response auslesen (`usage.input_tokens`, `usage.output_tokens`)
- Im manuellen Modus: Nur Schätzung möglich (Prompt-Länge bekannt, Antwort nicht)

## Nicht im Scope

- ~~Drag & Drop Sortierung der ausgewählten Sektionen~~ → Claude bestimmt die Reihenfolge, User kann im Editor umsortieren
- ~~Live-Preview beim Ankreuzen~~ → Zu komplex, Vorschau kommt erst nach dem Remix
- ~~Automatischer Remix ohne KI~~ → Sektionen einfach zusammenkopieren ohne KI wäre möglich, aber verliert Konsistenz

## Open Questions

*Keine -- alle Fragen wurden in der Brainstorm-Phase geklärt.*
