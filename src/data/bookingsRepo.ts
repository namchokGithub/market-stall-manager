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
  const conflict = existing.some(
    (b) =>
      b.status === 'confirmed' &&
      b.stallId === input.stallId &&
      rangesOverlap(b.startDate, b.endDate, input.startDate, input.endDate),
  )
  if (conflict) {
    throw new Error('This stall is already booked for part of that date range.')
  }

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
