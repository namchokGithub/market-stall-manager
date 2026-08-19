import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createBooking, updateBooking } from "../../data/bookingsRepo";
import type { Booking } from "../../types/booking";
import type { Stall } from "../../types/stall";

interface BookingFormDialogProps {
  stalls: Stall[];
  initialStallId: string;
  initialDate: string;
  booking?: Booking;
  onClose: () => void;
  onSaved: () => void;
}

export function BookingFormDialog({
  stalls,
  initialStallId,
  initialDate,
  booking,
  onClose,
  onSaved,
}: BookingFormDialogProps) {
  const [stallId, setStallId] = useState(booking?.stallId ?? initialStallId);
  const [renterName, setRenterName] = useState(booking?.renterName ?? "");
  const [contact, setContact] = useState(booking?.contact ?? "");
  const [totalPrice, setTotalPrice] = useState(booking?.totalPrice?.toString() ?? "");
  const [startDate, setStartDate] = useState(booking?.startDate ?? initialDate);
  const [endDate, setEndDate] = useState(booking?.endDate ?? initialDate);
  const [notes, setNotes] = useState(booking?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Start and end dates are required.");
      return;
    }

    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    const trimmedRenterName = renterName.trim();
    if (!trimmedRenterName) {
      setError("Renter name is required.");
      return;
    }

    const parsedPrice = Number(totalPrice);
    if (
      totalPrice.trim() === "" ||
      Number.isNaN(parsedPrice) ||
      parsedPrice <= 0
    ) {
      setError("Total price must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input = {
        stallId,
        renterName: trimmedRenterName,
        contact: contact || undefined,
        totalPrice: parsedPrice,
        startDate,
        endDate,
        notes: notes || undefined,
      };
      if (booking) {
        await updateBooking(booking.id, input);
      } else {
        await createBooking(input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking ? "Edit booking" : "New booking"}</DialogTitle>
          <DialogDescription>
            {booking ? "Update this booking's details." : "Reserve a stall for a date range."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-stall">
              Stall
            </label>
            <select
              id="booking-stall"
              value={stallId}
              onChange={(e) => setStallId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              {stalls.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-renter">
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
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-contact">
              Contact (optional)
            </label>
            <input
              id="booking-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-price">
              Total price
            </label>
            <input
              id="booking-price"
              type="number"
              min="0"
              step="1"
              required
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="booking-start">
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
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="booking-end">
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
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="booking-notes">
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
              {isSubmitting ? "Saving…" : booking ? "Save changes" : "Create booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
