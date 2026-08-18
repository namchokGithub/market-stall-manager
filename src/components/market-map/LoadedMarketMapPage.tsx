import { useRef, useState } from "react";
import { MapCanvas, type MapCanvasHandle } from "./MapCanvas";
import { Toolbar } from "./Toolbar";
import { EditToolsPanel } from "./EditToolsPanel";
import { StallDetailPopup } from "./StallDetailPopup";
import { useMapHistory } from "../../state/useMapHistory";
import { useAuth } from "../../auth/AuthProvider";
import { nextStallCode } from "../../data/mockStalls";
import { ELEMENT_TYPES } from "../../data/elementTypes";
import { saveMarketState } from "../../data/marketDoc";
import { activeBookingsByStallId, withOccupancy } from "../../data/bookingOccupancy";
import { todayIso } from "../../lib/dates";
import type { ElementType, Stall } from "../../types/stall";
import type { MarketLayout } from "../../types/market";
import type { MapState } from "../../types/marketState";
import type { Booking } from "../../types/booking";

const NEW_ELEMENT_ANCHOR = { x: 40, y: 460 };

function clampAnchor(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  market: MarketLayout,
) {
  return {
    x: Math.min(Math.max(anchor.x, 0), Math.max(market.width - size.width, 0)),
    y: Math.min(
      Math.max(anchor.y, 0),
      Math.max(market.height - size.height, 0),
    ),
  };
}

interface LoadedMarketMapPageProps {
  initialState: MapState;
  initialBookings: Booking[];
}

export function LoadedMarketMapPage({
  initialState,
  initialBookings,
}: LoadedMarketMapPageProps) {
  const { isAdmin } = useAuth();
  const [savedState, setSavedState] = useState<MapState>(initialState);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [detailView, setDetailView] = useState<{
    stallId: string;
    x: number;
    y: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const history = useMapHistory<MapState>(savedState);
  const canvasRef = useRef<MapCanvasHandle>(null);

  const draftState = history.present;
  const { market, stalls: rawStalls } = mode === "edit" ? draftState : savedState;
  const activeBookings = activeBookingsByStallId(initialBookings, todayIso());
  const stalls = withOccupancy(rawStalls, activeBookings);
  const detailStall = detailView ? stalls.find((s) => s.id === detailView.stallId) ?? null : null;

  const handleEnterEdit = () => {
    history.reset(savedState);
    setSelectedId(null);
    setDetailView(null);
    setMode("edit");
  };

  const handleStallClick = (
    stall: Stall,
    screenPos: { x: number; y: number },
  ) => {
    if (mode !== "view" || stall.kind !== "stall") return;
    setDetailView({ stallId: stall.id, x: screenPos.x, y: screenPos.y });
  };

  const handleAddElement = (type: ElementType) => {
    const info = ELEMENT_TYPES[type];
    const anchor = clampAnchor(
      NEW_ELEMENT_ANCHOR,
      info.defaultSize,
      draftState.market,
    );
    const newElement: Stall = {
      id: `${type}-${crypto.randomUUID()}`,
      kind: type,
      code: type === "stall" ? nextStallCode(draftState.stalls) : "",
      x: anchor.x,
      y: anchor.y,
      ...info.defaultSize,
    };
    history.commit({
      market: draftState.market,
      stalls: [...draftState.stalls, newElement],
    });
    setSelectedId(newElement.id);
  };

  const handleDeleteStall = () => {
    if (!selectedId) return;
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.filter((s) => s.id !== selectedId),
    });
    setSelectedId(null);
  };

  const handleStallDragEnd = (id: string, x: number, y: number) => {
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.map((s) => (s.id === id ? { ...s, x, y } : s)),
    });
  };

  const handleMarketResize = (nextMarket: MarketLayout) => {
    history.commit({ market: nextMarket, stalls: draftState.stalls });
  };

  const handleBackgroundImageChange = (url: string) => {
    // Omit the key entirely when cleared rather than setting it to
    // `undefined` — Firestore's setDoc() rejects a literal `undefined`
    // field value, and this keeps the in-memory state honest regardless
    // of the Firestore-level `ignoreUndefinedProperties` guard.
    const { backgroundImageUrl: _backgroundImageUrl, ...rest } =
      draftState.market;
    history.commit({
      market: url ? { ...rest, backgroundImageUrl: url } : rest,
      stalls: draftState.stalls,
    });
  };

  const handleBackgroundTintChange = (backgroundTint: number) => {
    history.commit({
      market: {
        ...draftState.market,
        backgroundTint: Math.min(Math.max(backgroundTint, 0), 100),
      },
      stalls: draftState.stalls,
    });
  };

  const handleStallResize = (
    id: string,
    next: { x: number; y: number; width: number; height: number },
  ) => {
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.map((s) =>
        s.id === id ? { ...s, ...next } : s,
      ),
    });
  };

  const handleTextLabelChange = (id: string, label: string) => {
    history.commit({
      market: draftState.market,
      stalls: draftState.stalls.map((s) => (s.id === id ? { ...s, label } : s)),
    });
  };

  const handleSave = async () => {
    const stateToSave = draftState;
    setSaveError(null);
    setIsSaving(true);
    try {
      await saveMarketState(stateToSave);
      setSavedState(stateToSave);
      setSelectedId(null);
      setDetailView(null);
      setMode("view");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedId(null);
    setDetailView(null);
    setMode("view");
  };

  return (
    <div className="flex h-full w-full flex-col">
      <Toolbar
        mode={mode}
        zoomPercent={zoomPercent}
        canEdit={isAdmin}
        onEnterEdit={handleEnterEdit}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onResetView={() => canvasRef.current?.resetView()}
      />
      <div className="relative flex-1">
        <MapCanvas
          ref={canvasRef}
          market={market}
          stalls={stalls}
          editable={mode === "edit"}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (id === null) setDetailView(null);
          }}
          onStallDragEnd={handleStallDragEnd}
          onStallClick={handleStallClick}
          onStallResize={handleStallResize}
          onTextLabelChange={handleTextLabelChange}
          onMarketResize={handleMarketResize}
          onScaleChange={setZoomPercent}
        />
        {mode === "edit" && (
          <EditToolsPanel
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            hasSelection={stalls.some((s) => s.id === selectedId)}
            backgroundImageUrl={draftState.market.backgroundImageUrl}
            backgroundTint={draftState.market.backgroundTint}
            isSaving={isSaving}
            saveError={saveError}
            onUndo={history.undo}
            onRedo={history.redo}
            onAddElement={handleAddElement}
            onDeleteStall={handleDeleteStall}
            onBackgroundImageChange={handleBackgroundImageChange}
            onBackgroundTintChange={handleBackgroundTintChange}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
        {mode === "view" && detailView && detailStall && (
          <StallDetailPopup
            stall={detailStall}
            x={detailView.x}
            y={detailView.y}
            onClose={() => setDetailView(null)}
          />
        )}
      </div>
    </div>
  );
}
