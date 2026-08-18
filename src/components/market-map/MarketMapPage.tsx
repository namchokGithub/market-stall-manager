import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadedMarketMapPage } from "./LoadedMarketMapPage";
import { loadMarketState } from "../../data/marketDoc";
import { listBookings } from "../../data/bookingsRepo";
import type { MapState } from "../../types/marketState";
import type { Booking } from "../../types/booking";

interface LoadedData {
  mapState: MapState;
  bookings: Booking[];
}

export function MarketMapPage() {
  const [loadedData, setLoadedData] = useState<LoadedData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const load = async () => {
    setIsLoadingInitial(true);
    setLoadError(null);
    try {
      const [mapState, bookings] = await Promise.all([
        loadMarketState(),
        listBookings(),
      ]);
      setLoadedData({ mapState, bookings });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load market map",
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
        <p className="text-sm text-slate-500">Loading market map…</p>
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
    <LoadedMarketMapPage
      initialState={loadedData.mapState}
      initialBookings={loadedData.bookings}
    />
  );
}
