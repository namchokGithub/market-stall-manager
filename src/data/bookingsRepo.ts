import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Booking } from '../types/booking'

const BOOKINGS_COLLECTION = 'bookings'

export type NewBookingInput = {
  stallId: string
  renterName: string
  contact?: string
  totalPrice: number
  startDate: string
  endDate: string
  notes?: string
}

function isValidBooking(data: unknown): data is Omit<Booking, 'id'> {
  if (typeof data !== 'object' || data === null) return false
  const { stallId, renterName, startDate, endDate, status, createdAt } = data as Record<string, unknown>
  return (
    typeof stallId === 'string' &&
    typeof renterName === 'string' &&
    typeof startDate === 'string' &&
    typeof endDate === 'string' &&
    (status === 'confirmed' || status === 'cancelled') &&
    typeof createdAt === 'string'
  )
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd
}

export async function listBookings(): Promise<Booking[]> {
  const snapshot = await getDocs(collection(db, BOOKINGS_COLLECTION))
  const bookings: Booking[] = []
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data()
    if (isValidBooking(data)) {
      bookings.push({ id: docSnapshot.id, ...data })
    }
  }
  return bookings
}

export async function createBooking(input: NewBookingInput): Promise<Booking> {
  const existing = await listBookings()
  assertNoBookingConflict(existing, input)

  const booking: Omit<Booking, 'id'> = {
    ...input,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }
  const ref = await addDoc(collection(db, BOOKINGS_COLLECTION), booking)
  return { id: ref.id, ...booking }
}

export async function cancelBooking(id: string): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COLLECTION, id), { status: 'cancelled' })
}

export async function updateBooking(id: string, input: NewBookingInput): Promise<void> {
  const existing = await listBookings()
  assertNoBookingConflict(existing, input, id)
  await updateDoc(doc(db, BOOKINGS_COLLECTION, id), input)
}

function assertNoBookingConflict(bookings: Booking[], input: NewBookingInput, excludedId?: string): void {
  const conflict = bookings.some(
    (booking) =>
      booking.id !== excludedId &&
      booking.status === 'confirmed' &&
      booking.stallId === input.stallId &&
      rangesOverlap(booking.startDate, booking.endDate, input.startDate, input.endDate),
  )
  if (conflict) {
    throw new Error('This stall is already booked for part of that date range.')
  }
}
