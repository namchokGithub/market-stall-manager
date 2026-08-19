const MS_PER_DAY = 86_400_000

function toUtcMidnight(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime()
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(iso: string, days: number): string {
  const next = new Date(toUtcMidnight(iso) + days * MS_PER_DAY)
  return next.toISOString().slice(0, 10)
}

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((toUtcMidnight(toIso) - toUtcMidnight(fromIso)) / MS_PER_DAY)
}

export function formatDisplayDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

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
