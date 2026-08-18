import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadedMarketMapPage } from "./LoadedMarketMapPage";
import { loadMarketState } from "../../data/marketDoc";
import type { MapState } from "../../types/marketState";

export function MarketMapPage() {
  const [loadedState, setLoadedState] = useState<MapState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const load = async () => {
    setIsLoadingInitial(true);
    setLoadError(null);
    try {
      const result = await loadMarketState();
      setLoadedState(result);
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

  if (!loadedState) {
    return null;
  }

  return <LoadedMarketMapPage initialState={loadedState} />;
}
