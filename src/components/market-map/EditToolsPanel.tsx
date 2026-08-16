import { useEffect, useState } from 'react'
import { Undo2, Redo2, Plus, TreePine, Trash2, Image, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EditToolsPanelProps {
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  backgroundImageUrl?: string
  onUndo: () => void
  onRedo: () => void
  onAddStall: () => void
  onAddBush: () => void
  onDeleteStall: () => void
  onBackgroundImageChange: (url: string) => void
  onSave: () => void
  onCancel: () => void
}

export function EditToolsPanel({
  canUndo,
  canRedo,
  hasSelection,
  backgroundImageUrl,
  onUndo,
  onRedo,
  onAddStall,
  onAddBush,
  onDeleteStall,
  onBackgroundImageChange,
  onSave,
  onCancel,
}: EditToolsPanelProps) {
  const [urlInput, setUrlInput] = useState(backgroundImageUrl ?? '')

  useEffect(() => {
    setUrlInput(backgroundImageUrl ?? '')
  }, [backgroundImageUrl])

  const commitUrl = () => {
    if (urlInput !== (backgroundImageUrl ?? '')) onBackgroundImageChange(urlInput)
  }
  return (
    <div className="absolute right-4 top-4 flex w-44 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
      <label className="flex items-center gap-1 px-1 text-xs font-medium text-slate-500">
        <Image className="h-3.5 w-3.5" />
        Background URL
      </label>
      <input
        type="text"
        value={urlInput}
        placeholder="https://…"
        onChange={(e) => setUrlInput(e.target.value)}
        onBlur={commitUrl}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />

      <div className="my-1 h-px bg-slate-200" />

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
