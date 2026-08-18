import { Circle, Group, Path, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { ELEMENT_TYPES } from '../../data/elementTypes'
import type { ElementType, DisplayStall } from '../../types/stall'

type IconPart =
  | { type: 'path'; data: string }
  | { type: 'rect'; x: number; y: number; width: number; height: number; cornerRadius?: number }

// Raw paths are copied from the installed lucide-react icon source. Konva does not render React SVG icons.
const ICON_PARTS: Partial<Record<ElementType, IconPart[]>> = {
  wall: [{ type: 'rect', x: 2, y: 6, width: 20, height: 12, cornerRadius: 2 }],
  fence: [
    { type: 'path', data: 'M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z' },
    { type: 'path', data: 'M6 8h4' }, { type: 'path', data: 'M6 18h4' },
    { type: 'path', data: 'm12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z' },
    { type: 'path', data: 'M14 8h4' }, { type: 'path', data: 'M14 18h4' },
    { type: 'path', data: 'm20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z' },
  ],
  entrance: [
    { type: 'path', data: 'M11 20H2' },
    { type: 'path', data: 'M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z' },
    { type: 'path', data: 'M11 4H8a2 2 0 0 0-2 2v14' },
    { type: 'path', data: 'M14 12h.01' }, { type: 'path', data: 'M22 20h-3' },
  ],
  exit: [{ type: 'path', data: 'm16 17 5-5-5-5' }, { type: 'path', data: 'M21 12H9' }, { type: 'path', data: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }],
  toilet: [
    { type: 'path', data: 'M10 4 8 6' }, { type: 'path', data: 'M17 19v2' }, { type: 'path', data: 'M2 12h20' }, { type: 'path', data: 'M7 19v2' },
    { type: 'path', data: 'M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5' },
  ],
  parking: [{ type: 'rect', x: 3, y: 3, width: 18, height: 18, cornerRadius: 2 }, { type: 'path', data: 'M9 17V7h4a3 3 0 0 1 0 6H9' }],
  trash: [
    { type: 'path', data: 'M10 11v6' }, { type: 'path', data: 'M14 11v6' }, { type: 'path', data: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' },
    { type: 'path', data: 'M3 6h18' }, { type: 'path', data: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
  ],
  tree: [{ type: 'path', data: 'M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z' }, { type: 'path', data: 'M12 19v3' }],
  bush: [{ type: 'path', data: 'm17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z' }, { type: 'path', data: 'M12 22v-3' }],
  zone: [
    { type: 'path', data: 'm12 8 6-3-6-3v10' }, { type: 'path', data: 'm8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12' },
    { type: 'path', data: 'm6.49 12.85 11.02 6.3' }, { type: 'path', data: 'M17.51 12.85 6.5 19.15' },
  ],
}

interface StallShapeProps {
  stall: DisplayStall
  selected: boolean
  draggable: boolean
  dragBoundFunc: (pos: { x: number; y: number }) => { x: number; y: number }
  onSelect: () => void
  onDragStart: () => void
  onDragEnd: (x: number, y: number) => void
  onTextEdit: (stall: DisplayStall) => void
}

export function StallShape({ stall, selected, draggable, dragBoundFunc, onSelect, onDragStart, onDragEnd, onTextEdit }: StallShapeProps) {
  const handleDragStart = (e: KonvaEventObject<DragEvent>) => { e.target.moveToTop(); onDragStart() }
  const info = ELEMENT_TYPES[stall.kind]
  const iconScale = (Math.min(stall.width, stall.height) * 0.7) / 24
  const iconOffset = { x: (stall.width - 24 * iconScale) / 2, y: (stall.height - 24 * iconScale) / 2 }
  const genericParts = ICON_PARTS[stall.kind] ?? []

  return (
    <Group x={stall.x} y={stall.y} draggable={draggable} dragBoundFunc={dragBoundFunc} onClick={onSelect} onTap={onSelect} onDragStart={handleDragStart} onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())} onDblClick={() => stall.kind === 'text' && onTextEdit(stall)} onDblTap={() => stall.kind === 'text' && onTextEdit(stall)}>
      {stall.kind === 'stall' ? <><Rect width={stall.width} height={stall.height} fill={selected ? '#dbeafe' : '#ffffff'} stroke={selected ? '#2563eb' : '#94a3b8'} strokeWidth={selected ? 3 : 1} cornerRadius={4} /><Text text={stall.code} width={stall.width} height={stall.height} align="center" verticalAlign="middle" fontSize={16} fontStyle="600" fill="#1e293b" listening={false} />{stall.status === 'occupied' && <Circle x={stall.width - 8} y={8} radius={5} fill="#22c55e" stroke="#ffffff" strokeWidth={1} listening={false} />}</> : stall.kind === 'text' ? <><Rect width={stall.width} height={stall.height} fill={selected ? '#dbeafe' : '#f8fafc'} stroke={selected ? '#2563eb' : '#94a3b8'} strokeWidth={selected ? 3 : 1} cornerRadius={4} /><Text text={stall.label || 'Double-click to edit'} width={stall.width} height={stall.height} align="center" verticalAlign="middle" fontSize={16} fill="#1e293b" listening={false} /></> : <><Rect width={stall.width} height={stall.height} fill={selected ? '#dbeafe' : info.color} opacity={selected ? 1 : stall.kind === 'zone' ? 0.15 : 0.08} stroke={selected ? '#2563eb' : info.color} strokeWidth={selected ? 3 : 1} cornerRadius={8} /><Group x={iconOffset.x} y={iconOffset.y} scaleX={iconScale} scaleY={iconScale} listening={false}>{genericParts.map((part, index) => part.type === 'path' ? <Path key={index} data={part.data} stroke={selected ? '#2563eb' : info.color} strokeWidth={2} lineCap="round" lineJoin="round" /> : <Rect key={index} x={part.x} y={part.y} width={part.width} height={part.height} cornerRadius={part.cornerRadius ?? 0} stroke={selected ? '#2563eb' : info.color} strokeWidth={2} />)}</Group>{stall.kind === 'zone' && <Text text={stall.label || info.label} width={stall.width} height={stall.height} align="center" verticalAlign="bottom" padding={8} fontSize={14} fontStyle="600" fill={info.color} listening={false} />}</>}
    </Group>
  )
}
