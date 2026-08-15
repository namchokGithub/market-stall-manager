import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Stall } from '../../types/stall'
import type { MarketLayout } from '../../types/market'
import { StallShape } from './StallShape'

const MIN_SCALE = 0.3
const MAX_SCALE = 3
const ZOOM_STEP = 1.1
const MARKET_PADDING = 40
const MIN_MARKET_SIZE = 100
const HANDLE_SCREEN_SIZE = 10

export interface MapCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface MapCanvasProps {
  market: MarketLayout
  stalls: Stall[]
  editable: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStallDragEnd: (id: string, x: number, y: number) => void
  onMarketResize: (nextMarket: MarketLayout) => void
  onScaleChange: (scalePercent: number) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function computeFitTransform(containerSize: { width: number; height: number }, market: MarketLayout) {
  if (containerSize.width <= 0 || containerSize.height <= 0) {
    return { scale: 1, pos: { x: 0, y: 0 } }
  }
  const availableWidth = Math.max(containerSize.width - MARKET_PADDING * 2, 1)
  const availableHeight = Math.max(containerSize.height - MARKET_PADDING * 2, 1)
  const fitScale = Math.min(availableWidth / market.width, availableHeight / market.height)
  return {
    scale: fitScale,
    pos: {
      x: (containerSize.width - market.width * fitScale) / 2,
      y: (containerSize.height - market.height * fitScale) / 2,
    },
  }
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { market, stalls, editable, selectedId, onSelect, onStallDragEnd, onMarketResize, onScaleChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isDraggingStall, setIsDraggingStall] = useState(false)
  const [isResizingMarket, setIsResizingMarket] = useState(false)
  const [hasManualView, setHasManualView] = useState(false)

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

  useEffect(() => {
    if (hasManualView) return
    const fit = computeFitTransform(size, market)
    setScale(fit.scale)
    setStagePos(fit.pos)
  }, [size, market, hasManualView])

  useEffect(() => {
    onScaleChange(Math.round(scale * 100))
  }, [scale, onScaleChange])

  const applyScale = (nextScale: number, focal?: { x: number; y: number }) => {
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE)
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
    setHasManualView(true)
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => applyScale(scale * ZOOM_STEP),
    zoomOut: () => applyScale(scale / ZOOM_STEP),
    resetView: () => {
      setHasManualView(false)
      const fit = computeFitTransform(size, market)
      setScale(fit.scale)
      setStagePos(fit.pos)
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
    setHasManualView(true)
    setStagePos({ x: e.target.x(), y: e.target.y() })
  }

  const minWidth = Math.max(MIN_MARKET_SIZE, ...stalls.map((s) => s.x + s.width))
  const minHeight = Math.max(MIN_MARKET_SIZE, ...stalls.map((s) => s.y + s.height))

  const handleResizeDragBound = (pos: { x: number; y: number }) => ({
    x: Math.max(pos.x, stagePos.x + minWidth * scale),
    y: Math.max(pos.y, stagePos.y + minHeight * scale),
  })

  const handleResizeDragEnd = (e: KonvaEventObject<DragEvent>) => {
    setIsResizingMarket(false)
    onMarketResize({ width: e.target.x(), height: e.target.y() })
  }

  const handleSize = HANDLE_SCREEN_SIZE / scale
  const corners = [
    { x: 0, y: 0 },
    { x: market.width, y: 0 },
    { x: 0, y: market.height },
    { x: market.width, y: market.height },
  ]

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
        draggable={!isDraggingStall && !isResizingMarket}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        onClick={(e) => {
          if (e.target === e.target.getStage()) onSelect(null)
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={market.width}
            height={market.height}
            fill="#ffffff"
            stroke="#475569"
            strokeWidth={2}
            listening={false}
          />
          {stalls.map((stall) => (
            <StallShape
              key={stall.id}
              stall={stall}
              selected={stall.id === selectedId}
              draggable={editable}
              dragBoundFunc={(pos) => ({
                x: clamp(
                  pos.x,
                  stagePos.x,
                  stagePos.x + (market.width - stall.width) * scale,
                ),
                y: clamp(
                  pos.y,
                  stagePos.y,
                  stagePos.y + (market.height - stall.height) * scale,
                ),
              })}
              onSelect={() => {
                if (editable) onSelect(stall.id)
              }}
              onDragStart={() => setIsDraggingStall(true)}
              onDragEnd={(x, y) => {
                setIsDraggingStall(false)
                onStallDragEnd(stall.id, x, y)
              }}
            />
          ))}
          {editable &&
            corners.map((corner, i) => (
              <Rect
                key={i}
                x={corner.x}
                y={corner.y}
                offsetX={handleSize / 2}
                offsetY={handleSize / 2}
                width={handleSize}
                height={handleSize}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={1.5 / scale}
                draggable
                dragBoundFunc={handleResizeDragBound}
                onDragStart={() => setIsResizingMarket(true)}
                onDragEnd={handleResizeDragEnd}
              />
            ))}
        </Layer>
      </Stage>
    </div>
  )
})
