# Market Map Export — Implementation Plan

**Goal:** Export the current market layout as PNG, JPEG, or PDF from the Market
Map toolbar, without including application or editor UI.

**Architecture:** A reusable Konva scene renders both the interactive map and
an off-screen, logical-size export stage. `MapExportRenderer` is the seam that
exposes one `exportMap(format)` operation to `LoadedMarketMapPage`; it hides
image encoding, filename construction, canvas sizing, and PDF layout.

**Tech Stack:** Existing React, TypeScript, Konva/react-konva; add
`jspdf@^4.2.1` only after a scratch compatibility probe.

**Spec:** `docs/superpowers/specs/2026-08-19-market-export-design.md`

## Global Constraints

- Export the market boundary only, at logical scale `1`; do not capture the
  visible stage viewport or browser UI.
- Preserve current `MapCanvas` interaction behavior. The export scene has no
  selection, drag handles, popup, text-edit input, or tools panel.
- Export uses the currently displayed state: saved state in View mode and the
  unsaved draft in Edit mode. It never writes Firestore.
- PNG/JPEG cap the longest output dimension at 4096 px to avoid an unbounded
  browser canvas allocation.
- A CORS-tainted background image must produce the specified inline error, not
  a blank/silent export.
- No test framework exists: validate with typecheck, build, and manual
  downloads for all formats.

---

### Task 1: Probe and add PDF dependency

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] In an isolated temporary directory, install `jspdf@^4.2.1`, then make a
  minimal TypeScript/Vite import probe using `new jsPDF({ orientation: 'landscape',
  unit: 'mm', format: 'a4' })`, `addImage`, and `save`.
- [ ] Confirm it neither changes the Tailwind/PostCSS dependency graph nor
  causes a Vite build error.
- [ ] Add the verified version to this repository with `pnpm add jspdf@^4.2.1`.
- [ ] Run `pnpm typecheck` and `pnpm build`.

### Task 2: Extract the exportable map scene

**Files:**
- Create: `src/components/market-map/MarketScene.tsx`
- Modify: `src/components/market-map/MapCanvas.tsx`

- [ ] Move only the market boundary, cover-fit background image/tint, and
  `StallShape` rendering from `MapCanvas` into `MarketScene`.
- [ ] Give `MarketScene` an interface containing `market`, `stalls`, and
  presentation-only props such as `selectedId`/`interactive`; it must not own
  pan/zoom state, listeners, selection decisions, or resize controls.
- [ ] Keep all existing `MapCanvas` effects and event callbacks outside the
  scene. In normal rendering, pass current selection and handlers unchanged.
- [ ] Use `crossOrigin = 'anonymous'` for background-image loading and surface
  a load/export-safe status to consumers.
- [ ] Verify Market Map view/edit behavior manually before proceeding.

### Task 3: Build the off-screen export renderer

**Files:**
- Create: `src/components/market-map/MapExportRenderer.tsx`
- Create: `src/lib/mapExport.ts`

- [ ] Define `MapExportFormat = 'png' | 'jpeg' | 'pdf'` and a forwarded
  `MapExportHandle` with the single method `exportMap(format)`.
- [ ] Mount an off-screen-but-renderable Konva `Stage` at `market.width` ×
  `market.height`, scale `1`, with `MarketScene` configured with no selected
  element and no interaction handlers.
- [ ] Wait for the stage and any background image to finish rendering before
  calling `toDataURL`; reject with the documented CORS error if canvas encoding
  throws a security exception.
- [ ] In `mapExport.ts`, centralize filename generation, pixel-ratio capping,
  temporary-anchor download, JPEG quality, and PDF page/image fitting. Embed a
  JPEG in the PDF so jsPDF does not need to decode a canvas PNG. Avoid
  duplicating those calculations in React callers.
- [ ] Dynamically import `jspdf` only in the PDF branch; call `save` once per
  document.

### Task 4: Wire Export UI and state

**Files:**
- Modify: `src/components/market-map/LoadedMarketMapPage.tsx`
- Modify: `src/components/market-map/Toolbar.tsx`

- [ ] Add `isExporting` and `exportError` state to `LoadedMarketMapPage`.
- [ ] Render `MapExportRenderer` with the same current `market` and occupancy-
  enriched `stalls` that `MapCanvas` receives, then call its handle from the
  toolbar callback.
- [ ] Add an Export dropdown with PNG, JPEG, and PDF actions to `Toolbar`.
  Disable it while exporting and show `Exporting…`.
- [ ] Render the inline error with `text-destructive` and an `aria-live`
  region. Clear a prior error before each new attempt.

### Task 5: Validate behavior and failure modes

**Files:**
- Modify: `README.md`
- Modify: `context.md`

- [ ] Run `pnpm typecheck`, `pnpm build`, and check `git diff --check`.
- [ ] From View mode, download all three formats. Verify filenames, dimensions,
  A4-landscape PDF, and no shell/editor/selection UI in the output.
- [ ] Enter Edit mode, make an unsaved change, export, and confirm it appears;
  then Cancel and confirm the export did not save the edit.
- [ ] Verify output with no background image, then with a CORS-enabled image.
  Attempt a non-CORS image and confirm the explicit error is shown.
- [ ] Update README with the supported formats, current-draft behavior, and
  background-image CORS limitation. Update context with the new export seam
  and its snapshot invariant.
