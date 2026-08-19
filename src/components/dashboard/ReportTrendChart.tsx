import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrendPoint } from "../../data/reportStats";

interface ReportTrendChartProps {
  points: TrendPoint[];
  metric: "revenue" | "count";
  onMetricChange: (metric: "revenue" | "count") => void;
}

const CHART_HEIGHT = 160;
// Space reserved below the bars for the bucket label + gap, so bar height
// is computed against the remaining "bar area" of the chart.
const LABEL_AREA_HEIGHT = 24;
const BAR_AREA_HEIGHT = CHART_HEIGHT - LABEL_AREA_HEIGHT;
// Bars never exceed this width, even when there are few buckets and each
// flex slot is wide — the leftover space in the slot stays air.
const MAX_BAR_WIDTH = 24;
// Above this many buckets (e.g. a 31-day month view), thin the bucket
// labels so they don't collide; the value is still reachable via
// hover/focus on every bar regardless of whether its label is shown.
const MAX_VISIBLE_LABELS = 12;

function formatMetricValue(value: number, metric: "revenue" | "count") {
  return metric === "revenue" ? value.toLocaleString() : String(value);
}

export function ReportTrendChart({
  points,
  metric,
  onMetricChange,
}: ReportTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const values = points.map((p) => p[metric]);
  const max = Math.max(1, ...values);
  const labelStep = Math.max(1, Math.ceil(points.length / MAX_VISIBLE_LABELS));

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Trend
        </h2>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={metric === "revenue" ? "default" : "outline"}
            onClick={() => onMetricChange("revenue")}>
            Revenue
          </Button>
          <Button
            type="button"
            size="sm"
            variant={metric === "count" ? "default" : "outline"}
            onClick={() => onMetricChange("count")}>
            Bookings
          </Button>
        </div>
      </div>
      <div
        className="flex items-end gap-1 overflow-x-auto"
        style={{ height: CHART_HEIGHT }}>
        {points.map((point, index) => {
          const value = point[metric];
          const barHeight = (value / max) * BAR_AREA_HEIGHT;
          const isHovered = hoveredIndex === index;
          const showLabel = index % labelStep === 0;

          return (
            <div
              key={point.bucketLabel}
              className="flex min-w-[24px] flex-1 flex-col items-center">
              {/* Bar slot: fixed-height hover/focus target, bigger than the
                  bar it contains so short or empty buckets stay hoverable. */}
              <div
                className="flex w-full items-end justify-center outline-none"
                style={{ height: BAR_AREA_HEIGHT }}
                role="img"
                aria-label={`${point.bucketLabel}: ${formatMetricValue(value, metric)} ${
                  metric === "revenue" ? "revenue" : "bookings"
                }`}
                tabIndex={0}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() =>
                  setHoveredIndex((current) =>
                    current === index ? null : current,
                  )
                }
                onFocus={() => setHoveredIndex(index)}
                onBlur={() =>
                  setHoveredIndex((current) =>
                    current === index ? null : current,
                  )
                }>
                <div
                  className="relative w-full"
                  style={{ maxWidth: MAX_BAR_WIDTH }}>
                  {isHovered && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs shadow-md dark:bg-slate-100">
                      <div className="font-semibold tabular-nums text-white dark:text-slate-900">
                        {formatMetricValue(value, metric)}{" "}
                        {metric === "revenue" ? "revenue" : "bookings"}
                      </div>
                      <div className="text-slate-300 dark:text-slate-500">
                        {point.bucketLabel}
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      "mx-auto w-full rounded-t bg-[#2a78d6] transition-[filter] duration-150 dark:bg-[#3987e5]",
                      isHovered && "brightness-110",
                    )}
                    style={{ height: barHeight }}
                  />
                </div>
              </div>
              <span className="mt-1 h-[14px] whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400">
                {showLabel ? point.bucketLabel : " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
