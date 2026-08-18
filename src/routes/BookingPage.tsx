import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LoadedBookingPage } from '../components/booking/LoadedBookingPage'
import { loadMarketState } from '../data/marketDoc'
import { listBookings } from '../data/bookingsRepo'
import type { Stall } from '../types/stall'
import type { Booking } from '../types/booking'

interface BookingPageData {
  stalls: Stall[]
  bookings: Booking[]
}

export function BookingPage() {
  const [loadedData, setLoadedData] = useState<BookingPageData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  const load = async () => {
    setIsLoadingInitial(true)
    setLoadError(null)
    try {
      const [marketState, bookings] = await Promise.all([loadMarketState(), listBookings()])
      setLoadedData({ stalls: marketState.stalls.filter((s) => s.kind === 'stall'), bookings })
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setIsLoadingInitial(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (isLoadingInitial) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading bookings…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button variant="outline" onClick={() => load()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!loadedData) {
    return null
  }

  return <LoadedBookingPage stalls={loadedData.stalls} initialBookings={loadedData.bookings} />
}
