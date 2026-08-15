import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Stall } from '../../types/stall'
import { StallShape } from './StallShape'

const MIN_SCALE = 0.3
const MAX_SCALE = 3
const ZOOM_STEP = 1.1

export interface MapCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface MapCanvasProps {
  stalls: Stall[]
  editable: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStallDragEnd: (id: string, x: number, y: number) => void
  onScaleChange: (scalePercent: number) => void
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { stalls, editable, selectedId, onSelect, onStallDragEnd, onScaleChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [draggingStallId, setDraggingStallId] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const applyScale = (nextScale: number, focal?: { x: number; y: number }) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
    const center = focal ?? { x: size.width / 2, y: size.height / 2 }
    const mousePointTo = {
      x: (center.x - stagePos.x) / scale,
      y: (center.y - stagePos.y) / scale,
    }
    setStagePos({
      x: center.x - mousePointTo.x * clamped,
      y: center.y - mousePointTo.y * clamped,
    })
    setScale(clamped)
    onScaleChange(Math.round(clamped * 100))
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => applyScale(scale * ZOOM_STEP),
    zoomOut: () => applyScale(scale / ZOOM_STEP),
    resetView: () => {
      setScale(1)
      setStagePos({ x: 0, y: 0 })
      onScaleChange(100)
    },
  }))

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const direction = e.evt.deltaY > 0 ? -1 : 1
    applyScale(direction > 0 ? scale * ZOOM_STEP : scale / ZOOM_STEP, pointer)
  }

  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (e.target !== e.target.getStage()) return
    setStagePos({ x: e.target.x(), y: e.target.y() })
  }

  const draggingStall = stalls.find((s) => s.id === draggingStallId) ?? null

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-100">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={draggingStallId === null}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        onClick={(e) => {
          if (e.target === e.target.getStage()) onSelect(null)
        }}
      >
        <Layer>
          {stalls
            .filter((s) => s.id !== draggingStallId)
            .map((stall) => (
              <StallShape
                key={stall.id}
                stall={stall}
                selected={stall.id === selectedId}
                draggable={editable}
                onSelect={() => onSelect(stall.id)}
                onDragStart={() => setDraggingStallId(stall.id)}
                onDragEnd={(x, y) => {
                  setDraggingStallId(null)
                  onStallDragEnd(stall.id, x, y)
                }}
              />
            ))}
        </Layer>
        <Layer>
          {draggingStall && (
            <StallShape
              stall={draggingStall}
              selected={draggingStall.id === selectedId}
              draggable={editable}
              onSelect={() => onSelect(draggingStall.id)}
              onDragStart={() => setDraggingStallId(draggingStall.id)}
              onDragEnd={(x, y) => {
                setDraggingStallId(null)
                onStallDragEnd(draggingStall.id, x, y)
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
})
