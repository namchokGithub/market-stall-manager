import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { MapState } from '../types/marketState'

const COLLECTION = 'publicMarketShares'

function isValidMapState(data: unknown): data is MapState {
  if (typeof data !== 'object' || data === null) return false
  const { market, stalls } = data as Record<string, unknown>

  if (typeof market !== 'object' || market === null || !Array.isArray(stalls)) return false
  const { width, height, backgroundTint, backgroundImageUrl } = market as Record<string, unknown>

  return (
    typeof width === 'number' &&
    typeof height === 'number' &&
    typeof backgroundTint === 'number' &&
    (backgroundImageUrl === undefined || typeof backgroundImageUrl === 'string')
  )
}

/** Creates an unguessable, public, layout-only snapshot. It intentionally excludes bookings. */
export async function publishPublicMarketShare(state: MapState): Promise<string> {
  const shareId = crypto.randomUUID()
  await setDoc(doc(db, COLLECTION, shareId), {
    ...state,
    isPublic: true,
  })
  return shareId
}

export async function loadPublicMarketShare(shareId: string): Promise<MapState | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, shareId))

  if (!snapshot.exists()) return null
  const data = snapshot.data()
  if (data.isPublic !== true || !isValidMapState(data)) {
    throw new Error('This shared market map is malformed')
  }

  return { market: data.market, stalls: data.stalls }
}

export function publicMarketShareUrl(shareId: string): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}#/view/${shareId}`
}
