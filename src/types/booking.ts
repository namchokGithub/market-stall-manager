export interface Booking {
  id: string
  stallId: string
  renterName: string
  contact?: string
  startDate: string // ISO yyyy-mm-dd, inclusive
  endDate: string // ISO yyyy-mm-dd, inclusive
  status: 'confirmed' | 'cancelled'
  notes?: string
  createdAt: string // ISO timestamp, set on create
}
