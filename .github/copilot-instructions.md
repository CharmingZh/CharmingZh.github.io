# AI Coding Guidelines for CharmingZh.github.io

## Repository Map

- `archive/vue_liquid_glass/` is the only maintained homepage app.
- `.github/workflows/workflow.yml` builds `archive/vue_liquid_glass` and deploys its
  `dist` artifact to GitHub Pages.
- Root-level static prototypes and old archive demos have been removed. Do not
  reintroduce a second homepage implementation unless explicitly requested.

## Vue App Architecture

- `src/main.js` registers Vue, the router, and `@wxperia/liquid-glass-vue`.
- `src/App.vue` composes the one-page homepage sections and shared liquid-glass
  props, plus DOM helpers for nav state, scrolling, cards, carousels, and theme
  switching.
- Section components live in `src/components/` and rely on global class names in
  `src/assets/main.css`. Keep hooks such as `.glass-card`, `.content-section`,
  `.research-card-scroll`, and `.publications-list-*` stable.
- The photography route is defined in `src/router/index.js` and uses
  `src/views/PhotographyPage.vue`.
- Publication parsing and grouping logic lives in `src/utils/publications.js`.

## Styling And Assets

- Global styling lives in `src/assets/main.css`; prefer existing variables and
  classes before adding new CSS.
- Images that must be available by URL belong in `public/`, because Vite copies
  that directory directly into `dist`.
- Bundled education logos live in `src/assets/education/` and are imported by
  `EducationSection.vue`.
- Publication data lives in `src/data/publications.bib`, with
  `src/data/publications.md` available as an optional structured Markdown source.

## Commands

Run commands from `archive/vue_liquid_glass`:

```bash
npm ci
npm run dev
npm run build
npm run preview
npm run lint
```

## Maintenance Notes

- Keep the GitHub Actions workflow working from `archive/vue_liquid_glass`.
- Keep public asset references rooted at `/`, such as `/avatar.jpg` or
  `/Research/2025_Apple.png`.
- Avoid adding duplicate static pages at the repository root; the deployed
  version should remain the Vue/Vite app.
