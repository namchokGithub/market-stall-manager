import { Undo2, Redo2, Plus, TreePine, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EditToolsPanelProps {
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  onUndo: () => void
  onRedo: () => void
  onAddStall: () => void
  onAddBush: () => void
  onDeleteStall: () => void
  onSave: () => void
  onCancel: () => void
}

export function EditToolsPanel({
  canUndo,
  canRedo,
  hasSelection,
  onUndo,
  onRedo,
  onAddStall,
  onAddBush,
  onDeleteStall,
  onSave,
  onCancel,
}: EditToolsPanelProps) {
  return (
    <div className="absolute right-4 top-4 flex w-44 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="flex-1"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="flex-1"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="my-1 h-px bg-slate-200" />

      <Button variant="ghost" className="justify-start" onClick={onAddStall}>
        <Plus className="mr-2 h-4 w-4" />
        Add Stall
      </Button>
      <Button variant="ghost" className="justify-start" onClick={onAddBush}>
        <TreePine className="mr-2 h-4 w-4" />
        Add Bush
      </Button>
      <Button
        variant="ghost"
        className="justify-start"
        disabled={!hasSelection}
        onClick={onDeleteStall}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <div className="my-1 h-px bg-slate-200" />

      <Button variant="default" className="justify-start" onClick={onSave}>
        <Save className="mr-2 h-4 w-4" />
        Save
      </Button>
      <Button variant="outline" className="justify-start" onClick={onCancel}>
        <X className="mr-2 h-4 w-4" />
        Cancel
      </Button>
    </div>
  )
}
