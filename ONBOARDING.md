# Onboarding: Market Stall Manager

This doc is for whoever (human or AI agent) picks this project up next.
It explains what exists, why it's built the way it is, and what decisions
are still open. Read `README.md` first for the file-by-file structure —
this doc is the *why*, not the *what*.

## What this project is

An admin app for laying out a physical market: stalls, decorative bushes,
a resizable market boundary, pan/zoom, undo/redo, save/cancel. No backend
yet — a future iteration will add Firebase or similar; until then, "Save"
just commits to React state and `console.log`s the JSON shape a backend
would eventually receive.

## Version pins — do not blindly `add`/`init` these

Two dependency version-mismatches caused real, reproducible build breaks
during development, both discovered by actually running the tool and
reading the error, not by guessing:

1. **`tailwindcss` is pinned to `^3.4.19`.** `pnpm add tailwindcss` today
   resolves v4, which is a different config model (`@theme`/`@utility`
   CSS-native config) incompatible with this project's classic
   `postcss.config.js` (`tailwindcss: {}` as a direct PostCSS plugin) and
   `@tailwind base/components/utilities;` directives in `src/index.css`.
2. **The shadcn CLI is pinned to `3.8.5`.** `pnpm dlx shadcn@latest` (as of
   this writing, v4.18.0) is a ground-up rewrite — Base UI primitives
   instead of Radix, Tailwind-v4-only generated CSS — and breaks the build
   immediately (`CssSyntaxError`). `3.8.5` was verified (in an isolated
   scratch probe, not just read about) to generate classic
   Tailwind-v3-compatible, Radix-based output matching what's already in
   `src/components/ui/button.tsx`. Any future `shadcn add <component>`
   must use `pnpm dlx shadcn@3.8.5 add <component>`.

If you ever need to add a new dependency whose default version might have
moved on since this was written, don't assume — check the changelog or
probe it in a scratch directory before wiring it into the real project,
the way both of the above were verified.

## Architecture decisions worth knowing before you touch the code

- **`MarketLayout` has no `x`/`y`.** Its origin is always logical `(0,0)`.
  This was a deliberate choice to keep the data model minimal (the spec
  only asked for `{width, height}`), but it means market-boundary resize
  can only grow/shrink away from that fixed origin — dragging any of the
  4 corner handles behaves identically (sets width/height directly from
  the handle's drop position) rather than each corner anchoring the
  *opposite* corner. Stalls, by contrast, do have real `x`/`y`, so stall
  resize was built properly opposite-corner-anchored
  (`stallResizeHandles`/`axisBounds` in `MapCanvas.tsx`). If you ever want
  market-boundary resize to feel as "correct" as stall resize, you'd need
  to add `x`/`y` to `MarketLayout` — a real (small) breaking change, not
  a quick fix.
- **One `useMapHistory<MapState>` instance covers everything.**
  `MapState = { market, stalls }`. Undo/redo, Save, and Cancel all operate
  on this single bundled snapshot — market resize, stall drag/resize/add/
  delete, and background-image URL changes are all just different
  `history.commit({ market, stalls })` calls. If you add a new editable
  property to the map, put it on `market` or on a `Stall`, not as separate
  React state, or it won't get undo/redo/save/cancel for free.
- **`MapCanvas` is deliberately mode-agnostic.** It only knows
  `editable: boolean`, never `'view' | 'edit'` as a concept. All
  view/edit-mode *decisions* (what's clickable, what shows) live in
  `MarketMapPage`. Keep it that way — it's what let the stall-detail-
  popup feature (View-Mode-only) get added without touching any of
  `MapCanvas`'s drag/resize/zoom logic.
- **The Konva drag-layering bug (fixed, but worth knowing about).** An
  earlier version tried "render the dragged stall on its own top `Layer`"
  to keep it visually on top while dragging. This broke every drag
  attempt: moving a node's JSX between two different Konva `Layer`s forces
  React to unmount/remount it, and react-konva's `removeChild` calls
  `Node.destroy()`, which stops an in-progress drag and fires a premature
  `dragend`. The fix (still in place, don't revert it) is a single
  `Layer` + calling `e.target.moveToTop()` imperatively on `dragstart` —
  the standard Konva "bring to front while dragging" pattern.
- **All resize/drag clamping uses Konva's `dragBoundFunc`**, which
  receives/returns *absolute* (stage-pixel) coordinates — you have to
  convert your logical bounds through `stagePos + logicalValue * scale`
  before clamping, and Konva converts the clamped result back to the
  node's local coordinates for you. Get this backwards and clamping will
  silently do the wrong thing at any zoom level other than 100%.

## What's genuinely unfinished

- **Booking page and Dashboard page are routed placeholders with zero
  requirements gathered.** Don't guess at what "booking a stall" means —
  ask. Does it need a date range? An approval workflow? Does it relate to
  `Stall.status`/`renterName` (probably yes, but how exactly wasn't
  discussed). Same for Dashboard: no metrics or content were ever
  specified. Both should go through their own brainstorm → design →
  implementation pass, not be inferred from the Market Map's patterns.
- **Polygon-shaped market boundaries** were asked about and explicitly
  deferred (see the design conversation) — it's a real, bigger redesign
  (breaking `MarketLayout` to `points: {x,y}[]`, point-in-polygon
  containment instead of the current min/max rect clamp, a vertex add/
  drag/delete UI with self-intersection prevention). Don't half-do this;
  it needs its own design pass if picked up.
- **No persistence.** Reload the page and everything reverts to
  `mockStalls`/`DEFAULT_MARKET`. Save only `console.log`s. This is
  intentional for now, not a bug to quietly fix — a real persistence
  layer (Firebase or otherwise) is its own future project.
- Known small UX gaps are listed in `README.md`'s "Known gaps" section
  (popup viewport clamping, no collision detection, silent image-load
  failures) — none are urgent, all are easy to find via `grep` for the
  relevant component.

## How to verify changes

No test framework. The pattern used throughout: `pnpm typecheck` (must be
zero errors), `pnpm build` (must succeed, watch for new PostCSS/CSS
errors specifically — that's exactly the failure mode the Tailwind/shadcn
pins guard against), then `pnpm dev` and actually click around if you
have a way to (browser automation tool, or ask whoever you're working
with to smoke-test). Several real bugs in this project (the Konva
drag-layering issue, a `hsl()`/`oklch()` color-token mismatch from the
shadcn CLI) were only caught by careful code reading plus build-output
inspection, not by typecheck alone — typecheck passing is necessary, not
sufficient.
