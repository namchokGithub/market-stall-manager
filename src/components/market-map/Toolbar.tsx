import { Download, Eye, Pencil, ZoomOut, ZoomIn, Maximize, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MapExportFormat } from './MapExportRenderer'

export interface ToolbarProps {
  mode: 'view' | 'edit'
  zoomPercent: number
  canEdit: boolean
  onEnterEdit: () => void
  onZoomOut: () => void
  onZoomIn: () => void
  onResetView: () => void
  isExporting: boolean
  exportError: string | null
  onExport: (format: MapExportFormat) => void
  onShare: () => void
}

export function Toolbar({
  mode,
  zoomPercent,
  canEdit,
  onEnterEdit,
  onZoomOut,
  onZoomIn,
  onResetView,
  isExporting,
  exportError,
  onExport,
  onShare,
}: ToolbarProps) {
  const isEdit = mode === 'edit'

  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
      <span className="mr-2 font-semibold text-foreground">Market Map</span>

      <Button variant="outline" size="sm" disabled={isEdit || !canEdit} onClick={onEnterEdit}>
        {isEdit ? <Eye className="mr-1 h-4 w-4" /> : <Pencil className="mr-1 h-4 w-4" />}
        Edit Mode
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm text-muted-foreground">{zoomPercent}%</span>
      <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onResetView} aria-label="Reset view">
        <Maximize className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            <Download className="mr-1 h-4 w-4" />
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => onExport('png')}>Export as PNG</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport('jpeg')}>Export as JPEG</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onExport('pdf')}>Export as PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {canEdit && (
        <Button variant="outline" size="sm" disabled={isEdit} onClick={onShare}>
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
      )}
      {exportError && <span role="status" className="text-xs text-destructive">{exportError}</span>}
    </div>
  )
}
