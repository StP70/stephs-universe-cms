# Steph's Universe CMS – Prozessdiagramm

## Gesamtprozess: Von der Idee zur fertigen Seite

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTENT CREATION                         │
│                                                                 │
│  ┌───────────┐    ┌───────────────┐    ┌──────────────────┐    │
│  │  1. Idee  │───>│  2. Inhalte   │───>│  3. JSON-Datei   │    │
│  │  & Thema  │    │  sammeln      │    │  erstellen       │    │
│  └───────────┘    └───────────────┘    └────────┬─────────┘    │
│                                                  │              │
│    Texte, Videos,    Bilder in               pages/             │
│    Links sammeln     assets/ ablegen         mein-thema.json    │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BUILD PROZESS                          │
│                                                                 │
│                      node build.js                              │
│                           │                                     │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                         │
│      ┌─────────────┐ ┌────────┐ ┌──────────┐                   │
│      │ template.html│ │ pages/ │ │ assets/  │                   │
│      │ (Design)     │ │ (JSON) │ │ (Bilder) │                   │
│      └──────┬──────┘ └───┬────┘ └────┬─────┘                   │
│             │            │           │                          │
│             └────────────┼───────────┘                          │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │  Template  │                                │
│                    │  Engine    │                                │
│                    └─────┬─────┘                                │
│                          │                                      │
│              ┌───────────┼───────────┐                          │
│              ▼                       ▼                          │
│     ┌────────────────┐    ┌──────────────────┐                  │
│     │ dist/index.html│    │ dist/<slug>/     │                  │
│     │ (Übersicht)    │    │   index.html     │                  │
│     └────────────────┘    │   assets/        │                  │
│                           └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT                              │
│                                                                 │
│     ┌──────────┐     ┌──────────┐     ┌──────────────┐         │
│     │  Vercel  │     │  GitHub  │     │  Manueller   │         │
│     │  (Auto)  │     │  Pages   │     │  Upload      │         │
│     └─────┬────┘     └────┬─────┘     └──────┬───────┘         │
│           │               │                  │                  │
│           └───────────────┼──────────────────┘                  │
│                           ▼                                     │
│                    ┌──────────────┐                              │
│                    │   LIVE       │                              │
│                    │   Website    │                              │
│                    └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

## Detailprozess: JSON → HTML Rendering

```
                    ┌──────────────────┐
                    │  JSON-Datei      │
                    │  einlesen        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Template laden   │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Toplevel-Felder ersetzen     │
              │  (title, accent, hero, ...)   │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Sektionen iterieren          │
              │  für jede Sektion:            │
              └──────────────┬───────────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
          ┌──────────┐ ┌──────────┐ ┌──────────┐
          │ Bild?    │ │ Text?    │ │ Cards?   │
          │ einfügen │ │ rendern  │ │ rendern  │
          └──────────┘ └──────────┘ └──────────┘
                ▼            ▼            ▼
          ┌──────────┐ ┌──────────┐ ┌──────────┐
          │ Quote?   │ │Timeline? │ │ Videos?  │
          │ rendern  │ │ rendern  │ │ rendern  │
          └──────────┘ └──────────┘ └──────────┘
                ▼
          ┌──────────┐
          │ Warning? │
          │ rendern  │
          └──────────┘
                │
                ▼
       ┌─────────────────┐
       │  Nav generieren  │
       │  (aus Sektionen) │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  Footer rendern  │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │  HTML speichern  │
       │  Assets kopieren │
       └─────────────────┘
```

## Prozess: Neue Seite anlegen

```
  ┌─────────┐     ┌──────────────┐     ┌──────────────┐
  │ Vorlage │────>│ JSON-Datei   │────>│ Inhalte      │
  │ kopieren│     │ umbenennen   │     │ eintragen    │
  └─────────┘     └──────────────┘     └──────┬───────┘
                                              │
      _example-       mein-                   │
      neue-seite.json thema.json              │
                                              ▼
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Seite live  │<────│ node         │<────│ Bilder in    │
  │ auf Vercel  │     │ build.js     │     │ assets/      │
  └─────────────┘     └──────────────┘     └──────────────┘
                          │
                          ▼
                   git add . &&
                   git commit &&
                   git push
                   (auto-deploy)
```

## Dateifluss

```
  INPUT                    VERARBEITUNG              OUTPUT
  ─────                    ────────────              ──────

  pages/*.json ──────┐
                     ├───> build.js ───> dist/index.html (Übersicht)
  template.html ─────┤
                     ├───> build.js ───> dist/<slug>/index.html
  assets/* ──────────┘                   dist/<slug>/assets/*
```
