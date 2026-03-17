# KI-Content-Generator -- Anleitung

**Stand:** 2026-03-17
**Fuer:** Stephan Peham

---

## Uebersicht

Der KI-Content-Generator erstellt aus einer kurzen Beschreibung eine komplette Homepage fuer dein CMS -- inklusive Hero, Sektionen, Farben und Theme. Du bekommst bis zu 5 verschiedene Varianten zur Auswahl, die du direkt im Editor weiterbearbeiten kannst.

---

## Manueller Modus (Empfohlen)

Der manuelle Modus ist kostenlos und braucht keinen API-Key. Du kopierst einen Prompt in claude.ai und fuegst die Antwort zurueck ein.

### Schritt fuer Schritt

1. **admin.html oeffnen**
   - Doppelklicke auf `admin.html` im Ordner `project-001/experiment-011/`
   - Die Datei oeffnet sich im Browser

2. **KI-Generator aufklappen**
   - Klicke oben im Editor auf den Bereich **"KI-Generator"**
   - Das Panel klappt auf

3. **Homepage beschreiben**
   - Schreibe in das Textfeld eine kurze Beschreibung der gewuenschten Seite
   - Beispiel:
     ```
     Zahnarztpraxis Dr. Mueller in Wien. Modern und vertrauenswuerdig.
     Services: Implantate, Prophylaxe, Bleaching.
     Zielgruppe: Erwachsene und Familien.
     ```

4. **Variante waehlen**
   - Waehle eine der 5 Varianten aus. Jede erzeugt eine andere Art von Homepage:

   | Variante | Theme | Schreibstil | Sektions-Fokus |
   |---|---|---|---|
   | **V1** | Dark (dunkler Hintergrund) | Serioes und professionell | Cards + Timeline |
   | **V2** | Light (heller Hintergrund) | Locker und freundlich | Text-Absaetze + Zitate |
   | **V3** | Colorful (bunt, Gradient-Hero) | Emotional und einladend | Cards + Hinweise |
   | **V4** | Dark (dunkler Hintergrund) | Technisch und detailliert | Timeline + Text-Absaetze |
   | **V5** | Light (heller Hintergrund) | Kreativ und verspielt | Cards + Zitate |

5. **"Prompt kopieren" klicken**
   - Der Generator erstellt einen fertigen Prompt und kopiert ihn in die Zwischenablage

