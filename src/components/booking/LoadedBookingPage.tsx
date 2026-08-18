import { useState } from 'react'
import { addDays, todayIso } from '../../lib/dates'
import { BookingTimeline } from './BookingTimeline'
import type { Stall } from '../../types/stall'
import type { Booking } from '../../types/booking'

const WINDOW_DAYS = 14

interface LoadedBookingPageProps {
  stalls: Stall[]
  initialBookings: Booking[]
}

export function LoadedBookingPage({ stalls, initialBookings }: LoadedBookingPageProps) {
  const [bookings] = useState<Booking[]>(initialBookings)
  const [windowStart, setWindowStart] = useState(todayIso())

  return (
    <div className="flex h-full w-full flex-col">
      <BookingTimeline
        stalls={stalls}
        bookings={bookings}
        windowStart={windowStart}
        windowDays={WINDOW_DAYS}
        onPrev={() => setWindowStart((d) => addDays(d, -7))}
        onNext={() => setWindowStart((d) => addDays(d, 7))}
        onCellClick={() => {}}
        onBarClick={() => {}}
      />
    </div>
  )
}
