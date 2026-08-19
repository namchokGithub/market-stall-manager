# Market Map Export — Design Spec

Date: 2026-08-19
Status: Approved for implementation planning

## Purpose

Let an administrator download the current market layout as PNG, JPEG, or PDF
without requiring a server-side rendering service. Export is a snapshot of the
logical market boundary, not a screenshot of the surrounding application UI.

## User Experience

- Add an **Export** dropdown to the Market Map toolbar, available in both View
  and Edit modes. Its three choices are **PNG**, **JPEG**, and **PDF**.
- The export represents the current map state: in Edit mode this includes any
  unsaved draft changes. It never saves or mutates the market as a side effect.
- The output includes the white market boundary, background image/tint,
  elements, labels, and currently derived occupancy dots. It excludes the
  application shell, toolbar, edit tools, popup, selection outline, and resize
  handles.
- File names are `market-map-YYYY-MM-DD.{png|jpg|pdf}`, using the user's local
  calendar date at export time.
- While an export is rendering, disable the Export trigger and show
  **Exporting…**. On failure, show a concise inline error beneath the toolbar;
  no browser alert and no new toast dependency.

## Output Defaults

| Format | Output | Default |
| --- | --- | --- |
| PNG | Lossless bitmap | 2× logical market size, capped at 4096 px on its longest edge |
| JPEG | Compressed bitmap | Same dimensions, quality `0.92`, white background |
| PDF | A4 landscape document | Title, export date, then a proportionally fitted 2× JPEG image with 12 mm margins |

The PDF contains a high-resolution raster image, not vector Konva paths. This
matches the existing canvas renderer and keeps all current element styling and
Lucide-derived paths visually consistent.

## Architecture

### Export seam

Create one deep **MapExport** module behind this interface:

```ts
type MapExportFormat = 'png' | 'jpeg' | 'pdf'

interface MapExportHandle {
  exportMap(format: MapExportFormat): Promise<void>
}
```

`LoadedMarketMapPage` only calls `exportMap(format)` and owns its small UI
state (`isExporting`, `exportError`). It does not know canvas crop geometry,
pixel ratios, download mechanics, or PDF dimensions.

The implementation receives the map's current `MarketLayout` and
`DisplayStall[]` through an off-screen renderer. It renders the same reusable
market scene at logical scale `1`, with no editor-only nodes, then produces one
data URL for all three formats. This is deliberately separate from the live
viewport: pan, zoom, browser dimensions, and current selection must not affect
the exported result.

### Reusable scene

Extract the common Konva market drawing into a scene module shared by:

- interactive `MapCanvas`; and
- an off-screen `MarketExportRenderer`.

The scene receives only market data and presentation flags. `MapCanvas` keeps
all interaction decisions (dragging, selection, resize handles, text editing)
outside that scene, preserving its existing mode-agnostic role.

### Download adapters

PNG and JPEG use Konva's `Stage.toDataURL` with an explicit `pixelRatio`.
The module downloads the returned URL with a temporary anchor element.

PDF is the only new dependency: dynamically import `jspdf` when PDF is chosen,
create one A4 landscape document, add the title/date and fitted JPEG image, then
save once. Use `jspdf@^4.2.1` or newer: `4.2.1` is the current patched release
and should still be probed in a scratch install before changing this project's
dependencies.

## Background Image / CORS Rule

Canvas export fails if a remote `backgroundImageUrl` taints the canvas. Load
market background images with `crossOrigin = 'anonymous'` before assigning
`src`. If the image host does not grant CORS permission, the map may still be
viewable but export must reject with a specific message: **“The background image
does not allow export. Use a CORS-enabled image URL or remove it temporarily.”**

## Explicitly Deferred

- Custom paper size, orientation, resolution, margins, filename, or a print
  settings dialog.
- Multi-page PDFs, legends, scale bars, map metadata, watermarks, and tenant
  contact details.
- Vector PDF/SVG output.
- Server-side or scheduled exports.

## Verification

- `pnpm typecheck` and `pnpm build` succeed.
- Export each format from View and Edit mode; verify the downloaded extension,
  pixel dimensions/page orientation, and that no UI controls or selection state
  appear.
- Export a map with and without a background image; verify both success and the
  CORS-specific failure message using a deliberately non-CORS image URL.
- Verify a background image that loads with CORS appears in all three outputs.
