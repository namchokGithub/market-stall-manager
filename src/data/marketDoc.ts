import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { MapState } from '../types/marketState'
import { DEFAULT_MARKET, mockStalls } from './mockStalls'

function isValidMapState(data: unknown): data is MapState {
  if (typeof data !== 'object' || data === null) return false
  const { market, stalls } = data as Record<string, unknown>

  if (typeof market !== 'object' || market === null) return false
  const { width, height, backgroundTint, backgroundImageUrl } = market as Record<string, unknown>

  if (typeof width !== 'number' || typeof height !== 'number' || typeof backgroundTint !== 'number') {
    return false
  }
  if (backgroundImageUrl !== undefined && typeof backgroundImageUrl !== 'string') {
    return false
  }

  return Array.isArray(stalls)
}

export async function loadMarketState(): Promise<MapState> {
  const snapshot = await getDoc(doc(db, 'markets', 'default'))

  if (!snapshot.exists()) {
    return { market: DEFAULT_MARKET, stalls: mockStalls }
  }

  const data = snapshot.data()
  if (!isValidMapState(data)) {
    throw new Error('Market document is malformed')
  }

  return data
}

export async function saveMarketState(state: MapState): Promise<void> {
  await setDoc(doc(db, 'markets', 'default'), { ...state, updatedAt: serverTimestamp() })
}
