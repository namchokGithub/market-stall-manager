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
  category?: string
  label?: string
}

export interface DisplayStall extends Stall {
  status?: 'vacant' | 'occupied'
  renterName?: string
  contact?: string
}
