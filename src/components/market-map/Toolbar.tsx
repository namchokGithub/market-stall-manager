import { Eye, Pencil, Undo2, Redo2, Plus, Trash2, ZoomOut, ZoomIn, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ToolbarProps {
  mode: 'view' | 'edit'
  zoomPercent: number
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  onEnterEdit: () => void
  onUndo: () => void
  onRedo: () => void
  onAddStall: () => void
  onDeleteStall: () => void
  onZoomOut: () => void
  onZoomIn: () => void
  onResetView: () => void
}

export function Toolbar({
  mode,
  zoomPercent,
  canUndo,
  canRedo,
  hasSelection,
  onEnterEdit,
  onUndo,
  onRedo,
  onAddStall,
  onDeleteStall,
  onZoomOut,
  onZoomIn,
  onResetView,
}: ToolbarProps) {
  const isEdit = mode === 'edit'

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <span className="mr-2 font-semibold text-slate-800">Market Map</span>

      <Button variant="outline" size="sm" disabled={isEdit} onClick={onEnterEdit}>
        {isEdit ? <Eye className="mr-1 h-4 w-4" /> : <Pencil className="mr-1 h-4 w-4" />}
        Edit Mode
      </Button>

      <Button variant="ghost" size="icon" disabled={!isEdit || !canUndo} onClick={onUndo} aria-label="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled={!isEdit || !canRedo} onClick={onRedo} aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" disabled={!isEdit} onClick={onAddStall} aria-label="Add Stall">
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!isEdit || !hasSelection}
        onClick={onDeleteStall}
        aria-label="Delete Stall"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-slate-200" />

      <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm text-slate-600">{zoomPercent}%</span>
      <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onResetView} aria-label="Reset view">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  )
}
