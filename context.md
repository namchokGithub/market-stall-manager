# Onboarding: Market Stall Manager

This doc is for whoever (human or AI agent) picks this project up next.
It explains what exists, why it's built the way it is, and what decisions
are still open. Read `README.md` first for the file-by-file structure —
this doc is the *why*, not the *what*.

## What this project is

An admin app for laying out a physical market: stalls and other map elements,
a resizable market boundary, pan/zoom, undo/redo, save/cancel. Elements use a
single `Stall` storage shape differentiated by `ElementType`; Stall retains
its renter/status details while other types are visual layout objects.
Persistence is real: Firebase Authentication (email/password, no
self-registration) protects every route, and "Save" writes the whole
`{ market, stalls }` snapshot to a single Firestore document
(`markets/default`) via `src/data/marketDoc.ts`. See `README.md`'s
"Firebase setup" section to get a fresh clone actually running.

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
   `DropdownMenu` is now installed and uses Radix's
   `@radix-ui/react-dropdown-menu`, matching this same Tailwind-v3 setup.
3. **Keep the alpha-aware primary token configuration.** In
   `tailwind.config.js`, `primary`, `primary.foreground`, and `ring` use
   `rgb(var(...) / <alpha-value>)`, while `src/index.css` supplies RGB
   channels (not a complete `#hex` or `oklch(...)` colour) for those three
   variables. This is load-bearing in Tailwind v3: it makes
   `bg-primary/10` and `hover:bg-primary/90` generate valid CSS. Do not
   simplify those entries to plain `var(--primary)` unless all slash-opacity
   uses are removed or the configuration is redesigned.

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
  delete, Text label edits, background-image URL changes, and background tint
  changes are all just different
  `history.commit({ market, stalls })` calls. If you add a new editable
  property to the map, put it on `market` or on a `Stall`, not as separate
  React state, or it won't get undo/redo/save/cancel for free.
- **`MapCanvas` is deliberately mode-agnostic.** It only knows
  `editable: boolean`, never `'view' | 'edit'` as a concept. All
  view/edit-mode *decisions* (what's clickable, what shows) live in
  `LoadedMarketMapPage` (`MarketMapPage` itself is only the Firestore
  loading/error boundary now — see below). Keep it that way — it's what
  let the stall-detail-popup feature (View-Mode-only) get added without
  touching any of `MapCanvas`'s drag/resize/zoom logic.
- **Map elements are config-driven.** `src/data/elementTypes.ts` is the
  source of truth for each `ElementType`'s category, label, Lucide icon,
  color, and default size. The Add Element menu and canvas rendering both
  rely on it, so adding another box-style type starts with one config entry.
  `StallShape.tsx` holds the raw Lucide SVG path data needed by Konva; copy
  it from the installed `lucide-react` icon source rather than guessing.
- **Text uses an HTML overlay, not Konva text editing.** Double-clicking a
  Text element opens a positioned `<input>` over the canvas in `MapCanvas`.
  Blur or Enter commits `label` via `LoadedMarketMapPage`, keeping it in the
  same history, Save, and Cancel lifecycle. Escape dismisses without committing.
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
- **Theme is global and client-persisted.** `ThemeProvider` wraps the app
  outermost in `main.tsx`, so both authenticated routes and `/login` receive
  the theme. It restores only `'light'` or `'dark'` from `localStorage['theme']`;
  otherwise it adopts `prefers-color-scheme` on first load. Its effect owns
  the `dark` class on `<html>`. Keep new generic UI chrome on semantic
  Tailwind classes (`bg-card`, `text-foreground`, `border-border`,
  `text-muted-foreground`, etc.) so it follows the theme. Status/data
  colors and Konva shape-prop colors remain intentionally independent.
  `src/index.css` also sets `color-scheme: light` on `:root` and
  `color-scheme: dark` on `.dark`; this is what makes native controls such
  as `<input type="date">` render a matching calendar popup.

## What's genuinely unfinished

- **Theme system now exists** — see
  `docs/superpowers/specs/2026-08-19-theme-system-design.md` and
  `docs/superpowers/plans/2026-08-19-theme-system.md`. It changes the
  primary/ring brand color, adds a persisted two-state light/dark toggle,
  and converts app chrome to semantic tokens. Map canvas drawing colors,
  booking bars/occupied badges, and the trend chart's already tuned dark
  variants are deliberately out of scope for that pass.
- **Booking now exists** — full design and implementation pass, see
  `docs/superpowers/specs/2026-08-18-booking-design.md` (spec) and
  `docs/superpowers/plans/2026-08-18-booking.md` (plan). `Stall.status`/
  `renterName`/`contact` are no longer persisted fields on `Stall` itself;
  they're derived per-render from `bookings` via
  `src/data/bookingOccupancy.ts`'s `withOccupancy`, and carried on the
  render-only `DisplayStall` type.
- **Dashboard now exists** — full design and implementation pass, see
  `docs/superpowers/specs/2026-08-19-dashboard-report-design.md` (spec) and
  `docs/superpowers/plans/2026-08-19-dashboard-report.md` (plan). It's a
  read-only report computed client-side (`src/data/reportStats.ts`) over the
  already-loaded `Booking[]`/`Stall[]` arrays for a selected date range
  (preset buttons or a validated custom start/end override): KPI summary
  (bookings, revenue, occupancy rate, cancellation rate), by-stall and
  by-renter breakdown tables, and a revenue/bookings trend chart bucketed by
  day or month depending on the range length. No new Firestore collection
  and no stored/precomputed stats document — everything recomputes from the
  one-shot `listBookings()`/`loadMarketState()` fetch already used elsewhere.
- **Polygon-shaped market boundaries** were asked about and explicitly
  deferred (see the design conversation) — it's a real, bigger redesign
  (breaking `MarketLayout` to `points: {x,y}[]`, point-in-polygon
  containment instead of the current min/max rect clamp, a vertex add/
  drag/delete UI with self-intersection prevention). Don't half-do this;
  it needs its own design pass if picked up.
- **Wall/Fence and Zone are intentionally simplified.** Wall/Fence are
  ordinary resizable icon boxes, not lines with draggable endpoints. Zone is
  a low-opacity resizable box with an always-visible label, not a drawn area
  with editable fill color. The latter is the higher-priority follow-up.
- **Persistence exists now — don't reintroduce the old console.log-only
  behavior.** Save writes `{ market, stalls }` to Firestore
  (`markets/default`) via `saveMarketState` in `src/data/marketDoc.ts`;
  load reads that same document and falls back to
  `mockStalls`/`DEFAULT_MARKET` only when it doesn't exist yet (first run).
  `src/lib/firebase.ts`'s `db` is created with
  `initializeFirestore(app, { ignoreUndefinedProperties: true })` rather
  than plain `getFirestore(app)` — this is load-bearing: `MarketLayout` and
  `Stall` both have optional fields, and without this option `setDoc`
  throws synchronously the instant one of those fields is set to
  `undefined` instead of omitted. Still explicitly out of scope: real-time
  sync (`onSnapshot`), multi-market support, and Firebase Storage image
  upload — see `docs/superpowers/plans/2026-08-17-firebase-integration.md`'s
  "Explicitly deferred" section.
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
