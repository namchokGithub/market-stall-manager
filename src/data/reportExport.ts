import type { ReportSummary, StallReportRow, RenterReportRow } from './reportStats'
import type { DateRange } from '../lib/dates'

function csvEscape(value: string | number): string {
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(',')
}

export function buildReportCsv(
  summary: ReportSummary,
  byStall: StallReportRow[],
  byRenter: RenterReportRow[],
  range: DateRange,
): string {
  const lines: string[] = []

  lines.push(csvRow(['Report', range.start, range.end]))
  lines.push('')

  lines.push('Summary')
  lines.push(csvRow(['Metric', 'Value']))
  lines.push(csvRow(['Total Bookings', summary.totalBookings]))
  lines.push(csvRow(['Total Revenue', summary.totalRevenue]))
  lines.push(csvRow(['Occupancy Rate', `${summary.occupancyRate.toFixed(1)}%`]))
  lines.push(csvRow(['Cancellation Rate', `${summary.cancellationRate.toFixed(1)}%`]))
  lines.push('')

  lines.push('By Stall')
  lines.push(csvRow(['Stall', 'Bookings', 'Revenue']))
  for (const row of byStall) {
    lines.push(csvRow([row.code, row.bookingCount, row.revenue]))
  }
  lines.push('')

  lines.push('By Renter')
  lines.push(csvRow(['Renter', 'Bookings', 'Revenue']))
  for (const row of byRenter) {
    lines.push(csvRow([row.renterName, row.bookingCount, row.revenue]))
  }

  return lines.join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
