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

function revenueOf(booking: Booking): number {
  return typeof booking.totalPrice === "number" &&
    Number.isFinite(booking.totalPrice)
    ? booking.totalPrice
    : 0;
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
    (sum, b) => sum + revenueOf(b),
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
        revenue: stallBookings.reduce((sum, b) => sum + revenueOf(b), 0),
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
      existing.revenue += revenueOf(b);
    } else {
      byRenter.set(b.renterName, {
        renterName: b.renterName,
        bookingCount: 1,
        revenue: revenueOf(b),
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
        bucket.revenue += revenueOf(b);
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
        bucket.revenue += revenueOf(b);
      }
    }
  }

  return order.map((key) => buckets.get(key)!);
}
