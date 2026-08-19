import { useMemo, useState } from "react";
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
  const [preset, setPreset] = useState<DateRangePreset | null>("thisMonth");
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

  const handleCustomRangeChange = (nextRange: DateRange) => {
    setPreset(null);
    setRange(nextRange);
  };

  const summary = useMemo(
    () => computeSummary(bookings, stalls, range),
    [bookings, stalls, range],
  );
  const byStall = useMemo(
    () => computeByStall(bookings, stalls, range),
    [bookings, stalls, range],
  );
  const byRenter = useMemo(
    () => computeByRenter(bookings, range),
    [bookings, range],
  );
  const trend = useMemo(
    () => computeTrend(bookings, range),
    [bookings, range],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <ReportDateRangeControl
        preset={preset}
        range={range}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
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
