# Firebase Integration — Plan

> Not implemented yet. This replaces "Save just `console.log`s JSON" and
> "initial layout is always `mockStalls`/`DEFAULT_MARKET`" with real
> persistence in Firestore, protected by Firebase Authentication using
> email and password. Everything else (undo/redo, drag/resize, Add
> Element, background image/tint) stays exactly as-is. Authentication is
> added at the app boundary; Firestore still only touches map load/save.

## What you need to do first (outside this codebase)

I can't create Firebase resources or credentials for you — these are
account-level actions only you can do:

1. Create (or pick) a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable **Firestore** (Native mode, any region — this app makes one
   document, region doesn't matter yet).
3. Add a **Web app** to the project and copy its config object
   (`apiKey`, `authDomain`, `projectId`, etc.).
4. In **Authentication → Sign-in method**, enable **Email/Password**.
   Set a password policy and enable email-enumeration protection.
5. Create the first administrator account in Firebase Authentication,
   verify its email, and record its Firebase UID. This v1 deliberately
   has no public sign-up screen; accounts are provisioned by an admin in
   the Firebase Console.
6. In Firestore, create `admins/<ADMIN_UID>` with `{ role: "admin" }`.
   Do this from the Firebase Console before publishing the restrictive
   rules below; the Console's privileged access is not constrained by
   client Firestore rules.

Once you have the config values and the initial admin UID, give them to
whoever implements this (or paste the config into `.env` yourself per
the format below). The admin UID belongs in the Firestore `admins`
document, never in client environment variables.

## Scope and state boundaries

`MarketMapPage.tsx` already treats the whole layout as one plain-JSON
blob: `MapState = { market: MarketLayout, stalls: Stall[] }`. Undo/redo
operates entirely client-side on `draftState`; `savedState` is only
ever *read* (for View Mode and as the reset point for Edit Mode) and
*replaced wholesale* (on Save). Firestore therefore only persists this
one state object, but the loading boundary needs a small component split
so that `useMapHistory` is never initialized with `null`:

- **Initial load**: `useState<MapState>({ market: DEFAULT_MARKET, stalls:
  mockStalls })` becomes "fetch the one document, fall back to the mock
  seed if it doesn't exist yet."
- **Save**: snapshot `draftState`, persist that snapshot with `setDoc`,
  and only then replace `savedState` and leave Edit Mode. The console.log
  is removed since it was always a stand-in for exactly this call.

`MapCanvas.tsx`, `StallShape.tsx`, and `useMapHistory.ts` need no change.
`EditToolsPanel.tsx` needs the small prop/UI change required to disable
Save while a write is in flight and to show a save error. Authentication
adds a login page, an auth-state provider, and a protected app route;
it does not alter the map editor's data model.

## Architecture (v1 — single market, email/password admin auth)

- **One Firestore document**, not a collection query:
  `markets/default` (a fixed, hardcoded doc ID). There's no multi-market
  or multi-tenant concept anywhere else in this app yet — don't add one
  here either. If multi-market ever becomes real, this is the one place
  that changes (swap the hardcoded `'default'` for a real market ID from
  routing/auth), not a redesign.
- **One-shot read/write** (`getDoc`/`setDoc`), not a live
  `onSnapshot` subscription. There's no multi-admin-editing-at-once
  requirement established anywhere in this project — real-time sync is
  a legitimate future upgrade (see below) but would add merge-conflict
  questions (what happens if two admins Save at once?) this plan
  deliberately doesn't answer yet.
- **Email/password sign-in, no self-registration.** `onAuthStateChanged`
  is the single source of truth for the signed-in user. Unauthenticated
  visitors see `/login`; all existing app routes are protected.
- **Admin authorization is separate from authentication.** Signing in
  proves identity; only a UID with an `admins/<uid>` Firestore document
  may write the map. This prevents every account created in Firebase
  Authentication from becoming an editor.

## Data model in Firestore

Document `markets/default`:

```ts
{
  market: MarketLayout,   // same shape already in src/types/market.ts
  stalls: Stall[],        // same shape already in src/types/stall.ts
  updatedAt: <Firestore server timestamp>,
}
```

No schema translation is needed when saving — `draftState` is already
exactly `{ market, stalls }`. On read, do not cast Firestore's untrusted
`DocumentData` directly to `MapState`: validate the required market
numbers and stalls array first. If the document is malformed, surface a
load error rather than passing invalid data to Konva. `updatedAt` is the
one new field, useful later for "last saved at" UI or detecting a stale
local copy; not required for v1 to function, cheap to add now.

## Code changes

1. **`pnpm add firebase`** (modular v9+ SDK — `import { initializeApp }
   from 'firebase/app'`, `import { getFirestore, doc, getDoc, setDoc } from
   'firebase/firestore'`). Verify the install the same way every other
   dependency in this project has been verified — `pnpm typecheck` +
   `pnpm build` — before trusting it; this SDK doesn't have the kind of
   major-version-rewrite history Tailwind/shadcn did in this project, but
   don't skip the check on that assumption alone.
2. **`src/lib/firebase.ts`** (new) — `initializeApp(firebaseConfig)` +
   export singleton `auth = getAuth(app)` and `db = getFirestore(app)`.
   `firebaseConfig` reads
   from `import.meta.env.VITE_FIREBASE_*` (Vite only exposes env vars
   prefixed `VITE_` to client code — see `.env` below).
3. **`.env.example`** (new, committed) documenting the required keys:
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```
   Real values go in `.env` (already gitignored — confirmed
   `.env`/`.env.*` are in this repo's `.gitignore`, so this is safe as-is,
   no gitignore change needed).
4. **`src/auth/AuthProvider.tsx`** (new) — subscribe once with
   `onAuthStateChanged(auth, ...)`. For a signed-in user, read only that
   user's `admins/<uid>` document and expose `{ user, isAdmin, isLoading }`
   via a `useAuth()` hook. Wrap the router in this provider in `main.tsx`.
   While auth state or role lookup is unresolved, render a loading state;
   never render a protected route optimistically.
5. **`src/routes/LoginPage.tsx`** (new) — email and password form using
   `signInWithEmailAndPassword`. Provide a generic failed-login message
   rather than exposing whether an email exists. Include a "Forgot
   password?" action using `sendPasswordResetEmail`, with a neutral
   confirmation message. There is no `createUserWithEmailAndPassword`
   path or registration link in v1.
6. **`App.tsx` and `AppShell.tsx`** — add a `RequireAuth` route wrapper
   that redirects unauthenticated users to `/login` and returns them to
   their intended route after success. Add a sign-out control that calls
   `signOut(auth)` and displays the signed-in email. Keep `/login` outside
   `AppShell`.
7. **`src/types/marketState.ts`** (new) — export the shared
   `MapState` type. It currently lives only inside `MarketMapPage.tsx`,
   so `marketDoc.ts` cannot safely use it without moving it.
8. **`src/data/marketDoc.ts`** (new) — two small functions:
   `loadMarketState(): Promise<MapState>` (get the doc, validate its
   data, or return `{ market: DEFAULT_MARKET, stalls: mockStalls }` only
   when it does not exist) and `saveMarketState(state: MapState):
   Promise<void>` (`setDoc` with `updatedAt: serverTimestamp()`). A read
   failure (offline, permission-denied, invalid config) and malformed
   document must be thrown to the page, not silently replaced with seed
   data. The seed is local until the first successful Save; this plan
   deliberately does not auto-write it during load.
9. **`MarketMapPage.tsx`** — make it a loading/error boundary:
   - Hold `loadedState: MapState | null`, `loadError`, and a retry action.
     On mount, call `loadMarketState`; show a centered loading state while
     pending and an error plus Retry button if it fails.
   - Once loaded, render a new `LoadedMarketMapPage` child with the state
     as its initial value. That child owns `savedState` and calls
     `useMapHistory<MapState>(savedState)`. This respects React's hook
     rules and prevents history from being initialized with `null`.
   - Make `handleSave` async. Capture `const stateToSave = draftState`,
     clear any previous error, and set `isSaving`. Await
     `saveMarketState(stateToSave)`; only on success set
     `savedState(stateToSave)`, clear selection/detail state, and enter
     View Mode. On failure, retain Edit Mode and the draft for retry, set
     a readable error, then clear `isSaving` in `finally`.
10. **`EditToolsPanel.tsx`** — add `isSaving` and `saveError` props.
   Disable Save while saving (and label it e.g. "Saving…") so duplicate
   writes cannot race. Show the inline error near the Save button. Keep
   editing controls enabled during a failed save; the next Save captures
   the latest draft.
11. **`Toolbar.tsx` and `MarketMapPage.tsx`** — use `isAdmin` from
    `useAuth()` to disable Edit Mode for non-admins. The Firestore rule
    remains the enforcement layer; this is only the clear client-side UX.

## Security rules

Publish rules that deny everything by default, allow signed-in users to
read the market, and allow only provisioned admins to write it:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == "admin";
    }

    match /markets/default {
      allow read: if signedIn();
      allow create, update, delete: if isAdmin();
    }

    match /admins/{adminId} {
      allow get: if signedIn() && request.auth.uid == adminId;
      allow list, create, update, delete: if false;
    }
  }
}
```

The `admins` collection is provisioned only through the Firebase Console
or a future trusted server/admin workflow, never by browser code. Firebase
Web config values are public client configuration, not a security boundary;
Firebase Authentication plus Firestore rules enforce access.

## Explicitly deferred

- **Image upload via Firebase Storage.** The background-image feature is
  URL-paste only (see `EditToolsPanel.tsx`); Storage would let someone
  upload a file directly instead of hosting it elsewhere first. Bigger
  than this plan (needs an upload UI, progress state, and a Storage
  security-rules decision of its own) — own follow-up.
- **Real-time sync (`onSnapshot`)** instead of one-shot load/save —
  only matters once multiple admins edit concurrently, which isn't an
  established requirement yet.
- **Multi-market support** — swap the hardcoded `'default'` doc ID for a
  real per-market ID once there's a reason to have more than one market.
- **Offline persistence** (`enableIndexedDbPersistence`) — worth adding
  once this is a real deployed app people rely on; skip for v1.

## Task breakdown

1. You: create the Firebase project + Firestore + Web app config, enable
   Email/Password Authentication, create/verify the first admin account,
   and create `admins/<ADMIN_UID>` as specified above.
2. `pnpm add firebase`, verify with `pnpm typecheck`/`pnpm build`.
3. `src/lib/firebase.ts` + `.env.example` + your real `.env`.
4. Implement `AuthProvider`, `LoginPage`, the protected-route flow, and
   sign-out. Verify login failure, successful login, refresh persistence,
   redirect-after-login, sign-out, and password-reset confirmation.
5. Publish the restrictive Firestore rules and verify a signed-in
   non-admin can view but cannot enter Edit Mode or write when attempting
   a direct Firestore call, while the provisioned admin can edit and save.
6. Add `src/types/marketState.ts`, then `src/data/marketDoc.ts` with
   validation, explicit missing-document seed behavior, and thrown read
   errors.
7. Implement `MarketMapPage.tsx`'s loading/error boundary and its loaded
   editor child. Then add the save state/error props and UI to
   `EditToolsPanel.tsx`.
8. Verify: `pnpm typecheck` + `pnpm build`, then manually confirm in a
   browser: initial missing-document seed; edit, Save, reload and confirm
   persistence; denied/offline load then Retry; denied/offline Save retains
   the draft and permits retry; and repeated clicks while Saving yield one
   write.
