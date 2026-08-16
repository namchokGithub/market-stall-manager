# Market Stall Manager

Admin app for managing a market's physical layout. The Market Map page is
fully built (view/edit a market floor plan with stalls and general map
elements); Booking and Dashboard are routed placeholders waiting on their own
design work. No backend yet — everything lives in React state for the
current browser session.

## Tech Stack

- React + TypeScript + Vite
- pnpm
- Tailwind CSS **v3.4.19** (pinned — `pnpm add tailwindcss` resolves v4 by
  default, which is incompatible with this project's classic
  `postcss.config.js`/`tailwind.config.js`/`@tailwind` setup)
- shadcn/ui — CLI pinned to **`3.8.5`**. `shadcn@latest` (v4+) is a
  ground-up rewrite (Base UI primitives, Tailwind-v4-only CSS) that breaks
  this project's build. Always run
  `pnpm dlx shadcn@3.8.5 add <component>`, never `@latest`.
- lucide-react — all icons, no emoji anywhere (hard rule)
- konva / react-konva — canvas rendering
- react-router (`react-router`, **not** `react-router-dom` — v7+ unified
  the packages; import `BrowserRouter`/`Routes`/`Route`/`NavLink`/`Outlet`
  straight from `react-router`)

No test framework. Verification is `pnpm typecheck` + `pnpm build` + manual
`pnpm dev` checks.

## Running locally

```bash
pnpm install
pnpm dev
pnpm typecheck   # tsc --noEmit
pnpm build       # tsc --noEmit && vite build
```

## App structure

```
src/
  App.tsx                  # BrowserRouter + route table
  routes/
    AppShell.tsx            # sidebar (Market Map/Booking/Dashboard) + top bar + <Outlet/>
    BookingPage.tsx          # placeholder — not designed yet
    DashboardPage.tsx        # placeholder — not designed yet
  components/market-map/
    MarketMapPage.tsx        # owns all Market Map state (see below)
    Toolbar.tsx               # always-visible bar: title, mode toggle, zoom controls
    EditToolsPanel.tsx        # floating card (top-right of canvas), Edit Mode only:
                              #   undo/redo, categorized Add Element menu, delete, background-image URL,
                              #   save/cancel
    MapCanvas.tsx             # react-konva Stage: pan/zoom/fit-to-screen, market boundary
                              #   + resize handles, element rendering + drag/resize, Text input overlay,
                              #   background-image cover-fit rendering
    StallShape.tsx            # stall, editable Text, or generic icon-in-a-box element
    StallDetailPopup.tsx       # View-Mode-only click popup: status/category/renter/contact
  state/useMapHistory.ts      # generic undo/redo hook, snapshots a whole T (here: MapState)
  data/elementTypes.ts        # type/category/icon/color/default-size source of truth
  types/
    stall.ts                  # Stall data used for every placed map element
    market.ts                 # MarketLayout
  data/mockStalls.ts          # DEFAULT_MARKET, mockStalls, nextStallCode, ROW_CAPACITY
  components/ui/              # shadcn Button and DropdownMenu
```

Routes: `/` redirects to `/market-map`. `/market-map`, `/booking`,
`/dashboard` all render inside `AppShell`.

## Data model

```ts
interface MarketLayout {
  width: number
  height: number
  backgroundImageUrl?: string   // rendered cover-fit, clipped to the boundary
  backgroundTint: number        // 0–100; white overlay applied only above the background image
}

type ElementType =
  | 'stall' | 'wall' | 'fence' | 'entrance' | 'exit'
  | 'toilet' | 'parking' | 'trash'
  | 'tree' | 'bush' | 'text' | 'zone'

interface Stall {
  id: string
  kind: ElementType
  code: string                  // e.g. "A01" — '' for non-stall elements
  x: number; y: number          // logical coordinates, relative to market origin (0,0)
  width: number; height: number
  status?: 'vacant' | 'occupied'
  category?: string
  renterName?: string
  contact?: string
  label?: string                // editable text content; Zone also displays it
}
```

`MarketMapPage` bundles both into one `MapState = { market, stalls }` and
runs the *whole thing* through one `useMapHistory<MapState>` instance —
market resize, element drag/resize/add/delete, Text-label edits, and background-image changes
all share one undo/redo stack and one Save/Cancel.

