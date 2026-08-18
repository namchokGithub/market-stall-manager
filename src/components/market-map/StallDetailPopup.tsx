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
      className="absolute z-10 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
      style={{ left: x, top: y }}
    >
      <div className="flex items-start justify-between">
        <span className="font-semibold text-slate-800">{stall.code}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Status</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isOccupied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isOccupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Category</span>
          <span className="text-slate-800">{stall.category ?? '—'}</span>
        </div>
        {isOccupied ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Renter</span>
              <span className="text-slate-800">{stall.renterName ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Contact</span>
              <span className="text-slate-800">{stall.contact ?? '—'}</span>
            </div>
          </>
        ) : (
          <div className="text-slate-400">No renter — this stall is available.</div>
        )}
      </div>
    </div>
  )
}
