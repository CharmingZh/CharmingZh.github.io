# CharmingZh.github.io

Personal homepage for Jiaming Zhang.

The site deployed by GitHub Actions is the Vue/Vite app in:

```text
archive/vue_liquid_glass
```

The repository intentionally keeps only the deployed app and its assets. Older
static prototypes and IDE/cache files have been removed.

## Local Development

```bash
cd archive/vue_liquid_glass
npm ci
npm run dev
```

## Production Build

```bash
cd archive/vue_liquid_glass
npm run build
npm run preview
```

## Publications

Publication data lives in:

```text
archive/vue_liquid_glass/src/data/publications.bib
```

The Publications section parses that BibTeX file and groups entries by year.
The optional Markdown format is documented in:

```text
archive/vue_liquid_glass/src/data/publications.md
```

## Deployment

GitHub Actions builds `archive/vue_liquid_glass` and deploys the generated
`dist` artifact to GitHub Pages.
