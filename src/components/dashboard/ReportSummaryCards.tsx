import type { ReportSummary } from "../../data/reportStats";

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const cards = [
    { label: "Total bookings", value: String(summary.totalBookings) },
    { label: "Total revenue", value: formatCurrency(summary.totalRevenue) },
    { label: "Occupancy rate", value: formatPercent(summary.occupancyRate) },
    {
      label: "Cancellation rate",
      value: formatPercent(summary.cancellationRate),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">{card.label}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
