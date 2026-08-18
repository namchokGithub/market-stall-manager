# Booking — Design Spec

Date: 2026-08-18
Status: Approved for implementation planning

## Purpose

Turn the routed placeholder `BookingPage` into a real feature: reserve a
`Stall` for a date range, with history retained (cancelled bookings are kept,
not deleted). This is the first of two remaining sub-projects flagged in
`context.md` as unfinished (Booking and Dashboard); Dashboard is out of scope
here and will get its own design pass after this one ships.

## Core Decisions

- **Booking is a date-range reservation, not a permanent renter assignment.**
  A stall can have many bookings over time.
- **No approval workflow.** Creating a booking immediately sets it
  `confirmed`. Only `confirmed` → `cancelled` is a valid transition (no
  delete, so history survives).
- **`Stall.status`/`renterName`/`contact` are removed from the `Stall` type
  and derived entirely from bookings.** A stall is "occupied" only if a
  `confirmed` booking's date range covers today. This is display-only —
  never persisted onto `Stall`.
- **Bookings live in their own Firestore collection (`bookings`), not inside
  the `markets/default` document.** They are independent of the Market
  Map's undo/redo history, Save, and Cancel lifecycle.
- **Double-booking the same stall for an overlapping date range is hard
  blocked**, checked client-side against all `confirmed` bookings for that
  stall before writing. A small race window between two concurrent writers
  is accepted (single/few-admin tool, not worth a Firestore transaction).
- **Booking UI is a custom timeline/Gantt view**, not a third-party calendar
  library — matches this project's pattern of avoiding new dependencies
  unless verified (see `context.md`'s Tailwind/shadcn version-pin history).
- **The Market Map's `StallDetailPopup` becomes read-only for renter info.**
  It shows the active booking's renter/contact if occupied; all
  create/edit/cancel actions happen only on the Booking page.

## Data Model

`src/types/booking.ts`:

```ts
export interface Booking {
  id: string
  stallId: string
  renterName: string
  contact?: string
  startDate: string   // ISO yyyy-mm-dd, inclusive
  endDate: string     // ISO yyyy-mm-dd, inclusive
  status: 'confirmed' | 'cancelled'
  notes?: string
  createdAt: string   // ISO timestamp, set on create
}
```

`src/types/stall.ts` changes: remove `status`, `renterName`, `contact` from
`Stall`. Remaining shape: `id, kind, code, x, y, width, height, category,
label`.

## Firestore Access Layer

`src/data/bookingsRepo.ts` (new, sibling to the existing `marketDoc.ts`):

- `listBookings(): Promise<Booking[]>` — reads the entire `bookings`
  collection. Scale is small enough (single market, human-paced booking
  volume) that fetch-all + client-side filtering is simpler and safer than
  composite range queries.
- `createBooking(input: Omit<Booking, 'id' | 'status' | 'createdAt'>):
  Promise<Booking>` — calls `listBookings()`, checks for any `confirmed`
  booking with the same `stallId` whose date range overlaps
  `[startDate, endDate]`; throws if found. Otherwise writes a new doc
  (`addDoc`/`doc(collection(db, 'bookings'))`) with `status: 'confirmed'`
  and `createdAt: new Date().toISOString()`.
- `cancelBooking(id: string): Promise<void>` — `updateDoc` to set
  `status: 'cancelled'`. Never deletes the document.

Uses the existing `db` from `src/lib/firebase.ts` (already configured with
`ignoreUndefinedProperties: true`, which matters here too since `contact`
and `notes` are optional).

## Market Map Integration

Single integration point: `LoadedMarketMapPage`.

- Loads `bookings` alongside the market/stalls state (parallel fetch on
  mount, same loading/error boundary pattern as `MarketMapPage`).
- Computes `Map<stallId, Booking>` of the active (today-covering,
  `confirmed`) booking per stall.
- Builds a **display-only** stalls array — the real `stalls` in
  `useMapHistory` state is untouched, has no status/renter fields — by
  merging in `status: 'occupied'|'vacant'` and the active booking's
  `renterName`/`contact` purely for what gets passed into `MapCanvas` and
  `StallDetailPopup` as props.
- This preserves `MapCanvas`'s mode-agnostic contract (`README.md`/
  `context.md`): `MapCanvas` itself needs zero changes, it just receives
  stalls that happen to carry a computed `status` for color/popup purposes.

`StallDetailPopup` changes: drop any renter-editing affordance (there isn't
one today, so this is really just confirming the popup stays read-only) and
source `status`/`renterName`/`contact` from the derived stall passed in.

## Booking Page

`src/routes/BookingPage.tsx` gets a Firestore loading boundary identical in
shape to `MarketMapPage` (loading / error+retry / loaded), delegating to a
new `src/components/booking/LoadedBookingPage.tsx`.

Components under `src/components/booking/`:

- **`BookingTimeline`** — one row per `Stall` where `kind === 'stall'`. X
  axis is a scrollable date range (prev/next by week or month). Each
  `confirmed` booking renders as a colored bar spanning its date range on
  its stall's row. Clicking empty space on a row+date opens
  `BookingFormDialog` prefilled with that stall and date. Clicking a bar
  opens a detail view (renter, contact, dates, notes, Cancel button).
- **`BookingFormDialog`** — stall picker (dropdown), `renterName`
  (required), `contact` (optional), start/end date pickers, `notes`
  (optional). Client-side validation: `endDate >= startDate`, then the
  overlap check from `bookingsRepo.createBooking` (surfaced as an inline
  error, not a toast — this project has no toast library).
- **`BookingDetail`** (or a view-mode branch of the same dialog) — shows a
  selected booking's fields plus a Cancel action that calls
  `cancelBooking` and refetches the list.

## Error Handling

Follows `MarketMapPage`'s existing pattern exactly: inline text error
message + a Retry button for the initial load; inline error text inside the
dialog for create/cancel failures (overlap conflict, network error). No new
UI-feedback primitive (toast, alert banner) is introduced.

## Explicitly Deferred

- Approval workflow (`pending` status) — no requirement for it now.
- Firestore transaction-guarded overlap checks — accepted race risk instead.
- Any calendar/Gantt third-party library — custom-built to avoid a repeat
  of the Tailwind v4 / shadcn v4.18 version-mismatch incidents.
- Dashboard — separate sub-project, own design pass.
- Editing an existing booking's dates/renter (only create + cancel exist).
- Recurring/multi-stall bulk bookings.

## Testing / Verification

No test framework in this project (see `context.md`). Same pattern as
elsewhere: `pnpm typecheck` (zero errors), `pnpm build` (watch for
PostCSS/CSS errors — the exact failure mode the Tailwind/shadcn pins guard
against), then manual click-through:

1. Create a booking for a vacant stall → Map popup shows it occupied with
   the right renter/contact.
2. Attempt an overlapping booking for the same stall → blocked with an
   inline error.
3. Cancel a booking → stall returns to vacant on the Map; the cancelled
   booking still exists in Firestore (check the console), it's just no
   longer "active".
4. Timeline prev/next navigation renders the right bars for the visible
   date window.
