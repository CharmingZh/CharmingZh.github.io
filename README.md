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

Quick maintenance:

1. Add or edit one publication per BibTeX entry in `archive/vue_liquid_glass/src/data/publications.bib`.
2. Keep `year` as a 4-digit value like `2026`; a missing year will break the year grouping on the page.
3. Fill `title`, `author`, `year`, and `journal` or `booktitle` first, then add optional fields like `url`, `project_url`, `code_url`, `dataset_url`, and `poster_url`.
4. If you prefer Markdown, use `archive/vue_liquid_glass/src/data/publications.md` with `## Year` and `### Title` blocks, then switch the component to `parsePublicationsMarkdown()`.
5. After editing, run `cd archive/vue_liquid_glass && npm run build` to verify the page still parses correctly.

## Photography

The photography page uses generated files from:

```text
archive/vue_liquid_glass/public/Photography/manifest.json
```

Quick maintenance:

1. Put new source images into `archive/vue_liquid_glass/src/assets/temp_folder`.
2. Run `cd archive/vue_liquid_glass && node scripts/prepare_photography.js` to regenerate the copied images, thumbnails, and manifest.
3. Check `archive/vue_liquid_glass/public/Photography/manifest.json` if you need to confirm the final image order or metadata.
4. Run `cd archive/vue_liquid_glass && npm run build` before publishing changes.

## Deployment

GitHub Actions builds `archive/vue_liquid_glass` and deploys the generated
`dist` artifact to GitHub Pages.
