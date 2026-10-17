# 听雨小筑 · Tingyu Garden

A Three.js architectural visualization of an **asymmetrically composed Jiangnan scholar garden**, organized around a three-bay exposed-timber dwelling. The house — its load-bearing frame, room sequence, joinery, and inhabited interior — is the central exhibit.

**Live garden:** https://rthdfd.github.io/tingyu-jiangnan-garden/

**Rendered photographs:** [visual-preview release](https://github.com/rthdfd/tingyu-jiangnan-garden/releases/tag/visual-preview)

## Views

1. Rain-cleared daylight garden.
2. Blue-hour garden and water reflections.
3. Night garden, paper lanterns and warm interior light.
4. The central reception hall.
5. The west study, bookshelves, writing tools and qin.
6. The east bedchamber, canopy bed, curtains and screens.
7. A front-roof cutaway showing columns, beams, purlins and rafters.

Screenshots are genuine Chromium captures of the built interactive scene, **not generated reference pictures**. PNG originals and JPEG previews are attached to the release. `render-report.json` records the actual browser renderer, material loading, room routes, errors and timings. The software renderer is ANGLE SwiftShader on GitHub-hosted Ubuntu; no GPU is claimed.

## Architecture

- Three approximately 4.06 m bays, with an unobstructed central hall and side passages to the study and bedchamber.
- Exposed columns on stone bases, transverse beams, upper struts, shorter raised beams, longitudinal purlins and individual curved rafters. The roof rests on this frame; it is not a decorative framework inside a box.
- Clear height under the principal beam exceeds 3 m.
- Operable-looking, partially folded full-height timber doors; visible lattice work and real open room connections.
- Ming-inspired hardwood chairs, tables and bookshelves; an altar table, scrolls, tripod incense burner, tea service, writing tools, stitched books, a qin and a curtained canopy bed.
- A genuine perforated moon gate and procedurally meshed Taihu-style stones with through-holes.

This is an original, historically informed visualization, **not a measured reconstruction or a certified conservation model**. A restrained Ming domestic vocabulary is used rather than an undifferentiated mash-up of dynastic palaces.

## Garden and rendering

Photographic **CC0 Poly Haven PBR textures**, an overcast HDR environment, independently modelled fired-clay roof tiles, wet stone and wood, celadon and blue-white porcelain. Individually modelled botanical leaves form irregular branching trees, willow, bamboo, shrubs, vines, ferns, banana leaves, iris and aquatic foliage. Water uses planar reflections; paving has a separate irregular wet-reflection layer. Small eave drops, expanding rain rings and low drifting vapor remain present across daylight and night.

Lighting uses environmental irradiance, shadowed directional light, traditional emissive paper lamps and local warm lights. The image pipeline adds contact ambient occlusion, restrained bloom, ACES tone mapping and subtle grain. This is raster PBR, not an offline path-traced film render.

## Controls

- Drag: orbit; wheel or pinch: zoom. Right-drag/two-finger pan is available.
- Bottom tabs: garden / hall / study / bedchamber / exposed structure.
- The visible 昼–夜 slider changes sky color, environmental lighting, fog, local lamps, exposure and water continuously. The endpoint buttons animate the same transition.
- **漫游**: first-person entry. Drag to look, use WASD/arrow keys or the on-screen movement pad. Escape returns to the garden.
- Interior circulation avoids the structural columns and main furniture. The pond blocks walking except on the stone bridge.

## Reproducibility / no phone builds

All dependency installation, material downloads, builds, browser installation, rendering and capture run **only in the GitHub Actions workflow**. The authoring workspace holds lightweight source files only. Opening the live interactive scene naturally renders it in the visitor's own browser; downloading/viewing its screenshots does not run Three.js.

The CI pipeline:
1. Installs pinned Three.js / Vite / Playwright versions.
2. Downloads 1K CC0 texture sets and a 1K overcast HDRI; records sources and SHA-256 hashes in the material manifest.
3. Syntax-checks and builds the application.
4. Opens the actual site in headless Chromium, captures seven 2400×1500 views and tests room access / first-person movement.
5. Publishes image artifacts and the interactive GitHub Pages site.

Only standard GitHub-hosted Linux runners are used; there is no paid runner, remote paid API, or personal token in the project.

## Source layout

- `src/architecture.js` — load-bearing house, roofs, moon gate, corridors and pavilion.
- `src/furniture.js` — Ming-inspired domestic furnishings at real-world scale.
- `src/botany.js` — organic branches and varied instanced leaf geometries.
- `src/landscape.js` — ground, wet paving, stone bridge, pond, rocks and weather.
- `src/materials.js` — PBR sets, fine procedural material details, paper and paintings.
- `src/main.js` — light transition, navigation, first-person movement and postprocessing.
- `scripts/fetch-assets.py` — CC0 asset retrieval on CI.
- `scripts/capture.mjs` — real-browser capture and basic interaction validation.

## Licenses

Original source and geometry: MIT. Photographic textures and HDRI: [Poly Haven CC0](https://polyhaven.com/license), with exact asset links in `public/assets/manifest.json` in the published build. Three.js: MIT. System Chinese serif fonts are supplied by Noto on the build runner; the site uses installed font fallbacks, not an external font CDN.
