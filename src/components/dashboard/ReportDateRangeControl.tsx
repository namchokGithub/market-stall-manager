import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { diffDays, type DateRangePreset, type DateRange } from "../../lib/dates";

interface ReportDateRangeControlProps {
  preset: DateRangePreset | null;
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

// ~5 years — generous enough for any real report, small enough that the
// occupancy/trend day-by-day loops can never materialize an unbounded
// number of entries.
const MAX_RANGE_DAYS = 1826;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isWellFormedIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function validateCustomRange(range: DateRange): string | null {
  if (!range.start || !range.end) {
    return "Start and end dates are required.";
  }
  if (!isWellFormedIsoDate(range.start) || !isWellFormedIsoDate(range.end)) {
    return "Enter complete start and end dates.";
  }
  if (range.end < range.start) {
    return "End date must be on or after the start date.";
  }
  if (diffDays(range.start, range.end) + 1 > MAX_RANGE_DAYS) {
    return "Custom range can't exceed 5 years.";
  }
  return null;
}

export function ReportDateRangeControl({
  preset,
  range,
  onPresetChange,
  onCustomRangeChange,
}: ReportDateRangeControlProps) {
  // Local, always-editable copy of the inputs' raw values — decoupled from
  // the committed `range` prop so an in-progress/invalid edit (e.g. a
  // half-typed year) can be shown and explained without being computed on.
  const [draft, setDraft] = useState<DateRange>(range);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(range);
    setError(null);
  }, [range]);

  const handleDraftChange = (next: DateRange) => {
    setDraft(next);
    const validationError = validateCustomRange(next);
    setError(validationError);
    if (!validationError) {
      onCustomRangeChange(next);
    }
  };

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
          value={draft.start}
          onChange={(e) =>
            handleDraftChange({ start: e.target.value, end: draft.end })
          }
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          aria-label="Custom range start date"
        />
        <span className="text-slate-400">–</span>
        <input
          type="date"
          value={draft.end}
          onChange={(e) =>
            handleDraftChange({ start: draft.start, end: e.target.value })
          }
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          aria-label="Custom range end date"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
