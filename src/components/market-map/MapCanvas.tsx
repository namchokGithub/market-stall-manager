import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Rect, Image as KonvaImage, Group } from 'react-konva'
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
const MIN_STALL_SIZE = 40
const HANDLE_SCREEN_SIZE = 10

interface StallResizeHandle {
  x: number
  y: number
  dirX: 1 | -1
  dirY: 1 | -1
  anchorX: number
  anchorY: number
}

function stallResizeHandles(stall: Stall): StallResizeHandle[] {
  const left = stall.x
  const right = stall.x + stall.width
  const top = stall.y
  const bottom = stall.y + stall.height
  return [
    { x: left, y: top, dirX: -1, dirY: -1, anchorX: right, anchorY: bottom },
    { x: right, y: top, dirX: 1, dirY: -1, anchorX: left, anchorY: bottom },
    { x: left, y: bottom, dirX: -1, dirY: 1, anchorX: right, anchorY: top },
    { x: right, y: bottom, dirX: 1, dirY: 1, anchorX: left, anchorY: top },
  ]
}

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
  onStallClick: (stall: Stall, screenPos: { x: number; y: number }) => void
  onStallResize: (id: string, next: { x: number; y: number; width: number; height: number }) => void
  onTextLabelChange: (id: string, label: string) => void
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
  {
    market,
    stalls,
    editable,
    selectedId,
    onSelect,
    onStallDragEnd,
    onStallClick,
    onStallResize,
    onTextLabelChange,
    onMarketResize,
    onScaleChange,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [isDraggingStall, setIsDraggingStall] = useState(false)
  const [isResizingMarket, setIsResizingMarket] = useState(false)
  const [isResizingStall, setIsResizingStall] = useState(false)
  const [hasManualView, setHasManualView] = useState(false)
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [editingText, setEditingText] = useState<{ stall: Stall; value: string } | null>(null)

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

  useEffect(() => {
    const url = market.backgroundImageUrl
    if (!url) {
      setBgImage(null)
      return
    }
    const img = new window.Image()
    img.onload = () => setBgImage(img)
    img.onerror = () => setBgImage(null)
    img.src = url
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [market.backgroundImageUrl])

  useEffect(() => {
    if (!editable) setEditingText(null)
  }, [editable])

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
    onMarketResize({ ...market, width: e.target.x(), height: e.target.y() })
  }

  const handleSize = HANDLE_SCREEN_SIZE / scale
  const corners = [
    { x: 0, y: 0 },
    { x: market.width, y: 0 },
    { x: 0, y: market.height },
    { x: market.width, y: market.height },
  ]

  const selectedStall = stalls.find((s) => s.id === selectedId) ?? null

  const axisBounds = (anchor: number, dir: 1 | -1, marketMax: number) =>
    dir === 1
      ? { min: anchor + MIN_STALL_SIZE, max: marketMax }
      : { min: 0, max: anchor - MIN_STALL_SIZE }

  const handleStallResizeDragEnd = (stall: Stall, handle: StallResizeHandle) => (
    e: KonvaEventObject<DragEvent>,
  ) => {
    setIsResizingStall(false)
    const localX = e.target.x()
    const localY = e.target.y()
    const nextX = handle.dirX === 1 ? handle.anchorX : localX
    const nextWidth = handle.dirX === 1 ? localX - handle.anchorX : handle.anchorX - localX
    const nextY = handle.dirY === 1 ? handle.anchorY : localY
    const nextHeight = handle.dirY === 1 ? localY - handle.anchorY : handle.anchorY - localY
    onStallResize(stall.id, { x: nextX, y: nextY, width: nextWidth, height: nextHeight })
  }

  const commitTextEdit = () => {
    if (!editingText) return
    if (editingText.value !== (editingText.stall.label ?? '')) {
      onTextLabelChange(editingText.stall.id, editingText.value)
    }
    setEditingText(null)
  }

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
        draggable={!isDraggingStall && !isResizingMarket && !isResizingStall}
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
            fill={bgImage ? undefined : '#ffffff'}
            stroke="#475569"
            strokeWidth={2}
            listening={false}
          />
          {bgImage &&
            size.width > 0 &&
            size.height > 0 &&
            (() => {
              const coverScale = Math.max(market.width / bgImage.width, market.height / bgImage.height)
              const drawWidth = bgImage.width * coverScale
              const drawHeight = bgImage.height * coverScale
              return (
                <Group
                  clipX={0}
                  clipY={0}
                  clipWidth={market.width}
                  clipHeight={market.height}
                  listening={false}
                >
                  <KonvaImage
                    image={bgImage}
                    x={(market.width - drawWidth) / 2}
                    y={(market.height - drawHeight) / 2}
                    width={drawWidth}
                    height={drawHeight}
                  />
                </Group>
              )
            })()}
          {bgImage && (
            <Rect
              x={0}
              y={0}
              width={market.width}
              height={market.height}
              fill="#ffffff"
              opacity={market.backgroundTint / 100}
              listening={false}
            />
          )}
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
                onStallClick(stall, {
                  x: stagePos.x + (stall.x + stall.width) * scale + 8,
                  y: stagePos.y + stall.y * scale,
                })
              }}
              onDragStart={() => setIsDraggingStall(true)}
              onDragEnd={(x, y) => {
                setIsDraggingStall(false)
                onStallDragEnd(stall.id, x, y)
              }}
              onTextEdit={(textStall) => {
                if (editable) setEditingText({ stall: textStall, value: textStall.label ?? '' })
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
          {editable &&
            selectedStall &&
            stallResizeHandles(selectedStall).map((handle, i) => (
              <Rect
                key={i}
                x={handle.x}
                y={handle.y}
                offsetX={handleSize / 2}
                offsetY={handleSize / 2}
                width={handleSize}
                height={handleSize}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={1.5 / scale}
                draggable
                dragBoundFunc={(pos) => {
                  const xBounds = axisBounds(handle.anchorX, handle.dirX, market.width)
                  const yBounds = axisBounds(handle.anchorY, handle.dirY, market.height)
                  return {
                    x: clamp(pos.x, stagePos.x + xBounds.min * scale, stagePos.x + xBounds.max * scale),
                    y: clamp(pos.y, stagePos.y + yBounds.min * scale, stagePos.y + yBounds.max * scale),
                  }
                }}
                onDragStart={() => setIsResizingStall(true)}
                onDragEnd={handleStallResizeDragEnd(selectedStall, handle)}
              />
            ))}
        </Layer>
      </Stage>
      {editingText && (
        <input
          autoFocus
          type="text"
          value={editingText.value}
          onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
          onBlur={commitTextEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setEditingText(null)
          }}
          aria-label="Text element content"
          className="absolute rounded border border-blue-500 bg-white px-2 text-center text-slate-800 outline-none ring-1 ring-blue-300"
          style={{
            left: stagePos.x + editingText.stall.x * scale,
            top: stagePos.y + editingText.stall.y * scale,
            width: editingText.stall.width * scale,
            height: editingText.stall.height * scale,
            fontSize: Math.max(12, 16 * scale),
          }}
        />
      )}
    </div>
  )
})
