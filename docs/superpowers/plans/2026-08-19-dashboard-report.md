# Dashboard Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the routed `DashboardPage` placeholder into a real reporting view: booking counts and revenue by stall and by renter, an occupancy-rate and cancellation-rate summary, and a trend chart — all over a selectable date range (preset or custom).

**Architecture:** A small data-model addition (`Booking.totalPrice`, entered manually per booking), a new pure-function stats module (`src/data/reportStats.ts`) plus date-range helpers added to the existing `src/lib/dates.ts`, and a `DashboardPage.tsx` that follows the same Firestore-loading-boundary pattern already used by `MarketMapPage.tsx`/`BookingPage.tsx`. All aggregation is computed client-side, in-memory, from a one-shot `listBookings()` + `loadMarketState()` fetch — no new Firestore collection, no rules change (the existing `bookings` create rule only requires specific fields be present/typed correctly; it doesn't forbid the new optional `totalPrice` field).

**Tech Stack:** React + TypeScript, existing Firebase/Firestore data layer (`src/data/bookingsRepo.ts`, `src/data/marketDoc.ts`), Tailwind (existing), no new third-party dependency.

**Spec:** `docs/superpowers/specs/2026-08-19-dashboard-report-design.md`

## Global Constraints

- **No test framework in this project.** Verification throughout is `pnpm typecheck` (zero errors) + `pnpm build` (zero errors) + a manual click-through per task — this repo's own established pattern.
- **`Booking.totalPrice` is optional** (`totalPrice?: number`) so bookings created before this feature (which have no such field in Firestore) don't break any read path — every aggregation function must treat a missing `totalPrice` as `0`. The create-booking form makes it a required, positive-number input for all new bookings going forward.
- **No new Firestore collection, no `firestore.rules` change.** All reporting reads reuse `listBookings()`/`loadMarketState()`; all aggregation is pure, client-side, in-memory.
- **No new third-party charting/date-picker dependency.** The trend chart is hand-built, matching the Booking timeline's precedent.
- **One counting rule per metric, exactly as the spec defines it — do not blend them:**
  - Booking count, revenue, by-stall, by-renter, and the trend chart all attribute a `confirmed` booking to the bucket containing its `startDate` (full amount, no proration across the days it spans).
  - Occupancy rate alone needs real day-by-day coverage: for every day in the selected range, for every `Stall`, check whether a `confirmed` booking's `[startDate, endDate]` covers that day.
  - Cancellation rate = cancelled-with-`startDate`-in-range / all-(confirmed-or-cancelled)-with-`startDate`-in-range.
- **CSV export is out of scope for this plan** — a future TODO, not a task here.

---

### Task 1: Add `totalPrice` to Booking (data model + create form)

**Files:**

- Modify: `src/types/booking.ts`
- Modify: `src/data/bookingsRepo.ts`
- Modify: `src/components/booking/BookingFormDialog.tsx`

**Interfaces:**

- Consumes: existing `Booking`/`NewBookingInput` types and `createBooking()` (all pre-existing, this task only adds one field to each)
- Produces: `Booking.totalPrice?: number`; `NewBookingInput.totalPrice: number` (required for new bookings) — later tasks (`reportStats.ts`) read `booking.totalPrice ?? 0`

- [ ] **Step 1: Add the field to the `Booking` type**

In `src/types/booking.ts`, add `totalPrice?: number` (with a one-line comment explaining why it's optional) so the full interface reads:

```ts
export interface Booking {
  id: string;
  stallId: string;
  renterName: string;
  contact?: string;
  totalPrice?: number; // optional: bookings created before this field existed have none
  startDate: string; // ISO yyyy-mm-dd, inclusive
  endDate: string; // ISO yyyy-mm-dd, inclusive
  status: "confirmed" | "cancelled";
  notes?: string;
  createdAt: string; // ISO timestamp, set on create
}
```

- [ ] **Step 2: Add the field to `NewBookingInput`**

In `src/data/bookingsRepo.ts`, change:

```ts
export type NewBookingInput = {
  stallId: string;
  renterName: string;
  contact?: string;
  startDate: string;
  endDate: string;
  notes?: string;
};
```

to:

```ts
export type NewBookingInput = {
  stallId: string;
  renterName: string;
  contact?: string;
  totalPrice: number;
  startDate: string;
  endDate: string;
  notes?: string;
};
```

No other change to this file — `createBooking` already spreads `input` into the new booking document, so `totalPrice` flows through automatically. The existing `firestore.rules` `bookings` create rule only requires specific fields be present/typed; it doesn't restrict which extra fields may be written, so `totalPrice` needs no rules change.

- [ ] **Step 3: Add the price input to the create-booking form**

Replace all of `src/components/booking/BookingFormDialog.tsx` with:

```tsx
import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createBooking } from "../../data/bookingsRepo";
import type { Stall } from "../../types/stall";

interface BookingFormDialogProps {
  stalls: Stall[];
  initialStallId: string;
  initialDate: string;
  onClose: () => void;
  onCreated: () => void;
}

export function BookingFormDialog({
  stalls,
  initialStallId,
  initialDate,
  onClose,
  onCreated,
}: BookingFormDialogProps) {
  const [stallId, setStallId] = useState(initialStallId);
  const [renterName, setRenterName] = useState("");
  const [contact, setContact] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    const trimmedRenterName = renterName.trim();
    if (!trimmedRenterName) {
      setError("Renter name is required.");
      return;
    }

    const parsedPrice = Number(totalPrice);
    if (
      totalPrice.trim() === "" ||
      Number.isNaN(parsedPrice) ||
      parsedPrice <= 0
    ) {
      setError("Total price must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBooking({
        stallId,
        renterName: trimmedRenterName,
        contact: contact || undefined,
        totalPrice: parsedPrice,
        startDate,
        endDate,
        notes: notes || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Reserve a stall for a date range.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-stall">
              Stall
            </label>
            <select
              id="booking-stall"
              value={stallId}
              onChange={(e) => setStallId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-renter">
              Renter name
            </label>
            <input
              id="booking-renter"
              required
              value={renterName}
              onChange={(e) => setRenterName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-contact">
              Contact (optional)
            </label>
            <input
              id="booking-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-price">
              Total price
            </label>
            <input
              id="booking-price"
              type="number"
              min="0"
              step="1"
              required
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="booking-start">
                Start date
              </label>
              <input
                id="booking-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="booking-end">
                End date
              </label>
              <input
                id="booking-end"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-notes">
              Notes (optional)
            </label>
            <input
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Create booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

`pnpm dev`, open Booking, create a new booking and confirm the "Total price" field is required and rejects `0`/blank/negative with the inline error. Create one successfully, then check the Firestore console: the new document has a numeric `totalPrice` field.

- [ ] **Step 6: Commit**

```bash
git add src/types/booking.ts src/data/bookingsRepo.ts src/components/booking/BookingFormDialog.tsx
git commit -m "feat: add totalPrice to Booking and the create-booking form"
```

---

### Task 2: Report stats data layer

**Files:**

- Modify: `src/lib/dates.ts`
- Create: `src/data/reportStats.ts`

**Interfaces:**

- Consumes: `Booking` (with `totalPrice?`), `Stall`, existing `addDays`/`diffDays`/`todayIso`/`formatDisplayDate` from `src/lib/dates.ts`
- Produces (in `src/lib/dates.ts`): `export type DateRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear'`; `export interface DateRange { start: string; end: string }`; `export function presetRange(preset: DateRangePreset, today?: string): DateRange`
- Produces (in `src/data/reportStats.ts`): `export interface ReportSummary { totalBookings: number; totalRevenue: number; occupancyRate: number; cancellationRate: number }`; `export function computeSummary(bookings: Booking[], stalls: Stall[], range: DateRange): ReportSummary`; `export interface StallReportRow { stallId: string; code: string; bookingCount: number; revenue: number }`; `export function computeByStall(bookings: Booking[], stalls: Stall[], range: DateRange): StallReportRow[]`; `export interface RenterReportRow { renterName: string; bookingCount: number; revenue: number }`; `export function computeByRenter(bookings: Booking[], range: DateRange): RenterReportRow[]`; `export interface TrendPoint { bucketLabel: string; revenue: number; count: number }`; `export function computeTrend(bookings: Booking[], range: DateRange): TrendPoint[]` — all consumed by Tasks 3-5

- [ ] **Step 1: Add date-range preset helpers to `src/lib/dates.ts`**

Append to the end of `src/lib/dates.ts` (the existing `MS_PER_DAY`, `toUtcMidnight`, `todayIso`, `addDays`, `diffDays`, `formatDisplayDate` stay exactly as they are):

```ts
export type DateRangePreset = "today" | "thisWeek" | "thisMonth" | "thisYear";

export interface DateRange {
  start: string;
  end: string;
}

export function presetRange(
  preset: DateRangePreset,
  today: string = todayIso(),
): DateRange {
  switch (preset) {
    case "today":
      return { start: today, end: today };
    case "thisWeek": {
      const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const start = addDays(today, mondayOffset);
      return { start, end: addDays(start, 6) };
    }
    case "thisMonth": {
      const [year, month] = today.split("-");
      const lastDay = new Date(
        Date.UTC(Number(year), Number(month), 0),
      ).getUTCDate();
      return {
        start: `${year}-${month}-01`,
        end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
      };
    }
    case "thisYear": {
      const [year] = today.split("-");
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
  }
}
```

- [ ] **Step 2: Write the report stats module**

`src/data/reportStats.ts`:

```ts
import {
  addDays,
  diffDays,
  formatDisplayDate,
  type DateRange,
} from "../lib/dates";
import type { Stall } from "../types/stall";
import type { Booking } from "../types/booking";

function inRange(dateIso: string, range: DateRange): boolean {
  return dateIso >= range.start && dateIso <= range.end;
}

export interface ReportSummary {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  cancellationRate: number;
}

export function computeSummary(
  bookings: Booking[],
  stalls: Stall[],
  range: DateRange,
): ReportSummary {
  const inWindow = bookings.filter((b) => inRange(b.startDate, range));
  const confirmed = inWindow.filter((b) => b.status === "confirmed");
  const cancelled = inWindow.filter((b) => b.status === "cancelled");

  const totalBookings = confirmed.length;
  const totalRevenue = confirmed.reduce(
    (sum, b) => sum + (b.totalPrice ?? 0),
    0,
  );
  const cancellationRate =
    inWindow.length === 0 ? 0 : (cancelled.length / inWindow.length) * 100;

  const days = diffDays(range.start, range.end) + 1;
  const stallList = stalls.filter((s) => s.kind === "stall");
  let occupiedStallDays = 0;
  for (let i = 0; i < days; i++) {
    const day = addDays(range.start, i);
    for (const stall of stallList) {
      const occupied = bookings.some(
        (b) =>
          b.status === "confirmed" &&
          b.stallId === stall.id &&
          b.startDate <= day &&
          day <= b.endDate,
      );
      if (occupied) occupiedStallDays++;
    }
  }
  const occupancyRate =
    stallList.length > 0 && days > 0
      ? (occupiedStallDays / (stallList.length * days)) * 100
      : 0;

  return { totalBookings, totalRevenue, occupancyRate, cancellationRate };
}

export interface StallReportRow {
  stallId: string;
  code: string;
  bookingCount: number;
  revenue: number;
}

export function computeByStall(
  bookings: Booking[],
  stalls: Stall[],
  range: DateRange,
): StallReportRow[] {
  const confirmed = bookings.filter(
    (b) => b.status === "confirmed" && inRange(b.startDate, range),
  );
  return stalls
    .filter((s) => s.kind === "stall")
    .map((stall) => {
      const stallBookings = confirmed.filter((b) => b.stallId === stall.id);
      return {
        stallId: stall.id,
        code: stall.code,
        bookingCount: stallBookings.length,
        revenue: stallBookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0),
      };
    });
}

export interface RenterReportRow {
  renterName: string;
  bookingCount: number;
  revenue: number;
}

export function computeByRenter(
  bookings: Booking[],
  range: DateRange,
): RenterReportRow[] {
  const confirmed = bookings.filter(
    (b) => b.status === "confirmed" && inRange(b.startDate, range),
  );
  const byRenter = new Map<string, RenterReportRow>();
  for (const b of confirmed) {
    const existing = byRenter.get(b.renterName);
    if (existing) {
      existing.bookingCount += 1;
      existing.revenue += b.totalPrice ?? 0;
    } else {
      byRenter.set(b.renterName, {
        renterName: b.renterName,
        bookingCount: 1,
        revenue: b.totalPrice ?? 0,
      });
    }
  }
  return Array.from(byRenter.values());
}

export interface TrendPoint {
  bucketLabel: string;
  revenue: number;
  count: number;
}

export function computeTrend(
  bookings: Booking[],
  range: DateRange,
): TrendPoint[] {
  const confirmed = bookings.filter(
    (b) => b.status === "confirmed" && inRange(b.startDate, range),
  );
  const totalDays = diffDays(range.start, range.end) + 1;
  const useMonthBuckets = totalDays > 31;

  const buckets = new Map<string, TrendPoint>();
  const order: string[] = [];

  if (useMonthBuckets) {
    let cursor = range.start.slice(0, 7);
    const endMonth = range.end.slice(0, 7);
    while (cursor <= endMonth) {
      buckets.set(cursor, { bucketLabel: cursor, revenue: 0, count: 0 });
      order.push(cursor);
      const [y, m] = cursor.split("-").map(Number);
      cursor =
        m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    }
    for (const b of confirmed) {
      const bucket = buckets.get(b.startDate.slice(0, 7));
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += b.totalPrice ?? 0;
      }
    }
  } else {
    for (let i = 0; i < totalDays; i++) {
      const day = addDays(range.start, i);
      buckets.set(day, {
        bucketLabel: formatDisplayDate(day),
        revenue: 0,
        count: 0,
      });
      order.push(day);
    }
    for (const b of confirmed) {
      const bucket = buckets.get(b.startDate);
      if (bucket) {
        bucket.count += 1;
        bucket.revenue += b.totalPrice ?? 0;
      }
    }
  }

  return order.map((key) => buckets.get(key)!);
}
```

- [ ] **Step 3: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

There is no UI wired to this module yet — it has no directly-observable behavior until Task 3 renders it. Typecheck/build passing is this task's complete verification; Task 3's manual check is where these numbers first become visible and checkable against real data.

- [ ] **Step 4: Commit**

```bash
git add src/lib/dates.ts src/data/reportStats.ts
git commit -m "feat: add report stats data layer and date-range presets"
```

---

### Task 3: Dashboard page skeleton — date range control + summary KPIs

**Files:**

- Modify: `src/routes/DashboardPage.tsx`
- Create: `src/components/dashboard/LoadedDashboardPage.tsx`
- Create: `src/components/dashboard/ReportDateRangeControl.tsx`
- Create: `src/components/dashboard/ReportSummaryCards.tsx`

**Interfaces:**

- Consumes: `listBookings()` (`src/data/bookingsRepo.ts`), `loadMarketState()` (`src/data/marketDoc.ts`), `presetRange`/`todayIso`/`DateRangePreset`/`DateRange` (Task 2, `src/lib/dates.ts`), `computeSummary`/`ReportSummary` (Task 2, `src/data/reportStats.ts`)
- Produces: `LoadedDashboardPage` props `{ stalls: Stall[]; bookings: Booking[] }` — Tasks 4/5 add more rendering inside this component's return, not its props; `ReportDateRangeControl` props `{ preset: DateRangePreset; range: DateRange; onPresetChange: (preset: DateRangePreset) => void; onCustomRangeChange: (range: DateRange) => void }`; `ReportSummaryCards` props `{ summary: ReportSummary }`

- [ ] **Step 1: Build the date-range control**

`src/components/dashboard/ReportDateRangeControl.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import type { DateRangePreset, DateRange } from "../../lib/dates";

interface ReportDateRangeControlProps {
  preset: DateRangePreset;
  range: DateRange;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "thisWeek", label: "This Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
];

export function ReportDateRangeControl({
  preset,
  range,
  onPresetChange,
  onCustomRangeChange,
}: ReportDateRangeControlProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            type="button"
            variant={preset === p.key ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetChange(p.key)}>
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <input
          type="date"
          value={range.start}
          onChange={(e) =>
            onCustomRangeChange({ start: e.target.value, end: range.end })
          }
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          aria-label="Custom range start date"
        />
        <span className="text-slate-400">–</span>
        <input
          type="date"
          value={range.end}
          onChange={(e) =>
            onCustomRangeChange({ start: range.start, end: e.target.value })
          }
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          aria-label="Custom range end date"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the summary KPI cards**

`src/components/dashboard/ReportSummaryCards.tsx`:

```tsx
import type { ReportSummary } from "../../data/reportStats";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const cards = [
    { label: "Total bookings", value: String(summary.totalBookings) },
    { label: "Total revenue", value: formatCurrency(summary.totalRevenue) },
    { label: "Occupancy rate", value: formatPercent(summary.occupancyRate) },
    {
      label: "Cancellation rate",
      value: formatPercent(summary.cancellationRate),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">{card.label}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-800">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Build the loaded page shell**

`src/components/dashboard/LoadedDashboardPage.tsx`:

```tsx
import { useState } from "react";
import { ReportDateRangeControl } from "./ReportDateRangeControl";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { computeSummary } from "../../data/reportStats";
import {
  presetRange,
  todayIso,
  type DateRangePreset,
  type DateRange,
} from "../../lib/dates";
import type { Stall } from "../../types/stall";
import type { Booking } from "../../types/booking";

interface LoadedDashboardPageProps {
  stalls: Stall[];
  bookings: Booking[];
}

export function LoadedDashboardPage({
  stalls,
  bookings,
}: LoadedDashboardPageProps) {
  const [preset, setPreset] = useState<DateRangePreset>("thisMonth");
  const [range, setRange] = useState<DateRange>(() =>
    presetRange("thisMonth", todayIso()),
  );

  const handlePresetChange = (nextPreset: DateRangePreset) => {
    setPreset(nextPreset);
    setRange(presetRange(nextPreset, todayIso()));
  };

  const summary = computeSummary(bookings, stalls, range);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <ReportDateRangeControl
        preset={preset}
        range={range}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={setRange}
      />
      <ReportSummaryCards summary={summary} />
    </div>
  );
}
```

- [ ] **Step 4: Wire the route's loading boundary**

Replace all of `src/routes/DashboardPage.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadedDashboardPage } from "../components/dashboard/LoadedDashboardPage";
import { loadMarketState } from "../data/marketDoc";
import { listBookings } from "../data/bookingsRepo";
import type { Stall } from "../types/stall";
import type { Booking } from "../types/booking";

interface DashboardPageData {
  stalls: Stall[];
  bookings: Booking[];
}

export function DashboardPage() {
  const [loadedData, setLoadedData] = useState<DashboardPageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const load = async () => {
    setIsLoadingInitial(true);
    setLoadError(null);
    try {
      const [marketState, bookings] = await Promise.all([
        loadMarketState(),
        listBookings(),
      ]);
      setLoadedData({
        stalls: marketState.stalls.filter((s) => s.kind === "stall"),
        bookings,
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load dashboard",
      );
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoadingInitial) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button variant="outline" onClick={() => load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!loadedData) {
    return null;
  }

  return (
    <LoadedDashboardPage
      stalls={loadedData.stalls}
      bookings={loadedData.bookings}
    />
  );
}
```

- [ ] **Step 5: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 6: Manual check**

`pnpm dev`, open Dashboard. Confirm the 4 preset buttons switch the visible date range (check the custom start/end inputs update to match), the custom date inputs can override the range, and the KPI cards show plausible numbers against whatever bookings already exist (created in Task 1's manual check and any from the earlier Booking feature). Create a multi-day booking spanning today, switch to "Today," and confirm the occupancy rate reflects that stall being occupied while total-bookings-in-range only counts it if its `startDate` falls within "Today."

- [ ] **Step 7: Commit**

```bash
git add src/routes/DashboardPage.tsx src/components/dashboard/LoadedDashboardPage.tsx src/components/dashboard/ReportDateRangeControl.tsx src/components/dashboard/ReportSummaryCards.tsx
git commit -m "feat: add Dashboard page with date-range control and summary KPIs"
```

---

### Task 4: By-stall and by-renter tables

**Files:**

- Create: `src/components/dashboard/ReportByStallTable.tsx`
- Create: `src/components/dashboard/ReportByRenterTable.tsx`
- Modify: `src/components/dashboard/LoadedDashboardPage.tsx`

**Interfaces:**

- Consumes: `computeByStall`/`StallReportRow`, `computeByRenter`/`RenterReportRow` (Task 2, `src/data/reportStats.ts`)
- Produces: `ReportByStallTable` props `{ rows: StallReportRow[] }`; `ReportByRenterTable` props `{ rows: RenterReportRow[] }`

- [ ] **Step 1: Build the by-stall table**

`src/components/dashboard/ReportByStallTable.tsx`:

```tsx
import { useState } from "react";
import type { StallReportRow } from "../../data/reportStats";

type SortKey = "bookingCount" | "revenue";

interface ReportByStallTableProps {
  rows: StallReportRow[];
}

export function ReportByStallTable({ rows }: ReportByStallTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">By stall</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-1.5">Stall</th>
            <th
              className="cursor-pointer py-1.5"
              onClick={() => setSortKey("bookingCount")}>
              Bookings
            </th>
            <th
              className="cursor-pointer py-1.5"
              onClick={() => setSortKey("revenue")}>
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.stallId} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-800">{row.code}</td>
              <td className="py-1.5 text-slate-600">{row.bookingCount}</td>
              <td className="py-1.5 text-slate-600">
                {row.revenue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Build the by-renter table**

`src/components/dashboard/ReportByRenterTable.tsx`:

```tsx
import { useState } from "react";
import type { RenterReportRow } from "../../data/reportStats";

type SortKey = "bookingCount" | "revenue";

interface ReportByRenterTableProps {
  rows: RenterReportRow[];
}

export function ReportByRenterTable({ rows }: ReportByRenterTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">By renter</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-1.5">Renter</th>
            <th
              className="cursor-pointer py-1.5"
              onClick={() => setSortKey("bookingCount")}>
              Bookings
            </th>
            <th
              className="cursor-pointer py-1.5"
              onClick={() => setSortKey("revenue")}>
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.renterName} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-800">{row.renterName}</td>
              <td className="py-1.5 text-slate-600">{row.bookingCount}</td>
              <td className="py-1.5 text-slate-600">
                {row.revenue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Wire both tables into the loaded page**

Replace all of `src/components/dashboard/LoadedDashboardPage.tsx` with:

```tsx
import { useState } from "react";
import { ReportDateRangeControl } from "./ReportDateRangeControl";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportByStallTable } from "./ReportByStallTable";
import { ReportByRenterTable } from "./ReportByRenterTable";
import {
  computeSummary,
  computeByStall,
  computeByRenter,
} from "../../data/reportStats";
import {
  presetRange,
  todayIso,
  type DateRangePreset,
  type DateRange,
} from "../../lib/dates";
import type { Stall } from "../../types/stall";
import type { Booking } from "../../types/booking";

interface LoadedDashboardPageProps {
  stalls: Stall[];
  bookings: Booking[];
}

export function LoadedDashboardPage({
  stalls,
  bookings,
}: LoadedDashboardPageProps) {
  const [preset, setPreset] = useState<DateRangePreset>("thisMonth");
  const [range, setRange] = useState<DateRange>(() =>
    presetRange("thisMonth", todayIso()),
  );

  const handlePresetChange = (nextPreset: DateRangePreset) => {
    setPreset(nextPreset);
    setRange(presetRange(nextPreset, todayIso()));
  };

  const summary = computeSummary(bookings, stalls, range);
  const byStall = computeByStall(bookings, stalls, range);
  const byRenter = computeByRenter(bookings, range);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <ReportDateRangeControl
        preset={preset}
        range={range}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={setRange}
      />
      <ReportSummaryCards summary={summary} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReportByStallTable rows={byStall} />
        <ReportByRenterTable rows={byRenter} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

Confirm both tables list the right stalls/renters for the current date range, clicking the "Bookings"/"Revenue" column headers re-sorts each table, and the numbers match what's visible on the Booking page's timeline for the same range.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ReportByStallTable.tsx src/components/dashboard/ReportByRenterTable.tsx src/components/dashboard/LoadedDashboardPage.tsx
git commit -m "feat: add by-stall and by-renter report tables"
```

---

### Task 5: Trend chart

**Files:**

- Create: `src/components/dashboard/ReportTrendChart.tsx`
- Modify: `src/components/dashboard/LoadedDashboardPage.tsx`

**Interfaces:**

- Consumes: `computeTrend`/`TrendPoint` (Task 2, `src/data/reportStats.ts`)
- Produces: `ReportTrendChart` props `{ points: TrendPoint[]; metric: 'revenue' | 'count'; onMetricChange: (metric: 'revenue' | 'count') => void }`

This is the one genuinely chart-shaped piece of UI in this app so far. The code below is a complete, working bar chart — build it as the correctness baseline first, then **invoke the `dataviz` skill** before finalizing this task, specifically for palette/accessibility polish (bar color, contrast, hover/tooltip treatment) — do not skip straight to the given styling as final without that pass.

- [ ] **Step 1: Build the trend chart**

`src/components/dashboard/ReportTrendChart.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import type { TrendPoint } from "../../data/reportStats";

interface ReportTrendChartProps {
  points: TrendPoint[];
  metric: "revenue" | "count";
  onMetricChange: (metric: "revenue" | "count") => void;
}

const CHART_HEIGHT = 160;

export function ReportTrendChart({
  points,
  metric,
  onMetricChange,
}: ReportTrendChartProps) {
  const values = points.map((p) => p[metric]);
  const max = Math.max(1, ...values);

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Trend</h2>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={metric === "revenue" ? "default" : "outline"}
            onClick={() => onMetricChange("revenue")}>
            Revenue
          </Button>
          <Button
            type="button"
            size="sm"
            variant={metric === "count" ? "default" : "outline"}
            onClick={() => onMetricChange("count")}>
            Bookings
          </Button>
        </div>
      </div>
      <div
        className="flex items-end gap-1 overflow-x-auto"
        style={{ height: CHART_HEIGHT }}>
        {points.map((point) => (
          <div
            key={point.bucketLabel}
            className="flex min-w-[24px] flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-blue-500"
              style={{
                height: `${(point[metric] / max) * (CHART_HEIGHT - 24)}px`,
              }}
              title={`${point.bucketLabel}: ${point[metric]}`}
            />
            <span className="whitespace-nowrap text-[10px] text-slate-500">
              {point.bucketLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Invoke the dataviz skill for visual polish**

Before wiring this into the page, invoke the `dataviz` skill and apply its guidance to this component — in particular its color/contrast guidance for a single-series bar chart in both light and dark contexts, and any mark-spec adjustments it recommends (bar width/gap, label legibility at the 31-bucket case). Keep the component's props/behavior exactly as specified above; only the internal styling should change from this pass.

- [ ] **Step 3: Wire the chart into the loaded page**

Replace all of `src/components/dashboard/LoadedDashboardPage.tsx` with:

```tsx
import { useState } from "react";
import { ReportDateRangeControl } from "./ReportDateRangeControl";
import { ReportSummaryCards } from "./ReportSummaryCards";
import { ReportByStallTable } from "./ReportByStallTable";
import { ReportByRenterTable } from "./ReportByRenterTable";
import { ReportTrendChart } from "./ReportTrendChart";
import {
  computeSummary,
  computeByStall,
  computeByRenter,
  computeTrend,
} from "../../data/reportStats";
import {
  presetRange,
  todayIso,
  type DateRangePreset,
  type DateRange,
} from "../../lib/dates";
import type { Stall } from "../../types/stall";
import type { Booking } from "../../types/booking";

interface LoadedDashboardPageProps {
  stalls: Stall[];
  bookings: Booking[];
}

export function LoadedDashboardPage({
  stalls,
  bookings,
}: LoadedDashboardPageProps) {
  const [preset, setPreset] = useState<DateRangePreset>("thisMonth");
  const [range, setRange] = useState<DateRange>(() =>
    presetRange("thisMonth", todayIso()),
  );
  const [trendMetric, setTrendMetric] = useState<"revenue" | "count">(
    "revenue",
  );

  const handlePresetChange = (nextPreset: DateRangePreset) => {
    setPreset(nextPreset);
    setRange(presetRange(nextPreset, todayIso()));
  };

  const summary = computeSummary(bookings, stalls, range);
  const byStall = computeByStall(bookings, stalls, range);
  const byRenter = computeByRenter(bookings, range);
  const trend = computeTrend(bookings, range);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <ReportDateRangeControl
        preset={preset}
        range={range}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={setRange}
      />
      <ReportSummaryCards summary={summary} />
      <ReportTrendChart
        points={trend}
        metric={trendMetric}
        onMetricChange={setTrendMetric}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReportByStallTable rows={byStall} />
        <ReportByRenterTable rows={byRenter} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and build**

Run: `pnpm typecheck`
Expected: 0 errors.

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 5: Manual check**

Confirm the trend chart renders bars for the selected range, toggling "Revenue"/"Bookings" changes what's plotted, switching to "This Year" shows monthly buckets (12 or fewer bars) while "This Week" shows 7 daily bars, and bars scale sensibly (tallest bar roughly fills the chart height, empty buckets show no bar).

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/ReportTrendChart.tsx src/components/dashboard/LoadedDashboardPage.tsx
git commit -m "feat: add trend chart to Dashboard report"
```
