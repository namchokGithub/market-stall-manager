import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadedDashboardPage } from "../components/dashboard/LoadedDashboardPage";
import { loadMarketState } from "../data/marketDoc";
import { listBookings } from "../data/bookingsRepo";
import type { Stall } from "../types/stall";
import type { Booking } from "../types/booking";

interface DashboardPageData {
  stalls: Stall[];
  bookings: Booking[];
}

export function DashboardPage() {
  const [loadedData, setLoadedData] = useState<DashboardPageData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const load = async () => {
    setIsLoadingInitial(true);
    setLoadError(null);
    try {
      const [marketState, bookings] = await Promise.all([
        loadMarketState(),
        listBookings(),
      ]);
      setLoadedData({
        stalls: marketState.stalls.filter((s) => s.kind === "stall"),
        bookings,
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load dashboard",
      );
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoadingInitial) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button variant="outline" onClick={() => load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!loadedData) {
    return null;
  }

  return (
    <LoadedDashboardPage
      stalls={loadedData.stalls}
      bookings={loadedData.bookings}
    />
  );
}
