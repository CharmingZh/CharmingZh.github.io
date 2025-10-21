# AI Coding Guidelines for CharmingZh.github.io

## 🧭 Repository map
- **Root static site (`index.html` + `src/source_code/`)** mirrors the public profile. JS/CSS there must stay compatible with the existing class hooks (`glass-nav`, `glass-card`, etc.) so scrolling, nav slider, and particle canvas keep working.
- **`archive/vue_liquid_glass/`** is the actively developed Vue 3 + Vite port. Most new work happens here; the build output is synced into `docs/` for GitHub Pages.
- **`archive/CSS_Implement/`** and **`archive/iOS_support/`** are legacy static implementations for testing specific features.
- **`archive/test_module/`** contains component test pages for development.
- Other `archive/*` folders are legacy prototypes—treat them as references unless a task explicitly targets them.

## 🧩 Vue app architecture (`archive/vue_liquid_glass/`)
- Bootstrapped in `src/main.js` where `@wxperia/liquid-glass-vue` is registered globally. Use `<script setup>` in every component.
- `App.vue` wires the page: it imports each section component, defines shared `glassProps` (displacementScale, blurAmount, aberrationIntensity, elasticity, cornerRadius), and exposes `toggleTheme` / `currentTheme` via `provide`. New sections must be imported and appended to the template list.
- DOM-side effects live in the `onMounted` block of `App.vue` (3D tilt on `.glass-card` elements, nav slider updates, mobile drawer toggle, publications year filter, carousel controls, infinite research scroller, fade-in animations). Preserve/extend the CSS hooks (`.glass-card`, `.research-card-scroll`, `.content-section`, etc.) so these observers keep firing.
- `GlassEffect.vue` wraps OGL shaders. It expects props `{ borderRadius, distortion, padding }`, sets up `Renderer`, `Camera`, `Transform`, `Mesh`, `Plane`, `Program`, and updates uniforms on resize/mouse move. Reuse its pattern for new shader surfaces to avoid GPU leaks.
- Section components (`AboutSection.vue`, `EducationSection.vue`, etc.) follow template-only pattern: plain markup with global classes, no scoped styles.

## 🎨 Styling and assets
- Global look & feel lives in `src/assets/main.css` (~1.3k lines). Theme variables are defined in `:root` / `[data-theme="light"]`; adjust variables instead of hard-coding colors.
- Components typically render plain markup and rely on the global classes (`content-section`, `glass-card`, etc.). Keep class names stable when modifying HTML so the shared CSS and JS behaviors continue to apply.
- Static imagery for the Vue app sits under `public/` (copied verbatim by Vite). Legacy images for the static site live in top-level `src/`—don't move or rename without updating both variants.
- Navigation uses radio button groups with smooth scrolling; mobile menu toggles body scroll lock.

## 🔧 Workflows
- Install & run inside the Vue folder:
	- `cd archive/vue_liquid_glass`
	- `npm install`
	- `npm run dev` (Vite dev server, usually on localhost:5173)
	- `npm run build` (outputs `dist/`)
	- `npm run lint` (ESLint with --fix)
- Deploy by syncing `dist/` into the repository `docs/` directory (GitHub Pages serves from there). There are no automated tests or lint tasks today beyond `npm run lint`.
- Theme switching: Updates `document.documentElement.setAttribute('data-theme', theme)` and applies to body element too.

## 🛠️ Implementation tips
- When creating a new section, follow `components/AboutSection.vue` style: template-only component, global classes, and optional SVG icons. Register it in `App.vue` template and update the nav radio group plus mobile links so smooth scrolling keeps working.
- Need custom liquid-glass tuning? Adjust `glassProps` in `App.vue` or pass overrides directly on `<LiquidGlass>` wrappers.
- Any theme-related change should update both the `data-theme="dark"` default and the light-mode overrides in `main.css` to keep parity.
- If you touch the imperative helpers in `App.vue`, debounce heavy work and reuse existing observers/listeners—multiple listeners on the same selector can double the effect.
- WebGL effects in `GlassEffect.vue` include platform detection (MacOS/iOS/Safari compatibility checks) and fallback to CSS-only mode.
- Build optimization: Vite config splits chunks for Vue, OGL, and liquid-glass libraries; enables Terser minification with console/debugger removal.

## 🔄 Maintenance guidelines
- **Dual implementation sync**: Changes to navigation, sections, or styling must be mirrored between static (`index.html`) and Vue (`App.vue`) versions to maintain feature parity.
- **Class stability**: Preserve CSS class hooks used by DOM observers (`.glass-card`, `.content-section`, etc.) when refactoring markup.
- **Performance**: WebGL effects include visibility detection and throttled updates; respect `prefers-reduced-motion` for accessibility.

## 📦 Legacy static entry point
- The published `index.html` still references `src/source_code/{script.js, style.css, particle-effect.js}`. Maintain those assets if you patch the static build, and mirror behavioral changes into the Vue app when relevant so both fronts stay aligned.

👉 Let me know if any section needs deeper detail or examples—we can expand it once you start applying these guidelines.
