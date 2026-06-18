# CharmingZh Homepage

This directory contains the Vue 3 + Vite homepage that GitHub Actions builds
and deploys to GitHub Pages.

## Commands

```bash
npm ci
npm run dev
npm run build
npm run preview
```

## Data

Publication data is stored in `src/data/publications.bib`. The publications
section groups entries by year. If valid entries are added to
`src/data/publications.md`, that Markdown source takes priority; otherwise the
BibTeX file is used.

Static assets that must be served directly by Vite live in `public/`.