6. **In claude.ai einfuegen**
   - Oeffne [claude.ai](https://claude.ai) im Browser
   - Fuege den kopierten Prompt ein (Strg+V) und schicke ihn ab
   - Claude antwortet mit einem JSON-Block

7. **JSON-Antwort kopieren**
   - Markiere die gesamte JSON-Antwort von Claude (alles zwischen den geschweiften Klammern `{ ... }`)
   - Kopiere sie (Strg+C)

8. **Zurueck in admin.html**
   - Klicke im KI-Generator auf **"JSON einfuegen"**
   - Fuege die kopierte Antwort ein (Strg+V)
   - Klicke auf **"In Editor laden"**
   - Die generierte Seite wird im Editor angezeigt

9. **Im Editor weiterbearbeiten**
   - Pruefe und bearbeite die Inhalte wie gewohnt
   - **Bilder hinzufuegen:** Die KI generiert keine Bilder -- fuege Hero-Hintergrund, Sektionsbilder und Icons manuell hinzu (ueber den [Datei]-Button)
   - Klicke auf **[Vorschau]** um das Ergebnis zu pruefen

10. **Speichern und bauen**
    - Klicke auf **[JSON speichern]**
    - Verschiebe die Datei in den Ordner `pages/`
    - Baue die Seite:
      ```
      cd C:\project-001\experiment-011
      node build.js
      ```

---

## API-Modus (Optional)

Im API-Modus generiert der Server die Seite automatisch -- ohne Copy-Paste ueber claude.ai. Dafuer brauchst du einen API-Key.

### Einmalige Einrichtung

1. **API-Key besorgen**
   - Gehe zu [console.anthropic.com](https://console.anthropic.com)
   - Erstelle einen Account (falls noch nicht vorhanden)
   - Unter "API Keys" einen neuen Key erstellen
   - Den Key kopieren (beginnt mit `sk-ant-...`)

2. **In .env eintragen**
   - Oeffne die Datei `.env` im Projektordner (oder erstelle sie anhand von `.env.example`)
   - Trage deinen Key ein:
     ```
     CLAUDE_API_KEY=sk-ant-dein-key-hier
     ```

### Seite generieren

3. **Server starten**
   ```
   cd C:\project-001\experiment-011
   node server.js
   ```
   - Im Terminal erscheint: `CMS Server: http://localhost:3000`

4. **Im Browser oeffnen**
   - Gehe zu [http://localhost:3000](http://localhost:3000)
   - Du siehst den Editor (admin.html) ueber den lokalen Server

5. **KI-Generator aufklappen und Beschreibung eingeben**
   - Wie im manuellen Modus: Beschreibung eintippen und Varianten-Anzahl waehlen

6. **Modus auf "Automatisch" umschalten**
   - Waehle den Provider (Claude oder OpenAI)
   - Stelle die gewuenschte Anzahl Varianten ein (1-5)

7. **"Generieren" klicken**
   - Der Server schickt die Anfrage direkt an die KI-API
   - Du siehst den Fortschritt: "Variante 1/3 wird generiert..."
   - Nach Abschluss erscheinen Buttons fuer jede Variante
   - Klicke auf eine Variante um sie in den Editor zu laden
   - Weiterbearbeiten, Vorschau, Speichern wie gewohnt

---

## CLI-Modus (fuer Fortgeschrittene)

Ueber die Kommandozeile kannst du mehrere Varianten auf einmal generieren -- die JSON-Dateien landen direkt im `pages/`-Ordner.

**Voraussetzung:** API-Key in `.env` eingetragen (siehe API-Modus oben).

```
cd C:\project-001\experiment-011
node generate.js "Zahnarztpraxis Wien, modern, Services: Implantate und Prophylaxe" --variants 3
```

**Optionale Parameter:**

| Parameter | Beschreibung | Standard |
|---|---|---|
| `--variants N` | Anzahl Varianten (1-5) | 3 |
| `--provider claude` | KI-Provider (claude oder openai) | claude |

**Ausgabe:**
```
KI-Content-Generator

Provider: Claude API
Varianten: 3

-> pages/zahnarztpraxis-wien-v1.json (Dark / Serioes)
-> pages/zahnarztpraxis-wien-v2.json (Light / Locker)
-> pages/zahnarztpraxis-wien-v3.json (Colorful / Emotional)

Fertig! Oeffne admin.html oder `node build.js`
```

Danach: `node build.js` um die fertigen HTML-Seiten zu bauen.

---

## Tipps fuer gute Beschreibungen

Je mehr Details du angibst, desto besser wird das Ergebnis. Hier ein paar Beispiele:

**Kurz (funktioniert, aber allgemein):**
```
Yoga-Studio Salzburg
```

**Besser (mit Details):**
```
Yoga-Studio "Balance" in Salzburg. Lehrerin: Maria, 15 Jahre Erfahrung.
Kurse: Hatha, Vinyasa, Yin Yoga.
Zielgruppe: Anfaenger bis Fortgeschrittene.
Ambiente: ruhig, natuerlich, einladend.
```

**Weitere Beispiele:**
```
Handwerksbetrieb Tischlerei Huber in Graz.
Spezialisiert auf Massivholzmoebel und Kuechen.
Familienbetrieb seit 1985, 3. Generation.
```

```
Ernaehrungsberatung von Lisa Weber, online und in Linz.
Schwerpunkte: Darmgesundheit, Unvertraeglichkeiten, Gewichtsmanagement.
Wissenschaftlich fundiert, aber verstaendlich erklaert.
```

**Was du angeben kannst:**
- Art des Unternehmens / der Seite
- Standort
- Services / Angebote
- Zielgruppe
- Alleinstellungsmerkmale
- Gewuenschte Stimmung (modern, traditionell, verspielt, serioes ...)

---

## Haeufige Fragen

**Was kostet das?**
- **Manueller Modus:** Nichts -- du nutzt claude.ai mit deinem kostenlosen Account.
- **API-Modus:** Ca. $0.01 - $0.05 pro generierte Seite. Bei 3 Varianten also ca. $0.03 - $0.15.

**Warum sieht die Seite anders aus als erwartet?**
Die KI generiert nur Text und Struktur, keine Bilder. Das Hero-Hintergrundbild, Sektionsbilder und das Nav-Icon musst du manuell hinzufuegen. Ohne Bilder wirkt die Seite erstmal kahl -- das ist normal.

**Kann ich die generierte Seite bearbeiten?**
Ja! Sobald die Variante im Editor geladen ist, kannst du alles wie gewohnt aendern -- Texte, Farben, Sektionen, Reihenfolge. Die KI liefert einen Startpunkt, den Rest machst du.

**Welche Variante soll ich waehlen?**
Probiere mehrere aus und zeige sie deinem Kunden. V1 (Dark/Serioes) eignet sich gut fuer Aerzte, Anwaelte, Berater. V2 (Light/Locker) fuer Cafes, Yoga-Studios, Blogs. V3 (Colorful/Emotional) fuer kreative Branchen. V4 und V5 bieten weitere Alternativen.

**Muss ich den Server (node server.js) immer laufen lassen?**
Nur fuer den API-Modus. Im manuellen Modus kannst du admin.html ganz normal per Doppelklick oeffnen.

**Kann ich auch OpenAI statt Claude nutzen?**
Ja, im API-Modus und CLI-Modus kannst du den Provider auf "openai" umschalten. Du brauchst dann einen OpenAI API-Key in der `.env` (`OPENAI_API_KEY=sk-...`).

---

## Kurzanleitung (Spickzettel)

```
MANUELL (kostenlos):
1. admin.html oeffnen
2. KI-Generator aufklappen
3. Beschreibung eintippen, Variante waehlen
4. "Prompt kopieren" -> in claude.ai einfuegen
5. JSON-Antwort kopieren -> "JSON einfuegen" -> "In Editor laden"
6. Bilder hinzufuegen, bearbeiten, Vorschau
7. JSON speichern -> node build.js

API (automatisch):
1. API-Key in .env eintragen
2. node server.js
3. http://localhost:3000 oeffnen
4. Beschreibung + Varianten -> "Generieren"
5. Variante in Editor laden -> bearbeiten -> speichern -> node build.js
```
