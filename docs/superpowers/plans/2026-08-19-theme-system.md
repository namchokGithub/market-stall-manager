# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recolor the shadcn `primary`/`ring` CSS tokens to the app's existing blue brand color, add a real light/dark toggle, and convert every page's hand-written chrome (nav, headers, dialogs, forms, cards, tables, loading/error states) from literal Tailwind colors to the semantic tokens so the toggle actually re-themes the whole app, not just `Button`/`Dialog`.

**Architecture:** Three primary-related CSS variables change in `src/index.css`, and their three matching colour entries in `tailwind.config.js` become alpha-aware (`rgb(var(...) / <alpha-value>)`). This is required for existing `hover:bg-primary/90` and the new `bg-primary/10` to compile correctly in Tailwind 3. A new `ThemeProvider` (React Context + `localStorage`, no new dependency) toggles a `dark` class on `<html>`. A `ThemeToggle` button goes in `AppShell`'s header. Then, mechanically, every literal Tailwind chrome color across 17 existing UI files is renamed to its semantic-token equivalent per one fixed mapping table. The complete implementation modifies or creates 22 source files.

**Tech Stack:** React + TypeScript, Tailwind CSS (existing `darkMode: ['class']` config), no new dependency.

**Spec:** `docs/superpowers/specs/2026-08-19-theme-system-design.md`

## Global Constraints

- **No test framework in this project.** Verification throughout is `pnpm typecheck` (zero errors) + `pnpm build` (zero errors) + a manual click-through per task.
- **No new dependency.**
- **Only `--primary`, `--primary-foreground`, `--ring` get new color *values*.** Every other token (`secondary`/`muted`/`accent`/`destructive`/`border`/`card`/`popover`/`background`/`foreground`) keeps its existing shadcn value. `tailwind.config.js` changes only its matching `primary`, `primary.foreground`, and `ring` entries to `rgb(var(...) / <alpha-value>)`; this enables opacity utilities without changing any other token.
- **The chrome color mapping (apply mechanically, one rename per match, `replace_all` — do not reinterpret per site):**

  | Literal class | Semantic token |
  |---|---|
  | `bg-white` | `bg-card` |
  | `bg-slate-50` / `bg-slate-100` | `bg-muted` |
  | `border-slate-200` / `border-slate-100` | `border-border` |
  | `border-slate-300` (form input borders) | `border-input` |
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

