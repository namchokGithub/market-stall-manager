export interface Booking {
  id: string
  stallId: string
  renterName: string
  contact?: string
  totalPrice?: number // optional: bookings created before this field existed have none
  startDate: string // ISO yyyy-mm-dd, inclusive
  endDate: string // ISO yyyy-mm-dd, inclusive
  status: 'confirmed' | 'cancelled'
  notes?: string
  createdAt: string // ISO timestamp, set on create
}
