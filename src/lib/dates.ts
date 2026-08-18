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
