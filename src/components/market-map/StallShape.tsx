import { Group, Rect, Path, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Stall } from '../../types/stall'

// lucide-react "tree-pine" icon, 24x24 viewBox (verbatim from lucide-react's icon source)
const TREE_PINE_SILHOUETTE =
  'm17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z'
const TREE_PINE_TRUNK = 'M12 22v-3'
const TREE_PINE_VIEWBOX = 24

interface StallShapeProps {
  stall: Stall
  selected: boolean
  draggable: boolean
  dragBoundFunc: (pos: { x: number; y: number }) => { x: number; y: number }
  onSelect: () => void
  onDragStart: () => void
  onDragEnd: (x: number, y: number) => void
}

export function StallShape({
  stall,
  selected,
  draggable,
  dragBoundFunc,
  onSelect,
  onDragStart,
  onDragEnd,
}: StallShapeProps) {
  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    e.target.moveToTop()
    onDragStart()
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onDragEnd(e.target.x(), e.target.y())
  }

  const iconScale = (Math.min(stall.width, stall.height) * 0.8) / TREE_PINE_VIEWBOX
  const iconOffset = {
    x: (stall.width - TREE_PINE_VIEWBOX * iconScale) / 2,
    y: (stall.height - TREE_PINE_VIEWBOX * iconScale) / 2,
  }

  return (
    <Group
      x={stall.x}
      y={stall.y}
      draggable={draggable}
      dragBoundFunc={dragBoundFunc}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {stall.kind === 'bush' ? (
        <>
          <Rect
            width={stall.width}
            height={stall.height}
            fill={selected ? '#dbeafe' : 'transparent'}
            cornerRadius={8}
          />
          <Group
            x={iconOffset.x}
            y={iconOffset.y}
            scaleX={iconScale}
            scaleY={iconScale}
            listening={false}
          >
            <Path
              data={TREE_PINE_SILHOUETTE}
              stroke={selected ? '#2563eb' : '#166534'}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
            <Path
              data={TREE_PINE_TRUNK}
              stroke={selected ? '#2563eb' : '#166534'}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          </Group>
        </>
      ) : (
        <>
          <Rect
            width={stall.width}
            height={stall.height}
            fill={selected ? '#dbeafe' : '#ffffff'}
            stroke={selected ? '#2563eb' : '#94a3b8'}
            strokeWidth={selected ? 3 : 1}
            cornerRadius={4}
          />
          <Text
            text={stall.code}
            width={stall.width}
            height={stall.height}
            align="center"
            verticalAlign="middle"
            fontSize={16}
            fontStyle="600"
            fill="#1e293b"
            listening={false}
          />
        </>
      )}
    </Group>
  )
}
