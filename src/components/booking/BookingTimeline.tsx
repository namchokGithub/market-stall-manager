import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDays, diffDays, formatDisplayDate } from '../../lib/dates'
import type { Stall } from '../../types/stall'
import type { Booking } from '../../types/booking'

const CELL_WIDTH = 40
const ROW_LABEL_WIDTH = 140
const ROW_HEIGHT = 40

interface BookingTimelineProps {
  stalls: Stall[]
  bookings: Booking[]
  windowStart: string
  windowDays: number
  onPrev: () => void
  onNext: () => void
  onCellClick: (stallId: string, date: string) => void
  onBarClick: (booking: Booking) => void
}

export function BookingTimeline({
  stalls,
  bookings,
  windowStart,
  windowDays,
  onPrev,
  onNext,
  onCellClick,
  onBarClick,
}: BookingTimelineProps) {
  const windowEnd = addDays(windowStart, windowDays - 1)
  const dates = Array.from({ length: windowDays }, (_, i) => addDays(windowStart, i))
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <Button variant="outline" size="sm" onClick={onPrev} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-slate-700">
          {formatDisplayDate(windowStart)} – {formatDisplayDate(windowEnd)}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div style={{ width: ROW_LABEL_WIDTH + dates.length * CELL_WIDTH }}>
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div style={{ width: ROW_LABEL_WIDTH }} className="shrink-0 px-3 py-2 text-xs font-semibold text-slate-500">
              Stall
            </div>
            {dates.map((date) => (
              <div
                key={date}
                style={{ width: CELL_WIDTH }}
                className="shrink-0 border-l border-slate-100 py-2 text-center text-[10px] text-slate-500"
              >
                {formatDisplayDate(date)}
              </div>
            ))}
          </div>

          {stalls.map((stall) => (
            <div key={stall.id} className="relative flex border-b border-slate-100" style={{ height: ROW_HEIGHT }}>
              <div style={{ width: ROW_LABEL_WIDTH }} className="shrink-0 truncate px-3 py-2 text-sm text-slate-700">
                {stall.code}
              </div>
              <div className="relative flex-1">
                {dates.map((date, i) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onCellClick(stall.id, date)}
                    style={{ position: 'absolute', left: i * CELL_WIDTH, width: CELL_WIDTH, top: 0, height: ROW_HEIGHT }}
                    className="border-l border-slate-100 hover:bg-slate-50"
                  />
                ))}
                {confirmedBookings
                  .filter((b) => b.stallId === stall.id && b.startDate <= windowEnd && b.endDate >= windowStart)
                  .map((booking) => {
                    const startOffset = Math.max(0, diffDays(windowStart, booking.startDate))
                    const endOffset = Math.min(dates.length - 1, diffDays(windowStart, booking.endDate))
                    return (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => onBarClick(booking)}
                        style={{
                          position: 'absolute',
                          left: startOffset * CELL_WIDTH + 2,
                          width: (endOffset - startOffset + 1) * CELL_WIDTH - 4,
                          top: 4,
                          height: ROW_HEIGHT - 8,
                        }}
                        className="truncate rounded bg-emerald-500 px-2 text-left text-xs font-medium text-white hover:bg-emerald-600"
                      >
                        {booking.renterName}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
