export type ElementType =
  | 'stall'
  | 'wall'
  | 'fence'
  | 'entrance'
  | 'exit'
  | 'toilet'
  | 'parking'
  | 'trash'
  | 'tree'
  | 'bush'
  | 'text'
  | 'zone'

export interface Stall {
  id: string
  kind: ElementType
  code: string
  x: number
  y: number
  width: number
  height: number
  status?: 'vacant' | 'occupied'
  category?: string
  renterName?: string
  contact?: string
  label?: string
}
