import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createBooking } from '../../data/bookingsRepo'
import type { Stall } from '../../types/stall'

interface BookingFormDialogProps {
  stalls: Stall[]
  initialStallId: string
  initialDate: string
  onClose: () => void
  onCreated: () => void
}

export function BookingFormDialog({ stalls, initialStallId, initialDate, onClose, onCreated }: BookingFormDialogProps) {
  const [stallId, setStallId] = useState(initialStallId)
  const [renterName, setRenterName] = useState('')
  const [contact, setContact] = useState('')
  const [startDate, setStartDate] = useState(initialDate)
  const [endDate, setEndDate] = useState(initialDate)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (endDate < startDate) {
      setError('End date must be on or after the start date.')
      return
    }

    const trimmedRenterName = renterName.trim()
    if (!trimmedRenterName) {
      setError('Renter name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await createBooking({
        stallId,
        renterName: trimmedRenterName,
        contact: contact || undefined,
        startDate,
        endDate,
        notes: notes || undefined,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>Reserve a stall for a date range.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="booking-stall">
              Stall
            </label>
            <select
              id="booking-stall"
              value={stallId}
              onChange={(e) => setStallId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="booking-renter">
              Renter name
            </label>
            <input
              id="booking-renter"
              required
              value={renterName}
              onChange={(e) => setRenterName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="booking-contact">
              Contact (optional)
            </label>
            <input
              id="booking-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="booking-start">
                Start date
              </label>
              <input
                id="booking-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="booking-end">
                End date
              </label>
              <input
                id="booking-end"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="booking-notes">
              Notes (optional)
            </label>
            <input
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Create booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
