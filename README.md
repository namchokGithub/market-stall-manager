# Market Stall Manager

Interactive Market Map for a market-stall management system. This
iteration covers layout creation and editing only — no booking, no
vendor, no payment, no backend.

## Tech Stack

- React + TypeScript
- Vite
- pnpm
- Tailwind CSS
- shadcn/ui
- lucide-react (all icons — no emoji)
- konva / react-konva (canvas rendering)

State is entirely in-memory React state for this iteration. There is
no backend, no API, no database, and no Firebase connection yet — a
future iteration is expected to add Firebase as the persistence layer,
which is why the layout data is kept as plain JSON (`Stall[]`).

## Running locally

```bash
pnpm install
pnpm dev
```

Type-check only (no automated test suite in this iteration):

```bash
pnpm typecheck
```

## Stall model

```ts
interface Stall {
  id: string;
  code: string;   // e.g. "A01", "A02", "B01"
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Mock data (18 stalls across rows A/B/C) lives in
`src/data/mockStalls.ts`, alongside `nextStallCode`, which computes the
next stall code when adding a new stall.

## Market Map page

`src/components/market-map/`:

- `MarketMapPage.tsx` — owns `savedLayout` (View Mode's source of
  truth) and a `useMapHistory` (`src/state/useMapHistory.ts`) instance
  whose `present` value is the Edit Mode working copy (`draftLayout`).
- `Toolbar.tsx` — the button row (mode toggle, undo/redo, add/delete,
  zoom controls, save/cancel), fully controlled by props.
- `MapCanvas.tsx` — react-konva `Stage`/`Layer`: pan, zoom, select,
  drag. Mode-agnostic (`editable: boolean`); the actively-dragged
  stall renders on its own top `Layer` so it stays visually above the
  rest.
- `StallShape.tsx` — a single stall (`Rect` + code `Text`).

When adding another shadcn/ui component, use `pnpm dlx shadcn@3.8.5 add <component>` to maintain Tailwind v3 compatibility, not `@latest` which requires Tailwind v4.

**View Mode:** pan, zoom, see all stalls and their codes. Stalls are
not draggable. An "Edit Mode" button enters Edit Mode.

**Edit Mode:** select a stall, drag to reposition, add a stall,
delete the selected stall, undo/redo, then either **Save** (commits
the draft as the new saved layout and `console.log`s the layout JSON)
or **Cancel** (discards the draft, reverting to the last saved
layout).

## Current scope / non-scope

In scope: Market Map view/edit, pan, zoom, select, drag, add/delete
stall, undo/redo, save/cancel.

Explicitly not built yet (future sub-projects, each to get its own
brainstorm → spec → plan cycle): Booking, Vendor, Payment, Dashboard,
stall resize/rotate, Authentication, API integration, Database,
Firebase connection.

## Design docs

- `docs/superpowers/specs/2026-08-15-market-map-design.md`
- `docs/superpowers/plans/2026-08-15-market-map.md`
