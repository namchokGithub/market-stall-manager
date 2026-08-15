# Market Map — Design Spec

Date: 2026-08-15
Status: Approved for implementation planning

## Purpose

Interactive Market Map page for a market-stall management system. Scope for
this iteration is layout creation/editing only — no booking, no vendor,
no payment, no backend. This is the first sub-project of the larger
market-stall-manager app; booking/vendor/payment/auth/API/DB layers are
explicitly out of scope and will be separate future sub-projects.

## Tech Stack

- React + TypeScript
- Vite (scaffold, SPA, no SSR needed)
- pnpm (package manager)
- Tailwind CSS
- shadcn/ui (CLI init, full setup)
- lucide-react (icons — no emoji anywhere)
- konva + react-konva (canvas rendering)
- React state only (useState/useReducer) — no backend, no persistence
  beyond the in-memory session. A later iteration will connect Firebase
  as the persistence layer (no separate REST/API layer planned); this
  iteration keeps the layout data as plain JSON (`Stall[]`) specifically
  so that swap is a localized change to the Save handler, not a
  redesign.

## Data Model

```ts
interface Stall {
  id: string;
  code: string; // e.g. "A01", "A02", "B01"
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Mock data: 15–20 stalls across 3 rows/sections (A, B, C), arranged in a
grid with consistent spacing, each stall ~1.2 x 1.0 units in canvas px
(e.g. 120x100px). Defined as a static module (`src/data/mockStalls.ts`).

## Folder Structure

```
src/
  types/
    stall.ts              # Stall interface
  data/
    mockStalls.ts         # 15-20 mock Stall records
  state/
    useMapHistory.ts       # undo/redo hook: past/present/future Stall[] stacks
  components/
    market-map/
      MarketMapPage.tsx    # top-level: mode, savedLayout, draftLayout, orchestration
      Toolbar.tsx           # toolbar buttons + disabled logic
      MapCanvas.tsx         # react-konva Stage/Layer: pan/zoom/select/drag
      StallShape.tsx        # single stall Rect+Text, selectable/draggable
  App.tsx
```

## State Model

Two top-level layout slots, owned by `MarketMapPage`:

- `savedLayout: Stall[]` — the committed layout. Source of truth for
  View Mode. Initialized from mock data.
- `draftLayout: Stall[]` — working copy, only exists/mutates while in
  Edit Mode.
- `mode: 'view' | 'edit'`

Undo/redo (`useMapHistory`) wraps `draftLayout` as past/present/future
stacks of full `Stall[]` snapshots (dataset is small — 15-20 records —
so whole-array snapshotting is simple and cheap; no need for a diff/
command-pattern history). A new snapshot is pushed on: add stall,
delete stall, stall drag-end (not on every drag-move frame, and not on
pan/zoom/select).

Transitions:

- **Enter Edit Mode** (toggle button, only available in View Mode):
  `draftLayout = deepClone(savedLayout)`, history reset (empty past/
  future, present = draftLayout). `mode = 'edit'`.
- **Save** (Edit Mode only): `savedLayout = draftLayout` (commit),
  `console.log(JSON.stringify(savedLayout, null, 2))` (backend-ready
  payload), `mode = 'view'`. `draftLayout` discarded.
- **Cancel** (Edit Mode only): discard `draftLayout` and history,
  `savedLayout` untouched, `mode = 'view'`.

View Mode renders `savedLayout` (read-only). Edit Mode renders
`draftLayout` (mutable).

## Toolbar

Single persistent toolbar, button order exactly as specified:

`Market Map | View/Edit toggle | Undo | Redo | Add Stall | Delete | Zoom− | 100% | Zoom+ | Reset View | Save | Cancel`

- `Market Map` — static label (page title), not a button.
- `View/Edit toggle` — one button. Shows "Edit Mode" in View Mode
  (click → enter edit). In Edit Mode this button is disabled (must
  Save or Cancel to leave edit — no direct toggle back).
- `Undo` / `Redo` — disabled in View Mode; disabled in Edit Mode when
  no past/future snapshot exists respectively.
- `Add Stall` / `Delete` — disabled in View Mode. In Edit Mode, `Delete`
  additionally disabled when no stall is selected.
- `Zoom−` / `Zoom+` / `Reset View` — enabled in both modes (viewport
  controls, not layout edits).
- `100%` — static label showing current zoom percentage (not a
  button).
- `Save` / `Cancel` — disabled in View Mode; enabled in Edit Mode.

All icons via `lucide-react` (e.g. `Undo2`, `Redo2`, `Plus`, `Trash2`,
`ZoomIn`, `ZoomOut`, `Maximize`, `Save`, `X`, `Pencil`/`Eye` for the
mode toggle). No emoji.

## Canvas Behavior (react-konva)

- `Stage` is draggable (pan) when the pointer is not dragging a stall.
  Empty-area drag pans; stall drag moves the stall.
- Zoom: mouse wheel zooms centered on pointer position; clamp scale to
  a sane range (e.g. 0.3x–3x). Buttons `Zoom−`/`Zoom+` step by a fixed
  increment (e.g. ±10%) around stage center. `Reset View` resets
  scale=1 and position=(0,0) — this affects only the viewport
  (pan/zoom), never the stall layout itself.
- Stall rendering: `Rect` (fill/stroke) + `Text` (stall code, centered).
  Selected stall gets a distinct stroke (e.g. accent color, thicker
  border).
- Select: click a stall selects it (single selection); click empty
  canvas area deselects. Selection only meaningful/interactive in Edit
  Mode — in View Mode stalls are not draggable and click has no select
  behavior (view-only).
- Drag stall (Edit Mode only): on `dragstart`, reorder that stall to
  the end of the draft array (or render it on a separate top Konva
  Layer) so it visually renders above all other stalls while dragging.
  On `dragend`, commit its new x/y into `draftLayout` and push a
  history snapshot.
- Add Stall (Edit Mode only): compute next code (increment the highest
  numeric suffix within the last-used prefix, or start a new prefix if
  needed), insert a new `Stall` at a fixed default position (e.g. stage
  center in stage coordinates) with default width/height matching
  existing stalls, auto-select it, push history snapshot.
- Delete (Edit Mode only): remove the selected stall from
  `draftLayout`, clear selection, push history snapshot.

No resize, no rotate — width/height are fixed at creation and never
mutated by user interaction in this iteration.

## Explicitly Out of Scope

Booking, Vendor, Payment, Dashboard, Stall resize/rotate,
Authentication, API integration, Database, Firebase connection. These
are future sub-projects, each to get its own brainstorm → spec → plan
cycle.

## Testing / Verification

No automated test framework requested for this iteration. Verification
is manual: run the Vite dev server and exercise the golden path (pan,
zoom, enter edit, select, drag, add, delete, undo, redo, save, cancel)
plus edge cases (undo past first snapshot / redo past last are no-ops
because the buttons are disabled at those boundaries; delete with
nothing selected is disabled; save while nothing changed still logs
the layout).

## Documentation

`README.md` (and/or a `docs/context` note) will be created/updated to
describe: tech stack, how to run (`pnpm install`, `pnpm dev`), the
Stall model, mock data location, and current scope/non-scope, so a
future contributor picking up Booking/Vendor/etc. has accurate context.
