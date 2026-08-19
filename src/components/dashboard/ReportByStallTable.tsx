import { useState } from "react";
import type { StallReportRow } from "../../data/reportStats";

type SortKey = "bookingCount" | "revenue";

interface ReportByStallTableProps {
  rows: StallReportRow[];
}

export function ReportByStallTable({ rows }: ReportByStallTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="p-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">By stall</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-1.5">Stall</th>
            <th
              className="cursor-pointer py-1.5"
              onClick={() => setSortKey("bookingCount")}>
              Bookings
            </th>
            <th
              className="cursor-pointer py-1.5"
              onClick={() => setSortKey("revenue")}>
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.stallId} className="border-b border-border">
              <td className="py-1.5 text-foreground">{row.code}</td>
              <td className="py-1.5 text-muted-foreground">{row.bookingCount}</td>
              <td className="py-1.5 text-muted-foreground">
                {row.revenue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
