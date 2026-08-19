import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDays, diffDays, formatDisplayDate } from '../../lib/dates'
import type { Stall } from '../../types/stall'
import type { Booking } from '../../types/booking'

const MIN_CELL_WIDTH = 48
const ROW_LABEL_WIDTH = 96
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
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timelineWidth, setTimelineWidth] = useState(0)
  const windowEnd = addDays(windowStart, windowDays - 1)
  const dates = Array.from({ length: windowDays }, (_, i) => addDays(windowStart, i))
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')
  const contentWidth = Math.max(timelineWidth, ROW_LABEL_WIDTH + dates.length * MIN_CELL_WIDTH)
  const cellWidth = (contentWidth - ROW_LABEL_WIDTH) / dates.length

  useEffect(() => {
    const element = timelineRef.current
    if (!element) return

    const updateWidth = () => setTimelineWidth(element.clientWidth)
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={timelineRef} className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 sm:px-4">
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
        <div style={{ width: contentWidth, minWidth: '100%' }}>
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div
              style={{ width: ROW_LABEL_WIDTH }}
              className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500"
            >
              Stall
            </div>
            {dates.map((date) => (
              <div
                key={date}
                style={{ width: cellWidth }}
                className="shrink-0 border-l border-slate-100 py-2 text-center text-[10px] text-slate-500"
              >
                {formatDisplayDate(date)}
              </div>
            ))}
          </div>

          {stalls.map((stall) => (
            <div key={stall.id} className="relative flex border-b border-slate-100" style={{ height: ROW_HEIGHT }}>
              <div
                style={{ width: ROW_LABEL_WIDTH }}
                className="sticky left-0 z-10 shrink-0 truncate border-r border-slate-100 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {stall.code}
              </div>
              <div className="relative flex-1">
                {dates.map((date, i) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onCellClick(stall.id, date)}
                    style={{ position: 'absolute', left: i * cellWidth, width: cellWidth, top: 0, height: ROW_HEIGHT }}
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
                          left: startOffset * cellWidth + 2,
                          width: (endOffset - startOffset + 1) * cellWidth - 4,
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
