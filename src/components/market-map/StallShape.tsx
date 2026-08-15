import { Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Stall } from '../../types/stall'

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
    </Group>
  )
}
