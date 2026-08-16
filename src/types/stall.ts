export interface Stall {
  id: string
  kind: 'stall' | 'bush'
  code: string
  x: number
  y: number
  width: number
  height: number
  status?: 'vacant' | 'occupied'
  category?: string
  renterName?: string
  contact?: string
}
