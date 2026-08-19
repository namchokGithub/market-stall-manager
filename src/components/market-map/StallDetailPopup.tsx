import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DisplayStall } from '../../types/stall'

export interface StallDetailPopupProps {
  stall: DisplayStall
  x: number
  y: number
  onClose: () => void
}

export function StallDetailPopup({ stall, x, y, onClose }: StallDetailPopupProps) {
  const isOccupied = stall.status === 'occupied'

  return (
    <div
      className="absolute z-10 w-64 rounded-lg border border-border bg-card p-3 shadow-lg"
      style={{ left: x, top: y }}
    >
      <div className="flex items-start justify-between">
        <span className="font-semibold text-foreground">{stall.code}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Status</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isOccupied ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
            }`}
          >
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Category</span>
          <span className="text-foreground">{stall.category ?? '—'}</span>
        </div>
        {isOccupied ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Renter</span>
              <span className="text-foreground">{stall.renterName ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contact</span>
              <span className="text-foreground">{stall.contact ?? '—'}</span>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">No renter — this stall is available.</div>
        )}
      </div>
    </div>
  )
}
