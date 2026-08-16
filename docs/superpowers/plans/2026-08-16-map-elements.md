# Map Elements Generalization — Plan

> Not implemented yet. This is the design + task breakdown for turning the
> current Stall/Bush pair into a general "Add Element" system. Confirmed
> with the user: v1 renders every non-stall type as an icon-in-a-box
> (same pattern `Bush` already uses), **not** real line-segments for
> Wall/Fence or a real colored area for Zone — those are explicitly
> flagged as follow-up work below, not silently dropped.

## Goal

Replace the current flat "Add Stall / Add Bush" pair with a categorized
**Add Element** menu covering:

```
Commercial   → Stall
Structure    → Wall, Fence, Entrance, Exit
Facility     → Toilet, Parking, Trash
Environment  → Tree, Bush
Annotation   → Text, Zone
```

Stall keeps all its existing behavior (code, renter/status/category
detail popup, occupied dot). Every other type is a uniform "icon in a
box" element — draggable, resizable, deletable, same as Bush is today —
driven by one static per-type config table so adding a 12th type later
is a config-table edit, not new rendering code.

## Data model

Widen the existing `kind` field (do **not** rename it — every file that
already switches on `stall.kind` keeps working, just gets more cases) and
add one new optional field for the Text element's content:

```ts
// src/types/stall.ts
export type ElementType =
  | 'stall'
  | 'wall' | 'fence' | 'entrance' | 'exit'
  | 'toilet' | 'parking' | 'trash'
  | 'tree' | 'bush'
  | 'text' | 'zone'

export interface Stall {
  id: string
  kind: ElementType          // was: 'stall' | 'bush'
  code: string                // stall only, '' otherwise
  x: number; y: number; width: number; height: number
  status?: 'vacant' | 'occupied'   // stall only
  category?: string                 // stall only — SHOP category (Clothing, Food & Beverage...)
                                     // do NOT confuse with the element-taxonomy category below
  renterName?: string; contact?: string  // stall only
  label?: string                    // NEW — Text element's editable content
}
```

New static config table — one source of truth for the Add Element menu
*and* on-canvas rendering, so `StallShape.tsx` never needs a big
if/else per type:

```ts
// src/data/elementTypes.ts
import type { LucideIcon } from 'lucide-react'
import {
  Store, RectangleHorizontal, Fence, DoorOpen, LogOut,
  Bath, SquareParking, Trash2, TreeDeciduous, TreePine, Type, LandPlot,
} from 'lucide-react'
import type { ElementType } from '../types/stall'

export type ElementCategory = 'commercial' | 'structure' | 'facility' | 'environment' | 'annotation'

export interface ElementTypeInfo {
  category: ElementCategory
  label: string
  icon: LucideIcon
  color: string
  defaultSize: { width: number; height: number }
}

export const ELEMENT_TYPES: Record<ElementType, ElementTypeInfo> = {
  stall:    { category: 'commercial',  label: 'Stall',    icon: Store,               color: '#1e293b', defaultSize: { width: 120, height: 100 } },
  wall:     { category: 'structure',   label: 'Wall',     icon: RectangleHorizontal, color: '#57534e', defaultSize: { width: 100, height: 20 } },
  fence:    { category: 'structure',   label: 'Fence',    icon: Fence,               color: '#78716c', defaultSize: { width: 100, height: 16 } },
  entrance: { category: 'structure',   label: 'Entrance', icon: DoorOpen,            color: '#166534', defaultSize: { width: 60,  height: 40 } },
  exit:     { category: 'structure',   label: 'Exit',     icon: LogOut,              color: '#991b1b', defaultSize: { width: 60,  height: 40 } },
  toilet:   { category: 'facility',    label: 'Toilet',   icon: Bath,                color: '#0369a1', defaultSize: { width: 50,  height: 50 } },
  parking:  { category: 'facility',    label: 'Parking',  icon: SquareParking,       color: '#1d4ed8', defaultSize: { width: 80,  height: 60 } },
  trash:    { category: 'facility',    label: 'Trash',    icon: Trash2,              color: '#57534e', defaultSize: { width: 40,  height: 40 } },
  tree:     { category: 'environment', label: 'Tree',     icon: TreeDeciduous,       color: '#166534', defaultSize: { width: 60,  height: 60 } },
  bush:     { category: 'environment', label: 'Bush',     icon: TreePine,            color: '#166534', defaultSize: { width: 60,  height: 60 } },
  text:     { category: 'annotation',  label: 'Text',     icon: Type,                color: '#1e293b', defaultSize: { width: 120, height: 40 } },
  zone:     { category: 'annotation',  label: 'Zone',     icon: LandPlot,            color: '#a855f7', defaultSize: { width: 160, height: 120 } },
}
```

All 12 icon names verified against the installed `lucide-react` package
before writing this plan (not guessed).

## Rendering (`StallShape.tsx`)

Collapse the current `kind === 'bush' ? <bush-jsx> : <stall-jsx>` into
three branches:

1. `kind === 'stall'` — unchanged: Rect + code Text + occupied dot.
2. `kind === 'text'` — Rect (light background) + an **editable** Text.
   Editing text on a Konva canvas has no native input, so reuse the
   established pattern from `EditToolsPanel`'s URL field: double-click
   (or a small pencil affordance) opens a plain HTML `<input>` positioned
   absolutely over the shape (same absolute-overlay technique
   `StallDetailPopup` already uses), committing `label` through
   `history.commit` on blur/Enter — same as every other edit action, so
   it's undo/redo/save/cancel-compatible for free.
