import { useRef, useState } from 'react'
import { MapCanvas, type MapCanvasHandle } from './MapCanvas'
import { Toolbar } from './Toolbar'
import { useMapHistory } from '../../state/useMapHistory'
import { mockStalls, nextStallCode } from '../../data/mockStalls'
import type { Stall } from '../../types/stall'

const NEW_STALL_SIZE = { width: 120, height: 100 }
const NEW_STALL_ANCHOR = { x: 40, y: 460 }

export function MarketMapPage() {
  const [savedLayout, _setSavedLayout] = useState<Stall[]>(mockStalls)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoomPercent, setZoomPercent] = useState(100)
  const history = useMapHistory(savedLayout)
  const canvasRef = useRef<MapCanvasHandle>(null)

  const draftLayout = history.present
  const stalls = mode === 'edit' ? draftLayout : savedLayout

  const handleEnterEdit = () => {
    history.reset(savedLayout)
    setSelectedId(null)
    setMode('edit')
  }

  const handleAddStall = () => {
    const code = nextStallCode(draftLayout)
    const newStall: Stall = {
      id: code.toLowerCase(),
      code,
      x: NEW_STALL_ANCHOR.x,
      y: NEW_STALL_ANCHOR.y,
      ...NEW_STALL_SIZE,
    }
    history.commit([...draftLayout, newStall])
    setSelectedId(newStall.id)
  }

  const handleDeleteStall = () => {
    if (!selectedId) return
    history.commit(draftLayout.filter((s) => s.id !== selectedId))
    setSelectedId(null)
  }

  const handleStallDragEnd = (id: string, x: number, y: number) => {
    history.commit(draftLayout.map((s) => (s.id === id ? { ...s, x, y } : s)))
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <Toolbar
        mode={mode}
        zoomPercent={zoomPercent}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        hasSelection={selectedId !== null}
        onEnterEdit={handleEnterEdit}
        onUndo={history.undo}
        onRedo={history.redo}
        onAddStall={handleAddStall}
        onDeleteStall={handleDeleteStall}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onResetView={() => canvasRef.current?.resetView()}
      />
      <div className="flex-1">
        <MapCanvas
          ref={canvasRef}
          stalls={stalls}
          editable={mode === 'edit'}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onStallDragEnd={handleStallDragEnd}
          onScaleChange={setZoomPercent}
        />
      </div>
    </div>
  )
}
