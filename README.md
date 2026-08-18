# Market Stall Manager

Admin app for managing a market's physical layout. The Market Map page is
fully built (view/edit a market floor plan with stalls and general map
elements); Booking and Dashboard are routed placeholders waiting on their own
design work. Persistence and auth are real: Firebase Authentication
(email/password, no self-registration) gates every route, and the market
layout persists to a single Firestore document. See "Firebase setup" below
before running this anywhere but a fully-configured environment.

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
  the packages; import `HashRouter`/`Routes`/`Route`/`NavLink`/`Outlet`
  straight from `react-router`). Uses `HashRouter`, not `BrowserRouter` —
  this deploys to GitHub Pages, a static host with no server-side rewrite,
  so a hard refresh or direct link to a non-root route (e.g. `/booking`)
  would 404 under `BrowserRouter`. URLs look like
  `.../#/market-map` instead of `.../market-map` as the tradeoff.

No test framework. Verification is `pnpm typecheck` + `pnpm build` + manual
`pnpm dev` checks — smoke-testing the Firebase-backed features (sign-in,
save/load, admin gating) needs a real Firebase project configured per
"Firebase setup" below; `pnpm typecheck`/`pnpm build` alone don't touch that.

## Firebase setup

This app will not boot without real Firebase configuration — see the last
point below before you assume something's broken.

1. **Copy `.env.example` to `.env`** and fill in the six `VITE_FIREBASE_*`
   values from a real Firebase project's Web app config (`apiKey`,
   `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
2. **Create (or pick) a Firebase project** in the
   [Firebase Console](https://console.firebase.google.com), enable
   **Firestore** (Native mode, any region), and add a **Web app** to get
   the config values above.
3. **In Authentication → Sign-in method, enable Email/Password.** Set a
   password policy and enable email-enumeration protection. There is no
   public sign-up screen in this app — accounts are provisioned by an
   admin directly in the Firebase Console.
4. **Create the first admin account** in Firebase Authentication, verify
   its email, then in Firestore create `admins/<ADMIN_UID>` with
   `{ role: "admin" }`. Do this from the Firebase Console — its privileged
   access isn't constrained by the client Firestore rules below, which is
   exactly why it's the only way to bootstrap the first admin.
5. **Publish `firestore.rules`** (already committed at the repo root) via
   the Firebase Console or the CLI (`firebase deploy --only
   firestore:rules`). Until these rules are published, Firestore's default
   rules apply instead and the app's authorization model isn't actually
   enforced server-side.
6. **The app will not boot — it throws at startup — with a blank
   `VITE_FIREBASE_API_KEY`.** That's Firebase's own required behavior, not
   a bug in this codebase; it's expected until you fill in real config.

## Running locally

```bash
pnpm install
pnpm dev
pnpm typecheck   # tsc --noEmit
pnpm build       # tsc --noEmit && vite build
```

## Deploy (GitHub Pages)

`.github/workflows/deploy-pages.yml` builds and deploys to GitHub Pages on
every push to `main` (also runnable manually via the Actions tab's
"Run workflow" button). One-time setup required:

1. **Repo Settings → Pages → Source: "GitHub Actions"** (not "Deploy from a
   branch") — the workflow won't publish anything until this is set.
2. **Add the same six `VITE_FIREBASE_*` values as GitHub Actions secrets**
   (Settings → Secrets and variables → Actions → New repository secret) —
   the CI build has no `.env` (gitignored), and Vite bakes these in at
   build time, so a deploy without them ships a broken (unconfigured)
   Firebase app.

The site publishes to `https://<org>.github.io/market-stall-manager/` — a
project page, not a user/org root page, which is why `vite.config.ts` sets
`base: '/market-stall-manager/'` (asset URLs break without it) and `App.tsx`
uses `HashRouter` (see "Tech Stack" above — GitHub Pages can't rewrite
arbitrary paths back to `index.html` the way Firebase Hosting or a real
server would).

## App structure