3. everything else (`wall`, `fence`, `entrance`, `exit`, `toilet`,
   `parking`, `trash`, `tree`, `bush`, `zone`) — one generic branch:
   `Rect` (fill = `ELEMENT_TYPES[kind].color` at low opacity, or
   transparent — match Bush's current look) + the type's `icon` rendered
   via the same lucide-source-SVG-path-as-Konva-`Path` technique already
   used for Bush's `TreePine`. This means every new icon needs its raw
   `d` path(s) pulled from `node_modules/lucide-react/dist/esm/icons/
   <name>.mjs` the same way `TreePine`'s was — copy-paste per icon, not
   guessed. Budget ~10 small path-constant blocks (reuse the existing
   `TREE_PINE_*` pattern, one set of constants per icon).

`Zone` gets one deliberate exception even in v1: render at a lower fill
opacity (e.g. 15%) with the label text always visible (not hidden behind
a status popup) since it's meant to read as an area, not a placed object
— cheap to do now, doesn't block the real-area-with-editable-color
version noted in Follow-up Work below.

## Add Element menu (`EditToolsPanel.tsx`)

Replace the current flat "Add Stall" / "Add Bush" buttons with one
"Add Element" trigger that opens a categorized submenu (5 category
headers, types nested under each, icon + label per item — reuse
`ELEMENT_TYPES` directly to render this, so the menu never drifts out of
sync with what's actually renderable). Selecting an item calls one
generalized handler:

```ts
const handleAddElement = (type: ElementType) => {
  const info = ELEMENT_TYPES[type]
  const anchor = clampAnchor(NEW_ELEMENT_ANCHOR, info.defaultSize, draftState.market)
  const newElement: Stall = {
    id: `${type}-${crypto.randomUUID()}`,
    kind: type,
    code: type === 'stall' ? nextStallCode(draftState.stalls) : '',
    x: anchor.x, y: anchor.y, ...info.defaultSize,
  }
  history.commit({ market: draftState.market, stalls: [...draftState.stalls, newElement] })
  setSelectedId(newElement.id)
}
```

This one function replaces both `handleAddStall` and `handleAddBush` in
`MarketMapPage.tsx` — same commit/select pattern, parameterized by type.
No dropdown/menu primitive is installed yet (only shadcn `Button` is) —
either add shadcn's `dropdown-menu` (`pnpm dlx shadcn@3.8.5 add
dropdown-menu` — **pinned version**, see README/ONBOARDING) or hand-roll
a small categorized list the same way `EditToolsPanel` is already a
hand-rolled floating card. Recommend the shadcn component since nested
category submenus are exactly what it's built for.

## Task breakdown

1. `src/types/stall.ts` — widen `kind` to `ElementType`, add `label?`.
2. `src/data/elementTypes.ts` — new file, the `ELEMENT_TYPES` table above.
3. `src/components/market-map/StallShape.tsx` — three-branch render
   (stall / text / generic-icon), pull each new icon's path data from
   `node_modules/lucide-react` per-icon (same technique as `TreePine`).
4. `src/components/market-map/EditToolsPanel.tsx` — Add Element menu
   (shadcn `dropdown-menu`, pinned to `3.8.5`), text-edit affordance for
   the Text element.
5. `src/components/market-map/MarketMapPage.tsx` — `handleAddElement`
   replacing `handleAddStall`/`handleAddBush`; wire text-edit commit.
6. `src/data/mockStalls.ts` — no required change (existing mock stalls
   are unaffected by widening the union), optionally seed 1-2 of each
   new type for visual QA.
7. Verify: `pnpm typecheck` + `pnpm build` + manual click-through per
   type (add, drag, resize, delete, undo/redo, save/cancel) — same
   verification pattern as every prior feature this session.

Roughly the same size as the Bush addition (task 2 in spirit) times
~4, mostly repetitive icon-path plumbing rather than new logic — the
generic-icon branch and `ELEMENT_TYPES` table are what make it not
12x the work.

## Explicitly deferred (do not build now, do not silently skip later)

- **Wall / Fence as real line segments.** v1 is an icon-box like
  everything else. A real version needs two draggable endpoints instead
  of `x/y/width/height`, a different Konva shape (`Line`, not `Rect`),
  and probably its own resize-handle scheme (endpoint handles, not
  4-corner). Bigger than this plan; own design pass.
- **Zone as a real colored area** (user explicitly flagged this as the
  priority follow-up, more than Wall/Fence): editable fill color, no
  fixed default size (likely drawn by drag-a-rectangle rather than
  placed-then-resized), label always-on rendering already done in v1
  above so the upgrade path is mostly "make the fill color user-editable
  and let it be arbitrarily large," not a rewrite.
- **Entrance/Exit semantics** (e.g. snapping to the market boundary
  edge, or being excluded from the "stalls must stay fully inside"
  clamp) were not discussed — v1 treats them as ordinary boxes clamped
  fully inside the boundary like everything else. Revisit if that reads
  wrong once it's on screen.

## Open question for whoever implements this

None blocking — the two scope-defining questions (Wall/Fence/Zone
simplification, Text needing real editable content) were already
resolved with the user before this plan was written. If new ambiguity
comes up mid-implementation, rule on it and note the ruling in a commit
message or here, the way version pins and the Konva drag-layering fix
were documented in ONBOARDING.md.
