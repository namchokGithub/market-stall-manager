import type { LucideIcon } from 'lucide-react'
import {
  Bath,
  DoorOpen,
  Fence,
  LandPlot,
  LogOut,
  RectangleHorizontal,
  SquareParking,
  Store,
  Trash2,
  TreeDeciduous,
  TreePine,
  Type,
} from 'lucide-react'
import type { ElementType } from '../types/stall'

export type ElementCategory = 'commercial' | 'structure' | 'facility' | 'environment' | 'annotation'

export interface ElementTypeInfo {
  category: ElementCategory
  label: string
  icon: LucideIcon
  color: string
  defaultSize: { width: number; height: number }
}

export const ELEMENT_CATEGORY_LABELS: Record<ElementCategory, string> = {
  commercial: 'Commercial',
  structure: 'Structure',
  facility: 'Facility',
  environment: 'Environment',
  annotation: 'Annotation',
}

export const ELEMENT_TYPES: Record<ElementType, ElementTypeInfo> = {
  stall: { category: 'commercial', label: 'Stall', icon: Store, color: '#1e293b', defaultSize: { width: 120, height: 100 } },
  wall: { category: 'structure', label: 'Wall', icon: RectangleHorizontal, color: '#57534e', defaultSize: { width: 100, height: 20 } },
  fence: { category: 'structure', label: 'Fence', icon: Fence, color: '#78716c', defaultSize: { width: 100, height: 16 } },
  entrance: { category: 'structure', label: 'Entrance', icon: DoorOpen, color: '#166534', defaultSize: { width: 60, height: 40 } },
  exit: { category: 'structure', label: 'Exit', icon: LogOut, color: '#991b1b', defaultSize: { width: 60, height: 40 } },
  toilet: { category: 'facility', label: 'Toilet', icon: Bath, color: '#0369a1', defaultSize: { width: 50, height: 50 } },
  parking: { category: 'facility', label: 'Parking', icon: SquareParking, color: '#1d4ed8', defaultSize: { width: 80, height: 60 } },
  trash: { category: 'facility', label: 'Trash', icon: Trash2, color: '#57534e', defaultSize: { width: 40, height: 40 } },
  tree: { category: 'environment', label: 'Tree', icon: TreeDeciduous, color: '#166534', defaultSize: { width: 60, height: 60 } },
  bush: { category: 'environment', label: 'Bush', icon: TreePine, color: '#166534', defaultSize: { width: 60, height: 60 } },
  text: { category: 'annotation', label: 'Text', icon: Type, color: '#1e293b', defaultSize: { width: 120, height: 40 } },
  zone: { category: 'annotation', label: 'Zone', icon: LandPlot, color: '#a855f7', defaultSize: { width: 160, height: 120 } },
}
