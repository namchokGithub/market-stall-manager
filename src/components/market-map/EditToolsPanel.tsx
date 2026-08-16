import { useEffect, useState } from "react";
import { Undo2, Redo2, Plus, Trash2, Image, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ELEMENT_CATEGORY_LABELS,
  ELEMENT_TYPES,
  type ElementCategory,
} from "../../data/elementTypes";
import type { ElementType } from "../../types/stall";

export interface EditToolsPanelProps {
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  backgroundImageUrl?: string;
  backgroundTint: number;
  onUndo: () => void;
  onRedo: () => void;
  onAddElement: (type: ElementType) => void;
  onDeleteStall: () => void;
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTintChange: (tint: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditToolsPanel({
  canUndo,
  canRedo,
  hasSelection,
  backgroundImageUrl,
  backgroundTint,
  onUndo,
  onRedo,
  onAddElement,
  onDeleteStall,
  onBackgroundImageChange,
  onBackgroundTintChange,
  onSave,
  onCancel,
}: EditToolsPanelProps) {
  const [urlInput, setUrlInput] = useState(backgroundImageUrl ?? "");
  useEffect(() => {
    setUrlInput(backgroundImageUrl ?? "");
  }, [backgroundImageUrl]);

  const commitUrl = () => {
    if (urlInput !== (backgroundImageUrl ?? ""))
      onBackgroundImageChange(urlInput);
  };
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
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />
      <label className="mt-2 flex items-center justify-between px-1 text-xs font-medium text-slate-500">
        <span>Background Tint</span>
        <span>{backgroundTint}%</span>
      </label>
      <input
        type="range"
        min="0"
        max="100"
        value={backgroundTint}
        onChange={(e) => onBackgroundTintChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-blue-600"
        aria-label="Background Tint"
      />

      <div className="my-1 h-px bg-slate-200" />

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="flex-1"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="flex-1"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="my-1 h-px bg-slate-200" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Add Element
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(Object.keys(ELEMENT_CATEGORY_LABELS) as ElementCategory[]).map(
            (category, categoryIndex) => (
              <div key={category}>
                {categoryIndex > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="px-2 py-1 text-xs font-medium text-slate-500">
                  {ELEMENT_CATEGORY_LABELS[category]}
                </DropdownMenuLabel>
                {(
                  Object.entries(ELEMENT_TYPES) as [
                    ElementType,
                    (typeof ELEMENT_TYPES)[ElementType],
                  ][]
                )
                  .filter(([, info]) => info.category === category)
                  .map(([type, info]) => {
                    const Icon = info.icon;
                    return (
                      <DropdownMenuItem
                        key={type}
                        onSelect={() => onAddElement(type)}>
                        <Icon
                          className="h-4 w-4"
                          style={{ color: info.color }}
                        />
                        {info.label}
                      </DropdownMenuItem>
                    );
                  })}
              </div>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        className="justify-start"
        disabled={!hasSelection}
        onClick={onDeleteStall}>
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
  );
}
