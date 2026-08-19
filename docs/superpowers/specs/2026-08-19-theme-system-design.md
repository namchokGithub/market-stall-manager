# Theme System — Design Spec

Date: 2026-08-19
Status: Approved for implementation planning

## Purpose

Fix the visual mismatch where shadcn's `Button`/`Dialog` components render in a
flat grayscale/neutral palette (shadcn init used `baseColor: "neutral"`) while
the rest of the app uses its own ad-hoc blue accent (`AppShell`'s active-nav
`bg-blue-50 text-blue-700`, `MapCanvas`'s `#2563eb` selection stroke). This is
the first of three UI-polish sub-projects the user asked for (Theme system,
Error snackbar, Confirm dialog); the other two get their own design passes
after this one ships.

## Core Decisions

- **Only `--primary`, `--primary-foreground`, and `--ring` change.**
  `secondary`/`muted`/`accent`/`destructive`/`border`/`card`/`popover`/
  `background`/`foreground` keep their existing shadcn neutral values — they
  aren't part of the reported mismatch, and re-theming them isn't requested.
- **The brand color is the app's existing blue**, not a newly chosen color:
  `#2563eb` (the same blue already used for `MapCanvas`'s selection stroke
  and close to `AppShell`'s nav-active blue) for light mode, `#3b82f6` for
  dark mode (a lighter shade for adequate contrast against the very dark
  background), both paired with white (`--primary-foreground`) button text.
- **Dark mode is a real, working two-state toggle** (light/dark — no
  separate "system" third state in the UI), defaulting from the OS's
  `prefers-color-scheme` on first load when nothing is stored yet, and
  persisted afterward in `localStorage` so the user's explicit choice
  sticks across sessions.
- **Scope covers every page's UI chrome, not just `Button`/`Dialog`.**
  A pre-plan sweep found that almost none of this app's own hand-written
  layout (nav shell, page headers, loading/error boundaries, form labels,
  tables, cards) actually uses the shadcn semantic color tokens
  (`bg-background`/`text-foreground`/`border-border`/etc.) — it's built
  entirely from literal Tailwind utilities (`bg-white`, `text-slate-700`,
  `border-slate-200`, `text-red-600`, ...) across 17 existing UI files. Shipping only
  the CSS-variable change plus a toggle would make Button/Dialog go dark
  while every surrounding page stayed white — worse than not having dark
  mode at all. This plan therefore converts all 17 existing UI files' literal
  chrome-color utility classes to the semantic tokens, using one
  consistent mapping (below), so the toggle actually re-themes the whole
  app consistently. Including the CSS/config/provider/toggle foundation, the
  implementation modifies or creates 22 source files in total.
- **Data/status colors are excluded from the conversion — only generic
  chrome colors move to tokens.** A color that encodes meaning about the
  data itself (the emerald "occupied" badge and booking-bar color, the
  Market Map's blue selection stroke, `ELEMENT_TYPES`' per-category
  colors, the destructive-red on Cancel-style actions once it's the
  `destructive` token) is left alone — converting those would blur
  meaning that has nothing to do with light/dark chrome.
- **`src/components/dashboard/ReportTrendChart.tsx` needs no changes at
  all.** Its own implementation task (an earlier plan) already paired every
  chrome text/background class with a validated `dark:` variant
  (`text-slate-700 dark:text-slate-200`, etc.) — those variants have been
  sitting inert only because no real `dark` class toggle existed yet. This
  plan's toggle activates them for free; touching this file to convert it
  to tokens instead would discard already-tuned, contrast-checked work for
  no benefit.
- **The Konva Market Map canvas itself (`MapCanvas.tsx`'s `Stage`/`Layer`/
  `Rect`/`Stall` fill and stroke props, `StallShape.tsx`) is out of scope.**
  Those are JS color strings passed to Konva shape props, not Tailwind
  classes, and re-theming actual map-drawing colors for dark mode is a
  separate, substantially bigger effort. Only `MapCanvas.tsx`'s outer
  wrapper `<div>` (a plain Tailwind-classed HTML element sitting around the
  canvas) is in scope, since that much is ordinary chrome.
- **No new dependency.** A plain React Context + `localStorage` is enough.
  The existing `darkMode: ['class']` configuration is used as-is. The three
  primary-related Tailwind colour entries must additionally become
  alpha-aware, because this theme uses opacity utilities such as
  `bg-primary/10` and `hover:bg-primary/90`.

## Token Representation and Color Values

Tailwind 3 cannot apply a `/opacity` modifier to a colour configured as the
opaque string `var(--primary)`: it does not emit a usable utility for
`bg-primary/10` or `hover:bg-primary/90`. Store the three primary-related
tokens as RGB channels and have Tailwind wrap them in `rgb(... / <alpha-value>)`.
This still renders the exact intended colours: `37 99 235` is `#2563eb` and
`59 130 246` is `#3b82f6`.

In `tailwind.config.js`, replace the existing primary and ring entries with:
```js
primary: {
  DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
  foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
},
ring: 'rgb(var(--ring) / <alpha-value>)',
```

`src/index.css`, inside the existing `:root` block, change:
```css
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
--ring: oklch(0.708 0 0);
```
to:
```css
--primary: 37 99 235;
--primary-foreground: 255 255 255;
--ring: 37 99 235;
```

Inside the existing `.dark` block, change:
```css
--primary: oklch(0.922 0 0);
--primary-foreground: oklch(0.205 0 0);
--ring: oklch(0.556 0 0);
```
to:
```css
--primary: 59 130 246;
--primary-foreground: 255 255 255;
--ring: 59 130 246;
```
No other CSS variable in either block changes. The config change is limited to
the matching `primary`, `primary.foreground`, and `ring` Tailwind entries; it
preserves opaque usages (`bg-primary`, `text-primary`, `focus:ring-ring`) and
enables their opacity forms.

## Toggle Mechanism

New `src/theme/ThemeProvider.tsx`:
- A `Theme = 'light' | 'dark'` type and a React Context exposing
  `{ theme: Theme; toggleTheme: () => void }`.
- On mount, reads `localStorage.getItem('theme')`. If it's `'light'` or
  `'dark'`, use that. Otherwise, fall back to
  `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`.
- An effect adds or removes the `dark` class on `document.documentElement`
  whenever `theme` changes, and writes the current value to
  `localStorage.setItem('theme', theme)`.
- `useTheme()` hook (co-located in the same file) reads the context; throws
  if used outside the provider, matching this app's existing
  `useAuth()`/`AuthProvider` pattern.

`src/main.tsx` wraps `<ThemeProvider>` around the existing
`<AuthProvider><App /></AuthProvider>` tree (outermost), so the theme
applies to `/login` too, not just authenticated routes.

## UI

A `ThemeToggle` button (sun/moon `lucide-react` icon, swapping based on
current `theme`) added to `AppShell.tsx`'s header, immediately to the left
of the existing "Sign out" button. It uses `Button variant="outline"
size="icon"`, which matches the existing outline treatment while giving the
icon control an appropriate compact footprint.

## Chrome Color Mapping

Applied mechanically wherever these literal Tailwind classes appear in the
17 existing UI files in scope — a plain rename, not a judgment call per site:

| Literal class | Semantic token |
|---|---|
| `bg-white` | `bg-card` |
| `bg-slate-50` / `bg-slate-100` | `bg-muted` |
| `border-slate-200` / `border-slate-100` | `border-border` |
| `border-slate-300` (form input borders specifically) | `border-input` |
| `text-slate-800` / `text-slate-700` | `text-foreground` |
| `text-slate-600` / `text-slate-500` / `text-slate-400` | `text-muted-foreground` |
| `text-red-600` | `text-destructive` |
| `focus:border-blue-400` | `focus:border-primary` |
| `focus:ring-blue-400` | `focus:ring-primary` |
| `accent-blue-600` | `accent-primary` |
| `text-blue-600` (link text) | `text-primary` |
| `bg-blue-50 text-blue-700` (nav active state, as a pair) | `bg-primary/10 text-primary` |
| `hover:bg-slate-100` / `hover:bg-slate-50` | `hover:bg-muted` |
| `hover:text-slate-900` | `hover:text-foreground` |

Not in this table (left untouched, by design — see Core Decisions):
`bg-emerald-100`/`text-emerald-700` (occupied badge), `bg-emerald-500`/
`hover:bg-emerald-600` (booking bar), `text-emerald-600` (login
reset-email confirmation message), `ELEMENT_TYPES`' per-category hex
colors, the Market Map's `#2563eb`/`#dbeafe` selection colors, and
anything inside `ReportTrendChart.tsx`.

## Explicitly Deferred

- Re-theming `MapCanvas.tsx`/`StallShape.tsx`'s Konva shape-prop fill/stroke
  colors, and `BookingTimeline.tsx`'s booking-bar color, for dark mode.
- A three-way "light / dark / system" toggle — two-state only, matching
  what was asked for.
- Any change to `secondary`/`muted`/`accent`/`destructive`/`border`/`card`/
  `popover`/`background`/`foreground`'s underlying CSS *values* — only
  `primary`/`primary-foreground`/`ring` get new colors; everywhere else in
  the mapping table reuses the existing token values as-is.
- Error snackbar/toast and confirm-dialog sub-projects — separate design
  passes, not part of this one.

## Testing / Verification

Same established pattern as the rest of this project (no test framework):
`pnpm typecheck` (zero errors), `pnpm build` (succeeds), then manual
click-through: confirm buttons/focus rings render blue instead of gray in
light mode, click the header toggle and confirm every page's chrome
(nav, headers, dialogs, cards, tables, form inputs, loading/error states)
switches to dark colors together — including the Market Map's toolbar/
panels and the Booking/Dashboard pages' own layout — while the Konva
canvas drawing itself, the booking-bar/occupied-badge colors, and the
trend chart (already dark-aware on its own) look correct in both states.
Reload the page and confirm the choice persisted, and (if easy to
simulate) clear `localStorage` and confirm it falls back to the OS's
light/dark preference on first load.
