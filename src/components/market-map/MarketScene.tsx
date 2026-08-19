import { Group, Image as KonvaImage, Rect } from 'react-konva'
import type { DisplayStall } from '../../types/stall'
import type { MarketLayout } from '../../types/market'
import { StallShape } from './StallShape'

interface MarketSceneProps {
  market: MarketLayout
  stalls: DisplayStall[]
  backgroundImage: HTMLImageElement | null
  selectedId?: string | null
  draggable?: boolean
  dragBoundFunc?: (stall: DisplayStall, pos: { x: number; y: number }) => { x: number; y: number }
  onSelect?: (stall: DisplayStall) => void
  onDragStart?: () => void
  onDragEnd?: (stall: DisplayStall, x: number, y: number) => void
  onTextEdit?: (stall: DisplayStall) => void
}

const passthrough = (pos: { x: number; y: number }) => pos

export function MarketScene({
  market,
  stalls,
  backgroundImage,
  selectedId = null,
  draggable = false,
  dragBoundFunc,
  onSelect,
  onDragStart,
  onDragEnd,
  onTextEdit,
}: MarketSceneProps) {
  const coverScale = backgroundImage
    ? Math.max(market.width / backgroundImage.width, market.height / backgroundImage.height)
    : 1
  const drawWidth = backgroundImage ? backgroundImage.width * coverScale : 0
  const drawHeight = backgroundImage ? backgroundImage.height * coverScale : 0

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={market.width}
        height={market.height}
        fill={backgroundImage ? undefined : '#ffffff'}
        stroke="#475569"
        strokeWidth={2}
        listening={false}
      />
      {backgroundImage && (
        <Group clipX={0} clipY={0} clipWidth={market.width} clipHeight={market.height} listening={false}>
          <KonvaImage
            image={backgroundImage}
            x={(market.width - drawWidth) / 2}
            y={(market.height - drawHeight) / 2}
            width={drawWidth}
            height={drawHeight}
          />
        </Group>
      )}
      {backgroundImage && (
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
          draggable={draggable}
          dragBoundFunc={(pos) => dragBoundFunc?.(stall, pos) ?? passthrough(pos)}
          onSelect={() => onSelect?.(stall)}
          onDragStart={() => onDragStart?.()}
          onDragEnd={(x, y) => onDragEnd?.(stall, x, y)}
          onTextEdit={(textStall) => onTextEdit?.(textStall)}
        />
      ))}
    </>
  )
}