**Important:** `MarketLayout` has no `x`/`y` — its origin is always fixed
at logical `(0, 0)`. Market-boundary resize handles all resize away from
that fixed origin (see `MapCanvas.tsx`'s `handleResizeDragBound`); this is
why market resize behaves differently from stall resize (which has real
`x`/`y` and resizes with the opposite corner anchored — see
`stallResizeHandles`/`axisBounds` in the same file).

## Market Map feature list (all built)

- **View Mode**: pan, zoom, fit-to-screen/center on load and on browser
  resize (unless the user has manually zoomed/panned — see
  `hasManualView` in `MapCanvas.tsx`). Click a stall to open a detail
  popup (status/category/renter/contact) — View Mode only, no-op on
  non-stall elements. Occupied stalls show a small green dot, top-right corner.
- **Edit Mode**: select/drag/resize any element (4-corner handles,
  opposite-corner anchored, clamped live via Konva `dragBoundFunc` so
  nothing can leave the market boundary or shrink below a floor size);
  categorized Add Element menu: Commercial (Stall), Structure (Wall, Fence,
  Entrance, Exit), Facility (Toilet, Parking, Trash), Environment (Tree,
  Bush), and Annotation (Text, Zone). All non-stall types currently render
  as resizable icon-in-a-box elements. Double-click a Text element to edit
  its label in an HTML input overlay; committing on blur/Enter is undo/redo
  and Save/Cancel compatible. Zone has a low-opacity area fill and always
  displays its label. Delete selected; resize the market boundary
  itself (4 corners, all anchored at the fixed origin, can't shrink below
  the current stalls' bounding box); set a background image by URL
  (cover-fit, clipped to the boundary) and adjust its white tint (0–100%,
  default 50%, without changing element opacity); undo/redo; Save (commits +
  `console.log`s `{ market, stalls }`) / Cancel (discards the draft).
- Toolbar (always visible, both modes): title, Edit Mode toggle, zoom
  controls. Everything else lives in the floating `EditToolsPanel`
  (Edit Mode only, top-right over the canvas).

## Known gaps / things a future pass should look at

- `StallDetailPopup` doesn't clamp to the viewport — a stall near the
  right edge can push the popup off-screen.
- Background image: no persistence (lost on reload, same as everything
  else), no error UI if the URL fails to load (fails silently), and a
  data-URL background would bloat the Save Layout console.log — URL-only
  by design.
- No collision detection between map elements (overlap is allowed).
- Wall and Fence are icon-in-a-box elements in v1, not true endpoint-based
  line segments. Zone does not yet support drawing an arbitrary area or
  choosing its fill color; those are separate follow-up designs.
- A polygon-shaped (non-rectangular) market boundary was discussed and
  explicitly deferred — would require replacing `{width,height}` with
  `points: {x,y}[]`, point-in-polygon containment (harder than the
  current min/max rect clamp), and a vertex add/drag/delete UI. Treat as
  its own design pass, not an incremental change.

## What's next (each gets its own brainstorm → design → implementation)

- **Booking page** (`src/routes/BookingPage.tsx`) — no requirements
  gathered yet: what does booking a stall actually mean (date range?
  approval step?), how it relates to `Stall.status`/`renterName`.
- **Dashboard page** (`src/routes/DashboardPage.tsx`) — no requirements
  yet: what metrics/content it should show.
- Eventually: real backend/persistence (currently only an in-memory
  session + a `console.log` on Save).

## Design docs

- `docs/superpowers/specs/2026-08-15-market-map-design.md` — original
  Market Map spec (View/Edit, pan/zoom, add/delete, save/cancel)
- `docs/superpowers/plans/2026-08-15-market-map.md` — implementation plan
  for that spec
- `docs/superpowers/plans/2026-08-16-map-elements.md` — implementation plan
  for generalized map elements

Everything past that plan (Market Boundary, resize, bushes, app shell/
routing, floating tools panel, stall detail popup, background image) was
built directly in conversation without a separate spec/plan doc — this
README is the up-to-date reference for that work.
