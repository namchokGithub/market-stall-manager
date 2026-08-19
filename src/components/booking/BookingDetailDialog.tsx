import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelBooking } from "../../data/bookingsRepo";
import type { Booking } from "../../types/booking";

interface BookingDetailDialogProps {
  booking: Booking;
  stallCode: string;
  onClose: () => void;
  onEdit: () => void;
  onCancelled: () => void;
}

export function BookingDetailDialog({
  booking,
  stallCode,
  onClose,
  onEdit,
  onCancelled,
}: BookingDetailDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setError(null);
    setIsCancelling(true);
    try {
      await cancelBooking(booking.id);
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {stallCode} — {booking.renterName}
          </DialogTitle>
          <DialogDescription>View or cancel this booking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Contact</span>
            <span className="text-slate-800">{booking.contact ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Dates</span>
            <span className="text-slate-800">
              {booking.startDate} – {booking.endDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Price</span>
            <span className="text-slate-800">
              {typeof booking.totalPrice === "number"
                ? booking.totalPrice.toLocaleString()
                : "—"}
            </span>
          </div>
          {booking.notes && (
            <div className="flex justify-between">
              <span className="text-slate-500">Notes</span>
              <span className="text-slate-800">{booking.notes}</span>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}>
            {isCancelling ? "Cancelling…" : "Cancel booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
