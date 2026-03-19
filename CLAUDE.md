# Project: ltbringer personal blog

Astro + Starlight blog. Content in `src/content/docs/`. Custom components in `src/components/`.

## Session — 2026-03-19

### What changed
- Added beautiful-mermaid utility for rendering mermaid source to SVG
- Added Graph.astro component for hand-crafted SVG decision trees (auto-layout, dark theme, stack mode)
- Added Mermaid.astro component for build-time mermaid rendering
- Added micrograd in Rust blog series intro (smart pointers, traits, closures, Kahn's topo sort)
- Added Qdrant internals series plan
- Updated gitignore, added mermaid-cli dev dep, tightened code block line height

### Why
- Graph.astro was built because mermaid's default output didn't match the site's warm charcoal aesthetic
- Blog content underwent multiple review passes for signal density and conciseness
- Series plan for micrograd was restructured from 5-part (engine split across parts) to Part 1 covering engine.rs holistically

### Watch out for
- `scripts/beautiful-mermaid/` has its own package.json and node_modules (gitignored)
- Files prefixed with `_` in content dirs are excluded from Astro build (e.g. `_SERIES_PLAN.md`)
- Graph.astro text width is approximate (`length * fontSize * 0.58`) — may need tuning for non-Latin chars
- Mermaid.astro requires `--no-sandbox` flag for puppeteer on this system