- **Never touch, anywhere in this plan:** `bg-emerald-100`/`text-emerald-700` (occupied badge), `bg-emerald-500`/`hover:bg-emerald-600` (booking bar), `text-emerald-600` (login reset-email message), `ELEMENT_TYPES`' per-category hex colors, the Market Map's `#2563eb`/`#dbeafe` selection colors, anything inside Konva shape props (`fill`/`stroke` on `Rect`/`Stage`/etc.), and anything inside `src/components/dashboard/ReportTrendChart.tsx` (it already has validated `dark:` variants from its own earlier task — this plan's toggle activates them for free, no edits needed).

---

### Task 1: Configure alpha-aware brand tokens

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

**Interfaces:**
- Produces: the exact blue brand colors in both themes, with valid Tailwind 3 opacity utilities for `bg-primary/10` and `hover:bg-primary/90`. Every later task's `text-primary`/`bg-primary`/`focus:ring-primary` etc. class usages depend on this.

- [ ] **Step 1: Make the three primary-related Tailwind colours alpha-aware**

In `tailwind.config.js`, replace:
```js
primary: {
  DEFAULT: 'var(--primary)',
  foreground: 'var(--primary-foreground)'
},
...
ring: 'var(--ring)',
```
with:
```js
primary: {
  DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
  foreground: 'rgb(var(--primary-foreground) / <alpha-value>)'
},
...
ring: 'rgb(var(--ring) / <alpha-value>)',
```

Do not alter any other colour entry. This is required: the previous opaque
`var(...)` definitions do not generate usable slash-opacity utilities in this
Tailwind 3 setup.

- [ ] **Step 2: Recolor the light-mode variables**

In `src/index.css`, inside the `:root` block, change:
```css
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
```
to:
```css
--primary: 37 99 235;
--primary-foreground: 255 255 255;
```
and change:
```css
--ring: oklch(0.708 0 0);
```
to:
```css
--ring: 37 99 235;
```

- [ ] **Step 3: Recolor the dark-mode variables**

Inside the `.dark` block, change:
```css
--primary: oklch(0.922 0 0);
--primary-foreground: oklch(0.205 0 0);
```
to:
```css
--primary: 59 130 246;
--primary-foreground: 255 255 255;
```
and change:
```css
--ring: oklch(0.556 0 0);
```
to:
```css
--ring: 59 130 246;
```

No other line in either block changes.

- [ ] **Step 4: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

`pnpm dev`, look at any existing default `Button` (e.g. Booking page's "New booking" flow, or Market Map's "Edit Mode" button) — its default-variant background should now be blue instead of near-black/gray, its hover shade should be visibly darker, and its focus ring (tab to it) should be blue too. Inspect the compiled CSS or, after Task 3, the active nav state to confirm `hover:bg-primary/90` and `bg-primary/10` are emitted.

- [ ] **Step 6: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat: configure alpha-aware blue primary theme tokens"
```

---

### Task 2: Theme provider and toggle mechanism

**Files:**
- Create: `src/theme/ThemeProvider.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: nothing new (plain React + browser APIs)
- Produces: `export type Theme = 'light' | 'dark'`; `export function ThemeProvider({ children }: { children: ReactNode })`; `export function useTheme(): { theme: Theme; toggleTheme: () => void }` — Task 3's `ThemeToggle` consumes `useTheme()`

- [ ] **Step 1: Write the theme provider**

`src/theme/ThemeProvider.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
```

- [ ] **Step 2: Wrap the app in the provider**

Replace all of `src/main.tsx` with:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Manual check**

No visible UI change yet (no toggle button exists until Task 3) — confirm in the browser console that `document.documentElement.classList` responds if you manually run `localStorage.setItem('theme', 'dark')` and reload; the page should render with `<html class="dark">` (inspect via devtools), even though nothing visually reacts to it yet except the Task 1 CSS variables.

- [ ] **Step 5: Commit**

```bash
git add src/theme/ThemeProvider.tsx src/main.tsx
git commit -m "feat: add ThemeProvider with localStorage-persisted light/dark state"
```

---

### Task 3: Theme toggle button + AppShell chrome conversion

**Files:**
- Create: `src/theme/ThemeToggle.tsx`
- Modify: `src/routes/AppShell.tsx`

**Interfaces:**
- Consumes: `useTheme()` (Task 2, `src/theme/ThemeProvider.tsx`)
- Produces: `export function ThemeToggle()` — a self-contained button, no props, used only here

- [ ] **Step 1: Build the toggle button**

`src/theme/ThemeToggle.tsx`:
```tsx
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
```

- [ ] **Step 2: Wire the toggle into AppShell and convert its chrome colors**

Replace all of `src/routes/AppShell.tsx` with:
```tsx
import { NavLink, Outlet, useLocation } from 'react-router'
import { Map, CalendarCheck, LayoutDashboard } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/theme/ThemeToggle'

const NAV_ITEMS = [
  { to: '/market-map', label: 'Market Map', icon: Map },
  { to: '/booking', label: 'Booking', icon: CalendarCheck },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function AppShell() {
  const location = useLocation()
  const currentPage = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))
  const { user } = useAuth()

  return (
    <div className="flex h-screen w-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="px-4 py-4 text-lg font-semibold text-foreground">Market Stall Manager</div>
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <span className="text-sm font-medium text-foreground">{currentPage?.label ?? ''}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => signOut(auth)}>
              Sign out
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Manual check**

`pnpm dev`, sign in. Click the sun/moon button in the header — the nav sidebar, header bar, and their borders/text should all switch between light and dark together. Reload the page and confirm the choice persisted. The rest of each page's content (Booking/Map/Dashboard bodies) won't fully react yet — that's Tasks 4-7.

- [ ] **Step 5: Commit**

```bash
git add src/theme/ThemeToggle.tsx src/routes/AppShell.tsx
git commit -m "feat: add theme toggle button and convert AppShell to semantic color tokens"
```

---

### Task 4: Auth pages chrome conversion

**Files:**
- Modify: `src/routes/LoginPage.tsx`
- Modify: `src/auth/RequireAuth.tsx`

**Interfaces:**
- Consumes: nothing new — pure class-name changes, no behavior change

- [ ] **Step 1: Convert `LoginPage.tsx`**

In `src/routes/LoginPage.tsx`:

Change the `INPUT_CLASSNAME` constant from:
```ts
const INPUT_CLASSNAME =
  'rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
```
to:
```ts
const INPUT_CLASSNAME =
  'rounded-md border border-input px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary'
```

Change:
```tsx
<div className="flex h-screen w-screen items-center justify-center bg-slate-50">
```
to:
```tsx
<div className="flex h-screen w-screen items-center justify-center bg-muted">
```

Change:
```tsx
className="flex w-80 flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-lg"
```
to:
```tsx
className="flex w-80 flex-col gap-3 rounded-lg border border-border bg-card p-6 shadow-lg"
```

Change:
```tsx
<h1 className="text-lg font-semibold text-slate-800">Sign in</h1>
```
to:
```tsx
<h1 className="text-lg font-semibold text-foreground">Sign in</h1>
```

Change both occurrences (Email label, Password label) of:
```tsx
<label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
```
to:
```tsx
<label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
```

Change:
```tsx
{error && <p className="text-xs text-red-600">{error}</p>}
```
to:
```tsx
{error && <p className="text-xs text-destructive">{error}</p>}
```

Change:
```tsx
className="text-xs text-blue-600 hover:underline disabled:opacity-50"
```
to:
```tsx
className="text-xs text-primary hover:underline disabled:opacity-50"
```

Leave `text-emerald-600` (the reset-confirmation message) unchanged — it's a status color, not chrome.

- [ ] **Step 2: Convert `RequireAuth.tsx`**

In `src/auth/RequireAuth.tsx`, change:
```tsx
<div className="flex h-screen w-screen items-center justify-center text-sm text-slate-500">
```
to:
```tsx
<div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
```

- [ ] **Step 3: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Manual check**

Sign out, then toggle dark mode from a system where `localStorage['theme']` is already `'dark'` from Task 3 (or run `localStorage.setItem('theme', 'dark')` in the console before reloading `/login`, since the toggle button only exists inside the authenticated `AppShell`). Confirm the login page's background, card, inputs, and text all render in dark colors, and the "Invalid email or password" error (trigger it with a wrong password) shows in the destructive-red token's dark-mode shade.

- [ ] **Step 5: Commit**

```bash
git add src/routes/LoginPage.tsx src/auth/RequireAuth.tsx
git commit -m "feat: convert auth pages to semantic color tokens"
```

---

### Task 5: Market Map chrome conversion

**Files:**
- Modify: `src/components/market-map/MarketMapPage.tsx`
- Modify: `src/components/market-map/MapCanvas.tsx`
- Modify: `src/components/market-map/StallDetailPopup.tsx`
- Modify: `src/components/market-map/EditToolsPanel.tsx`
- Modify: `src/components/market-map/Toolbar.tsx`

**Interfaces:**
- Consumes: nothing new — pure class-name changes, no behavior change. `MapCanvas.tsx`'s Konva `Stage`/`Layer`/`Rect`/`StallShape` internals (fill/stroke props) are NOT touched — only its outer wrapper `<div>`s.

- [ ] **Step 1: Convert `MarketMapPage.tsx`'s loading/error boundary**

In `src/components/market-map/MarketMapPage.tsx`, change:
```tsx
<p className="text-sm text-slate-500">Loading market map…</p>
```
to:
```tsx
<p className="text-sm text-muted-foreground">Loading market map…</p>
```
and change:
```tsx
<p className="text-sm text-red-600">{loadError}</p>
```
to:
```tsx
<p className="text-sm text-destructive">{loadError}</p>
```

- [ ] **Step 2: Convert `MapCanvas.tsx`'s outer wrapper**

In `src/components/market-map/MapCanvas.tsx`, this exact class string appears twice (the early-return placeholder div and the real container div around `<Stage>`) — replace both occurrences of:
```
className="relative h-full w-full overflow-hidden bg-slate-100"
```
with:
```
className="relative h-full w-full overflow-hidden bg-muted"
```
Do not change anything inside `<Stage>`/`<Layer>` — every `fill`/`stroke` prop there (e.g. `fill={bgImage ? undefined : '#ffffff'}`, `stroke="#475569"`) is Konva canvas drawing, explicitly out of scope, and stays exactly as-is.

Separately in the same file, `MapCanvas.tsx` also renders a plain HTML `<input>` (not a Konva element — it's the floating text-editing overlay for double-clicked Text labels, a sibling of `<Stage>`) with hardcoded chrome colors. Change:
```
className="absolute rounded border border-blue-500 bg-white px-2 text-center text-slate-800 outline-none ring-1 ring-blue-300"
```
to:
```
className="absolute rounded border border-primary bg-card px-2 text-center text-foreground outline-none ring-1 ring-primary"
```

- [ ] **Step 3: Convert `StallDetailPopup.tsx`**

In `src/components/market-map/StallDetailPopup.tsx`, change:
```tsx
className="absolute z-10 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
```
to:
```tsx
className="absolute z-10 w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
```

Change:
```tsx
<span className="font-semibold text-slate-800">{stall.code}</span>
```
to:
```tsx
<span className="font-semibold text-foreground">{stall.code}</span>
```

Change every occurrence (there are 4: Status/Category/Renter/Contact labels) of:
```tsx
<span className="text-slate-500">
```
to:
```tsx
<span className="text-muted-foreground">
```

Change the vacant-state half of the status badge — this line:
```tsx
isOccupied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
```
to:
```tsx
isOccupied ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
```
(leave the `isOccupied` / emerald half exactly as-is — that's the status color, not chrome).

Change every remaining occurrence (3, on the category/renter/contact *value* spans — the stall-code span was already handled above, since its class string also includes `font-semibold`) of:
```tsx
<span className="text-slate-800">
```
to:
```tsx
<span className="text-foreground">
```

Change:
```tsx
<div className="text-slate-400">No renter — this stall is available.</div>
```
to:
```tsx
<div className="text-muted-foreground">No renter — this stall is available.</div>
```

- [ ] **Step 4: Convert `EditToolsPanel.tsx`**

In `src/components/market-map/EditToolsPanel.tsx`, change:
```tsx
<div className="absolute right-4 top-4 flex w-44 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
```
to:
```tsx
<div className="absolute right-4 top-4 flex w-44 flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-lg">
```

Change both occurrences ("Background URL" label, "Background Tint" label) of:
```
text-xs font-medium text-slate-500
```
to:
```
text-xs font-medium text-muted-foreground
```

Change:
```tsx
className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
```
to:
```tsx
className="rounded-md border border-input px-2 py-1 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
```

Change:
```tsx
className="h-2 w-full cursor-pointer accent-blue-600"
```
to:
```tsx
className="h-2 w-full cursor-pointer accent-primary"
```

Change every occurrence (there are 3, used as dividers) of:
```
className="my-1 h-px bg-slate-200"
```
to:
```
className="my-1 h-px bg-border"
```

Change:
```tsx
<DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-slate-500">
```
to:
```tsx
<DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-muted-foreground">
```

Change:
```tsx
{saveError && (
  <p className="px-1 text-xs text-red-600">{saveError}</p>
)}
```
to:
```tsx
{saveError && (
  <p className="px-1 text-xs text-destructive">{saveError}</p>
)}
```

- [ ] **Step 5: Convert `Toolbar.tsx`**

In `src/components/market-map/Toolbar.tsx`, change:
```tsx
<div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
```
to:
```tsx
<div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
```

Change:
```tsx
<span className="mr-2 font-semibold text-slate-800">Market Map</span>
```
to:
```tsx
<span className="mr-2 font-semibold text-foreground">Market Map</span>
```

Change:
```tsx
<div className="mx-2 h-6 w-px bg-slate-200" />
```
to:
```tsx
<div className="mx-2 h-6 w-px bg-border" />
```

Change:
```tsx
<span className="w-12 text-center text-sm text-slate-600">{zoomPercent}%</span>
```
to:
```tsx
<span className="w-12 text-center text-sm text-muted-foreground">{zoomPercent}%</span>
```

- [ ] **Step 6: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 7: Manual check**

With dark mode on, open Market Map. Confirm the toolbar, the canvas's background area (outside the white market boundary rect), the edit-mode panel, and a stall's detail popup all show dark chrome, while the market boundary rect itself and the stall shapes stay their normal (light) colors — the canvas drawing is intentionally unchanged. Enter Edit mode and confirm the background-URL input, tint slider, and undo/redo/save buttons are all legible and correctly colored.

- [ ] **Step 8: Commit**

```bash
git add src/components/market-map/MarketMapPage.tsx src/components/market-map/MapCanvas.tsx src/components/market-map/StallDetailPopup.tsx src/components/market-map/EditToolsPanel.tsx src/components/market-map/Toolbar.tsx
git commit -m "feat: convert Market Map chrome to semantic color tokens"
```

---

### Task 6: Booking chrome conversion

**Files:**
- Modify: `src/routes/BookingPage.tsx`
- Modify: `src/components/booking/BookingFormDialog.tsx`
- Modify: `src/components/booking/BookingDetailDialog.tsx`
- Modify: `src/components/booking/BookingTimeline.tsx`

**Interfaces:**
- Consumes: nothing new — pure class-name changes, no behavior change

- [ ] **Step 1: Convert `BookingPage.tsx`'s loading/error boundary**

In `src/routes/BookingPage.tsx`, change:
```tsx
<p className="text-sm text-slate-500">Loading bookings…</p>
```
to:
```tsx
<p className="text-sm text-muted-foreground">Loading bookings…</p>
```
and change:
```tsx
<p className="text-sm text-red-600">{loadError}</p>
```
to:
```tsx
<p className="text-sm text-destructive">{loadError}</p>
```

- [ ] **Step 2: Convert `BookingFormDialog.tsx`**

In `src/components/booking/BookingFormDialog.tsx`, every form-field `<label>` uses the exact same class string, once per field (Stall, Renter name, Contact, Total price, Start date, End date, Notes — 7 occurrences total). Replace every occurrence of:
```
text-sm font-medium text-slate-700
```
with:
```
text-sm font-medium text-foreground
```

Every form `<input>`/`<select>` uses one of two class strings depending on whether it also has `w-full`. Replace every occurrence of:
```
w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm
```
with:
```
w-full rounded-md border border-input px-2 py-1.5 text-sm
```

Change:
```tsx
{error && <p className="text-sm text-red-600">{error}</p>}
```
to:
```tsx
{error && <p className="text-sm text-destructive">{error}</p>}
```

- [ ] **Step 3: Convert `BookingDetailDialog.tsx`**

In `src/components/booking/BookingDetailDialog.tsx`, replace every occurrence (there are 4: Contact, Dates, Price, and the conditionally-rendered Notes labels) of:
```
<span className="text-slate-500">
```
with:
```
<span className="text-muted-foreground">
```

Replace every occurrence (there are 3: Contact, Dates, Price values, plus Notes if present — 4 total) of:
```
<span className="text-slate-800">
```
with:
```
<span className="text-foreground">
```

Change:
```tsx
{error && <p className="text-sm text-red-600">{error}</p>}
```
to:
```tsx
{error && <p className="text-sm text-destructive">{error}</p>}
```

- [ ] **Step 4: Convert `BookingTimeline.tsx`**

In `src/components/booking/BookingTimeline.tsx`, change:
```tsx
<div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 sm:px-4">
```
to:
```tsx
<div className="flex items-center justify-between border-b border-border px-3 py-2 sm:px-4">
```

Change:
```tsx
<span className="text-sm font-medium text-slate-700">
```
to:
```tsx
<span className="text-sm font-medium text-foreground">
```

Change:
```tsx
<div className="flex border-b border-slate-200 bg-slate-50">
```
to:
```tsx
<div className="flex border-b border-border bg-muted">
```

Change:
```tsx
className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500"
```
to:
```tsx
className="sticky left-0 z-20 shrink-0 border-r border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground"
```

Change:
```tsx
className="shrink-0 border-l border-slate-100 py-2 text-center text-[10px] text-slate-500"
```
to:
```tsx
className="shrink-0 border-l border-border py-2 text-center text-[10px] text-muted-foreground"
```

Change:
```tsx
<div key={stall.id} className="relative flex border-b border-slate-100" style={{ height: ROW_HEIGHT }}>
```
to:
```tsx
<div key={stall.id} className="relative flex border-b border-border" style={{ height: ROW_HEIGHT }}>
```

Change:
```tsx
className="sticky left-0 z-10 shrink-0 truncate border-r border-slate-100 bg-white px-3 py-2 text-sm text-slate-700"
```
to:
```tsx
className="sticky left-0 z-10 shrink-0 truncate border-r border-border bg-card px-3 py-2 text-sm text-foreground"
```

Change:
```tsx
className="border-l border-slate-100 hover:bg-slate-50"
```
to:
```tsx
className="border-l border-border hover:bg-muted"
```

Leave `bg-emerald-500`/`hover:bg-emerald-600`/`text-white` on the booking bar exactly as-is — that's the status color, not chrome.

- [ ] **Step 5: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 6: Manual check**

With dark mode on, open Booking. Confirm the timeline's header, date columns, stall-row labels, and grid lines are all dark-appropriate, while booking bars stay their emerald color and remain legible against the dark background. Open the create-booking form and the detail/cancel dialog and confirm all labels, inputs, and error text render correctly in dark mode.

- [ ] **Step 7: Commit**

```bash
git add src/routes/BookingPage.tsx src/components/booking/BookingFormDialog.tsx src/components/booking/BookingDetailDialog.tsx src/components/booking/BookingTimeline.tsx
git commit -m "feat: convert Booking chrome to semantic color tokens"
```

---

### Task 7: Dashboard chrome conversion

**Files:**
- Modify: `src/routes/DashboardPage.tsx`
- Modify: `src/components/dashboard/ReportDateRangeControl.tsx`
- Modify: `src/components/dashboard/ReportSummaryCards.tsx`
- Modify: `src/components/dashboard/ReportByStallTable.tsx`
- Modify: `src/components/dashboard/ReportByRenterTable.tsx`

**Interfaces:**
- Consumes: nothing new — pure class-name changes, no behavior change. `src/components/dashboard/ReportTrendChart.tsx` is deliberately NOT in this task's file list — it already has correct `dark:` variants from its own earlier task and needs no edits.

- [ ] **Step 1: Convert `DashboardPage.tsx`'s loading/error boundary**

In `src/routes/DashboardPage.tsx`, change:
```tsx
<p className="text-sm text-slate-500">Loading dashboard…</p>
```
to:
```tsx
<p className="text-sm text-muted-foreground">Loading dashboard…</p>
```
and change:
```tsx
<p className="text-sm text-red-600">{loadError}</p>
```
to:
```tsx
<p className="text-sm text-destructive">{loadError}</p>
```

- [ ] **Step 2: Convert `ReportDateRangeControl.tsx`**

In `src/components/dashboard/ReportDateRangeControl.tsx`, change:
```tsx
<div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
```
to:
```tsx
<div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
```

Change both occurrences (start date input, end date input) of:
```
className="rounded-md border border-slate-300 px-2 py-1 text-sm"
```
to:
```
className="rounded-md border border-input px-2 py-1 text-sm"
```

Change:
```tsx
<span className="text-slate-400">–</span>
```
to:
```tsx
<span className="text-muted-foreground">–</span>
```

Change:
```tsx
{error && <p className="text-sm text-red-600">{error}</p>}
```
to:
```tsx
{error && <p className="text-sm text-destructive">{error}</p>}
```

- [ ] **Step 3: Convert `ReportSummaryCards.tsx`**

In `src/components/dashboard/ReportSummaryCards.tsx`, change:
```tsx
<div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
```
to:
```tsx
<div key={card.label} className="rounded-lg border border-border bg-card p-4">
```

Change:
```tsx
<div className="text-xs font-medium text-slate-500">{card.label}</div>
```
to:
```tsx
<div className="text-xs font-medium text-muted-foreground">{card.label}</div>
```

Change:
```tsx
<div className="mt-1 text-2xl font-semibold text-slate-800">{card.value}</div>
```
to:
```tsx
<div className="mt-1 text-2xl font-semibold text-foreground">{card.value}</div>
```

- [ ] **Step 4: Convert `ReportByStallTable.tsx`**

In `src/components/dashboard/ReportByStallTable.tsx`, change:
```tsx
<h2 className="mb-2 text-sm font-semibold text-slate-700">By stall</h2>
```
to:
```tsx
<h2 className="mb-2 text-sm font-semibold text-foreground">By stall</h2>
```

Change:
```tsx
<tr className="border-b border-slate-200 text-left text-xs text-slate-500">
```
to:
```tsx
<tr className="border-b border-border text-left text-xs text-muted-foreground">
```

Change:
```tsx
<tr key={row.stallId} className="border-b border-slate-100">
```
to:
```tsx
<tr key={row.stallId} className="border-b border-border">
```

Change:
```tsx
<td className="py-1.5 text-slate-800">{row.code}</td>
```
to:
```tsx
<td className="py-1.5 text-foreground">{row.code}</td>
```

Change both occurrences (bookingCount cell, revenue cell) of:
```
className="py-1.5 text-slate-600"
```
to:
```
className="py-1.5 text-muted-foreground"
```

- [ ] **Step 5: Convert `ReportByRenterTable.tsx`**

Apply the exact same 5 changes as Step 4, on the renter-table equivalents:

Change:
```tsx
<h2 className="mb-2 text-sm font-semibold text-slate-700">By renter</h2>
```
to:
```tsx
<h2 className="mb-2 text-sm font-semibold text-foreground">By renter</h2>
```

Change:
```tsx
<tr className="border-b border-slate-200 text-left text-xs text-slate-500">
```
to:
```tsx
<tr className="border-b border-border text-left text-xs text-muted-foreground">
```

Change:
```tsx
<tr key={row.renterName} className="border-b border-slate-100">
```
to:
```tsx
<tr key={row.renterName} className="border-b border-border">
```

Change:
```tsx
<td className="py-1.5 text-slate-800">{row.renterName}</td>
```
to:
```tsx
<td className="py-1.5 text-foreground">{row.renterName}</td>
```

Change both occurrences (bookingCount cell, revenue cell) of:
```
className="py-1.5 text-slate-600"
```
to:
```
className="py-1.5 text-muted-foreground"
```

- [ ] **Step 6: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 7: Manual check**

With dark mode on, open Dashboard. Confirm the date-range control, KPI cards, and both tables all render with dark backgrounds/borders and legible text, and that the trend chart (untouched by this task) already looks correct in dark mode too, since its own `dark:` classes activate automatically now that a real toggle exists. Switch back to light mode and confirm everything still looks exactly as it did before this whole plan started.

- [ ] **Step 8: Commit**

```bash
git add src/routes/DashboardPage.tsx src/components/dashboard/ReportDateRangeControl.tsx src/components/dashboard/ReportSummaryCards.tsx src/components/dashboard/ReportByStallTable.tsx src/components/dashboard/ReportByRenterTable.tsx
git commit -m "feat: convert Dashboard chrome to semantic color tokens"
```