```
src/
  App.tsx                  # HashRouter + route table (login route + RequireAuth-gated app routes)
  main.tsx                  # ReactDOM root, wraps <App/> in <AuthProvider>
  auth/
    AuthProvider.tsx         # onAuthStateChanged subscription; exposes useAuth() -> { user, isAdmin, isLoading }
    RequireAuth.tsx          # route wrapper: redirects to /login when signed out, renders <Outlet/> otherwise
  lib/
    firebase.ts              # initializeApp + exported auth/db singletons (Firestore initialized with
                              #   ignoreUndefinedProperties: true — see "Data model" below)
    utils.ts                 # shadcn's cn() helper
  routes/
    AppShell.tsx            # sidebar (Market Map/Booking/Dashboard) + top bar (signed-in email, sign-out) + <Outlet/>
    LoginPage.tsx            # email/password sign-in, forgot-password; no self-registration
    BookingPage.tsx          # placeholder — not designed yet
    DashboardPage.tsx        # placeholder — not designed yet
  components/market-map/
    MarketMapPage.tsx        # loading/error boundary only: loads MapState via marketDoc, then renders
                              #   LoadedMarketMapPage; retry button on load failure
    LoadedMarketMapPage.tsx  # owns all Market Map state once loaded (see below) — undo/redo history,
                              #   save/cancel, all the handlers that used to live directly in MarketMapPage.tsx
    Toolbar.tsx               # always-visible bar: title, mode toggle, zoom controls
    EditToolsPanel.tsx        # floating card (top-right of canvas), Edit Mode only:
                              #   undo/redo, categorized Add Element menu, delete, background-image URL,
                              #   save/cancel, isSaving/saveError UI
    MapCanvas.tsx             # react-konva Stage: pan/zoom/fit-to-screen, market boundary
                              #   + resize handles, element rendering + drag/resize, Text input overlay,
                              #   background-image cover-fit rendering
    StallShape.tsx            # stall, editable Text, or generic icon-in-a-box element
    StallDetailPopup.tsx       # View-Mode-only click popup: status/category/renter/contact
  state/useMapHistory.ts      # generic undo/redo hook, snapshots a whole T (here: MapState)
  data/
    elementTypes.ts            # type/category/icon/color/default-size source of truth
    marketDoc.ts                # loadMarketState/saveMarketState — the one Firestore doc (markets/default),
                                #   with runtime validation of data read back before it reaches Konva
    mockStalls.ts               # DEFAULT_MARKET, mockStalls, nextStallCode, ROW_CAPACITY — used only as the
                                #   seed when markets/default doesn't exist yet
  types/
    stall.ts                  # Stall data used for every placed map element
    market.ts                 # MarketLayout
    marketState.ts             # MapState = { market, stalls } — shared between LoadedMarketMapPage and marketDoc.ts
  components/ui/              # shadcn Button and DropdownMenu
```

Routes: `/login` is public. Everything else (`/` — redirects to
`/market-map` — plus `/market-map`, `/booking`, `/dashboard`) sits behind
`RequireAuth`, which renders `AppShell`'s sidebar/top-bar shell only once
a user is signed in, otherwise redirecting to `/login` and returning them
to their original destination after a successful sign-in.

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

`LoadedMarketMapPage` bundles both into one `MapState = { market, stalls }`
and runs the *whole thing* through one `useMapHistory<MapState>` instance —
market resize, element drag/resize/add/delete, Text-label edits, and background-image changes
all share one undo/redo stack and one Save/Cancel. `MarketMapPage` itself
is just the loading/error boundary that fetches this state (via
`loadMarketState` in `src/data/marketDoc.ts`) before handing it off.

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
  default 50%, without changing element opacity); undo/redo; Save (persists
  `{ market, stalls }` to the `markets/default` Firestore document,
  disabling itself and showing an inline error on failure) / Cancel
  (discards the draft).
- Toolbar (always visible, both modes): title, Edit Mode toggle, zoom
  controls. Everything else lives in the floating `EditToolsPanel`
  (Edit Mode only, top-right over the canvas).

## Known gaps / things a future pass should look at

- `StallDetailPopup` doesn't clamp to the viewport — a stall near the
  right edge can push the popup off-screen.
- Background image: persists to Firestore along with the rest of the
  layout, but there's still no error UI if the URL fails to load (fails
  silently), and a data-URL background would bloat the saved Firestore
  document — URL-only by design.
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

## Design docs

- `docs/superpowers/specs/2026-08-15-market-map-design.md` — original
  Market Map spec (View/Edit, pan/zoom, add/delete, save/cancel)
- `docs/superpowers/plans/2026-08-15-market-map.md` — implementation plan
  for that spec
- `docs/superpowers/plans/2026-08-16-map-elements.md` — implementation plan
  for generalized map elements
- `docs/superpowers/plans/2026-08-17-firebase-integration.md` — implementation
  plan for Firebase Authentication + Firestore persistence, including the
  account/project setup steps condensed into "Firebase setup" above

Everything else (Market Boundary, resize, bushes, app shell/routing,
floating tools panel, stall detail popup, background image) was built
directly in conversation without a separate spec/plan doc — this README
is the up-to-date reference for that work.
