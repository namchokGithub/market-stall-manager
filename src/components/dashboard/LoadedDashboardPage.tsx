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
