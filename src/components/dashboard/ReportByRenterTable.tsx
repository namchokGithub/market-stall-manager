import { useState } from "react";
import type { RenterReportRow } from "../../data/reportStats";

type SortKey = "bookingCount" | "revenue";

interface ReportByRenterTableProps {
  rows: RenterReportRow[];
}

export function ReportByRenterTable({ rows }: ReportByRenterTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">By renter</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-1.5">Renter</th>
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
            <tr key={row.renterName} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-800">{row.renterName}</td>
              <td className="py-1.5 text-slate-600">{row.bookingCount}</td>
              <td className="py-1.5 text-slate-600">
                {row.revenue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
