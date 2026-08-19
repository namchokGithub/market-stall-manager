# Dashboard Report — Design Spec

Date: 2026-08-19
Status: Approved for implementation planning

## Purpose

Turn the routed `DashboardPage` placeholder into a real reporting view over
the Booking data added in the previous sub-project: booking/revenue counts
by stall, by renter, and by date range, plus an occupancy-rate and
cancellation-rate summary. This is the second (and, per `context.md`, last
currently-known) of the two unfinished sub-projects flagged after the
Market Map shipped.

## Core Decisions

- **Metrics cover both activity (counts, occupancy) and money (revenue).**
  This requires adding a price field to `Booking`, entered manually per
  booking at creation time — no per-stall rate table, no per-day proration.
- **"By user" means by renter** (`Booking.renterName`), not by the signed-in
  admin account. No new field needed for this grouping; it already exists.
- **Date range is a preset (Today / This Week / This Month / This Year,
  default This Month) plus a custom start/end override**, not a fixed
  period or an open-ended trend-only view.
- **This is the existing `/dashboard` route's real content**, not a new nav
  item — `DashboardPage.tsx` gets the same loading-boundary treatment
  `MarketMapPage.tsx`/`BookingPage.tsx` already have.
- **All aggregation is client-side, in-memory**, computed from a one-shot
  `listBookings()` + `loadMarketState()` fetch on page load — no new
  Firestore collection, no stored/precomputed stats document. Matches this
  app's existing scale (single market, human-paced booking volume) and its
  established one-shot-fetch pattern (no `onSnapshot`, no real-time sync
  anywhere in this app).
- **CSV export is explicitly deferred** — noted here as a TODO for a future
  plan, not built in this pass.

## Data Model Change

`src/types/booking.ts`: add `totalPrice?: number` to `Booking`. Optional,
not required, because bookings created before this change have no such
field in Firestore and must not break when read — every aggregation
function treats a missing `totalPrice` as `0`. The create-booking form
(`BookingFormDialog.tsx`) makes it a required, positive-number input for
all *new* bookings going forward; the type stays honest about what
existing data can actually contain.

## Metric Definitions — one rule per metric, applied consistently

- **Booking count, revenue, by-stall breakdown, by-renter breakdown, and
  the trend chart** all attribute a booking to whichever bucket contains
  its `startDate` — the full `totalPrice` (or count of 1) goes to that one
  bucket, never split across the days/months a multi-day booking spans.
  Only `status === 'confirmed'` bookings count toward these.
- **Occupancy rate** is the one metric that genuinely needs day-by-day
  coverage, since a single 5-day booking should count as 5 stall-days
  occupied, not 1: for every day in the selected range, for every `Stall`,
  check whether a `confirmed` booking's `[startDate, endDate]` covers that
  day. Occupancy rate = (stall-days occupied) / (stall count × days in
  range) × 100%.
- **Cancellation rate** = (bookings with `status === 'cancelled'` and
  `startDate` in range) / (all bookings — confirmed or cancelled — with
  `startDate` in range) × 100%.

## Date Range Control

Preset buttons: Today, This Week, This Month (default), This Year — each
sets a computed `[start, end]` ISO date pair. A custom start/end date-input
pair overrides the preset. Changing the range recomputes every metric from
the same already-loaded `bookings`/`stalls` arrays — no refetch.

## Page Layout

`src/routes/DashboardPage.tsx` gets the same loading/error/retry boundary
shape as `MarketMapPage.tsx`/`BookingPage.tsx`: parallel
`Promise.all([loadMarketState(), listBookings()])` on mount, delegating to
a new `src/components/dashboard/LoadedDashboardPage.tsx`.

Components under `src/components/dashboard/`:
- **`ReportDateRangeControl`** — the preset buttons + custom date inputs described above.
- **`ReportSummaryCards`** — KPI tiles: total bookings, total revenue, occupancy rate, cancellation rate, for the selected range.
- **`ReportByStallTable`** — one row per `Stall` (`kind === 'stall'`): code, booking count, revenue; sortable by count or revenue.
- **`ReportByRenterTable`** — one row per distinct `renterName` in range: booking count, total revenue; sortable.
- **`ReportTrendChart`** — a bar chart of revenue (or count, toggle) per bucket across the selected range. Bucket granularity auto-picks day buckets for ranges ≤31 days, month buckets for longer ranges. Hand-built (no new charting dependency, matching this project's dependency-caution convention already established for the Booking timeline) — the implementation plan should invoke the **dataviz** skill when building this component for palette/mark-spec guidance, since it's the one genuinely chart-shaped piece of UI in this app so far.

## Data Layer

`src/data/reportStats.ts` (new) — pure functions only, no Firestore access,
operating on already-loaded `Booking[]`/`Stall[]` plus a `{start, end}`
ISO date-range object:
- `computeSummary(bookings, stalls, range)` → `{ totalBookings, totalRevenue, occupancyRate, cancellationRate }`
- `computeByStall(bookings, stalls, range)` → per-stall `{ stallId, code, bookingCount, revenue }[]`
- `computeByRenter(bookings, range)` → per-renter `{ renterName, bookingCount, revenue }[]`
- `computeTrend(bookings, range)` → `{ bucketLabel, revenue, count }[]`, bucketed per the day/month rule above

## Explicitly Deferred

- CSV/export of any kind — TODO for a future plan.
- Price proration across a multi-day booking's span.
- Per-admin-user (as opposed to per-renter) attribution.
- Real-time updates (`onSnapshot`) — consistent with the rest of this app.
- Any stored/precomputed stats document — always computed live from the loaded arrays.

## Testing / Verification

Same established pattern as the rest of this project (no test framework):
`pnpm typecheck` (zero errors), `pnpm build` (succeeds), then manual
click-through: create a couple of bookings with different prices/renters/
dates spanning today, switch between date-range presets and a custom
range, and confirm the KPI numbers, by-stall/by-renter tables, and trend
chart all agree with what was actually booked — in particular, confirm a
multi-day booking counts as one entry in revenue/by-stall/by-renter but as
multiple stall-days in the occupancy-rate calculation.
