import type { MarketLayout } from './market'
import type { Stall } from './stall'

export interface MapState {
  market: MarketLayout
  stalls: Stall[]
}
