import type { Stall, DisplayStall } from '../types/stall'
import type { Booking } from '../types/booking'

export function activeBookingsByStallId(bookings: Booking[], today: string): Map<string, Booking> {
  const active = new Map<string, Booking>()
  for (const booking of bookings) {
    if (booking.status !== 'confirmed') continue
    if (booking.startDate <= today && today <= booking.endDate) {
      active.set(booking.stallId, booking)
    }
  }
  return active
}

export function withOccupancy(stalls: Stall[], active: Map<string, Booking>): DisplayStall[] {
  return stalls.map((stall): DisplayStall => {
    const booking = active.get(stall.id)
    if (!booking) return { ...stall, status: 'vacant' }
    return { ...stall, status: 'occupied', renterName: booking.renterName, contact: booking.contact }
  })
}
