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
