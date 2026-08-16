import { useRef, useState } from 'react'
import { MapCanvas, type MapCanvasHandle } from './MapCanvas'
import { Toolbar } from './Toolbar'
import { useMapHistory } from '../../state/useMapHistory'
import { DEFAULT_MARKET, mockStalls, nextStallCode } from '../../data/mockStalls'
import type { Stall } from '../../types/stall'
import type { MarketLayout } from '../../types/market'

interface MapState {
  market: MarketLayout
  stalls: Stall[]
}

const NEW_STALL_SIZE = { width: 120, height: 100 }
const NEW_STALL_ANCHOR = { x: 40, y: 460 }
const NEW_BUSH_SIZE = { width: 60, height: 60 }
const NEW_BUSH_ANCHOR = { x: 40, y: 460 }

function clampAnchor(anchor: { x: number; y: number }, size: { width: number; height: number }, market: MarketLayout) {
  return {
    x: Math.min(Math.max(anchor.x, 0), Math.max(market.width - size.width, 0)),
    y: Math.min(Math.max(anchor.y, 0), Math.max(market.height - size.height, 0)),
  }
}

export function MarketMapPage() {
  const [savedState, setSavedState] = useState<MapState>({ market: DEFAULT_MARKET, stalls: mockStalls })
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoomPercent, setZoomPercent] = useState(100)
  const history = useMapHistory<MapState>(savedState)
  const canvasRef = useRef<MapCanvasHandle>(null)

  const draftState = history.present
  const { market, stalls } = mode === 'edit' ? draftState : savedState

  const handleEnterEdit = () => {
    history.reset(savedState)
    setSelectedId(null)
    setMode('edit')
  }

  const handleAddStall = () => {
    const code = nextStallCode(draftState.stalls)
    const anchor = clampAnchor(NEW_STALL_ANCHOR, NEW_STALL_SIZE, draftState.market)
    const newStall: Stall = {
      id: code.toLowerCase(),
      kind: 'stall',
      code,
      x: anchor.x,
      y: anchor.y,
      ...NEW_STALL_SIZE,
    }
    history.commit({ market: draftState.market, stalls: [...draftState.stalls, newStall] })
    setSelectedId(newStall.id)
  }

  const handleAddBush = () => {
    const anchor = clampAnchor(NEW_BUSH_ANCHOR, NEW_BUSH_SIZE, draftState.market)
    const newBush: Stall = {
      id: `bush-${crypto.randomUUID()}`,
      kind: 'bush',
      code: '',
      x: anchor.x,
      y: anchor.y,
      ...NEW_BUSH_SIZE,
    }
    history.commit({ market: draftState.market, stalls: [...draftState.stalls, newBush] })
    setSelectedId(newBush.id)
  }

  const handleDeleteStall = () => {
    if (!selectedId) return
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.filter((s) => s.id !== selectedId),
    })
    setSelectedId(null)
  }

  const handleStallDragEnd = (id: string, x: number, y: number) => {
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.map((s) => (s.id === id ? { ...s, x, y } : s)),
    })
  }

  const handleMarketResize = (nextMarket: MarketLayout) => {
    history.commit({ market: nextMarket, stalls: draftState.stalls })
  }

  const handleStallResize = (
    id: string,
    next: { x: number; y: number; width: number; height: number },
  ) => {
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.map((s) => (s.id === id ? { ...s, ...next } : s)),
    })
  }

  const handleSave = () => {
    setSavedState(draftState)
    console.log(JSON.stringify({ market: draftState.market, stalls: draftState.stalls }, null, 2))
    setSelectedId(null)
    setMode('view')
  }

  const handleCancel = () => {
    setSelectedId(null)
    setMode('view')
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <Toolbar
        mode={mode}
        zoomPercent={zoomPercent}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        hasSelection={stalls.some((s) => s.id === selectedId)}
        onEnterEdit={handleEnterEdit}
        onUndo={history.undo}
        onRedo={history.redo}
        onAddStall={handleAddStall}
        onAddBush={handleAddBush}
        onDeleteStall={handleDeleteStall}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onResetView={() => canvasRef.current?.resetView()}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <div className="flex-1">
        <MapCanvas
          ref={canvasRef}
          market={market}
          stalls={stalls}
          editable={mode === 'edit'}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onStallDragEnd={handleStallDragEnd}
          onStallResize={handleStallResize}
          onMarketResize={handleMarketResize}
          onScaleChange={setZoomPercent}
        />
      </div>
    </div>
  )
}
