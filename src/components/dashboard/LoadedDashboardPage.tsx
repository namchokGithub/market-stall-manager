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
