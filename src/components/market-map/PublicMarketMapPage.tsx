import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { loadPublicMarketShare } from '../../data/publicMarketShares'
import type { MapState } from '../../types/marketState'
import { MapCanvas } from './MapCanvas'

export function PublicMarketMapPage() {
  const { shareId } = useParams()
  const [mapState, setMapState] = useState<MapState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareId) {
      setError('This shared market map link is invalid.')
      return
    }

    let isCurrent = true
    void loadPublicMarketShare(shareId)
      .then((state) => {
        if (!isCurrent) return
        if (!state) setError('This shared market map is unavailable.')
        else setMapState(state)
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load this shared market map.')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [shareId])

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-6">
        <p role="alert" className="text-center text-sm text-muted-foreground">{error}</p>
      </main>
    )
  }

  if (!mapState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Loading market map…</p>
      </main>
    )
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-muted">
      <MapCanvas
        market={mapState.market}
        stalls={mapState.stalls}
        editable={false}
        selectedId={null}
        onSelect={() => undefined}
        onStallDragEnd={() => undefined}
        onStallClick={() => undefined}
        onStallResize={() => undefined}
        onTextLabelChange={() => undefined}
        onMarketResize={() => undefined}
        onScaleChange={() => undefined}
      />
    </main>
  )
}
