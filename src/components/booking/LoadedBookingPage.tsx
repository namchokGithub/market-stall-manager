import { useState } from 'react'
import { addDays, todayIso } from '../../lib/dates'
import { BookingTimeline } from './BookingTimeline'
import { BookingFormDialog } from './BookingFormDialog'
import { listBookings } from '../../data/bookingsRepo'
import type { Stall } from '../../types/stall'
import type { Booking } from '../../types/booking'

const WINDOW_DAYS = 14

interface LoadedBookingPageProps {
  stalls: Stall[]
  initialBookings: Booking[]
}

export function LoadedBookingPage({ stalls, initialBookings }: LoadedBookingPageProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [windowStart, setWindowStart] = useState(todayIso())
  const [formState, setFormState] = useState<{ stallId: string; date: string } | null>(null)

  const refetchBookings = async () => {
    setBookings(await listBookings())
  }

  return (
    <div className="flex h-full w-full flex-col">
      <BookingTimeline
        stalls={stalls}
        bookings={bookings}
        windowStart={windowStart}
        windowDays={WINDOW_DAYS}
        onPrev={() => setWindowStart((d) => addDays(d, -7))}
        onNext={() => setWindowStart((d) => addDays(d, 7))}
        onCellClick={(stallId, date) => setFormState({ stallId, date })}
        onBarClick={() => {}}
      />

      {formState && (
        <BookingFormDialog
          stalls={stalls}
          initialStallId={formState.stallId}
          initialDate={formState.date}
          onClose={() => setFormState(null)}
          onCreated={() => {
            setFormState(null)
            refetchBookings()
          }}
        />
      )}
    </div>
  )
}
