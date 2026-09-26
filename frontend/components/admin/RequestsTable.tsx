"use client";

import { useEffect, useState } from "react";
import { getAdminRequests } from "@/lib/api";
import type { AdminRefundListItem, FinalDecision } from "@/lib/types";
import { DecisionBadge } from "@/components/DecisionBadge";

const filters: { label: string; value: FinalDecision | "" }[] = [
  { label: "All", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Denied", value: "DENIED" },
  { label: "Escalated", value: "ESCALATED" },
];

export function RequestsTable({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [filter, setFilter] = useState<FinalDecision | "">("");
  const [items, setItems] = useState<AdminRefundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminRequests({ finalDecision: filter || undefined })
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load requests."))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="rounded-xl border border-black/10">
      <div className="flex items-center gap-1 border-b border-black/10 px-4 py-3">
        {filters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-black text-white"
                : "text-black/50 hover:bg-black/5 hover:text-black"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="px-4 py-6 text-sm text-black/50">Loading requests…</p>}
      {error && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="px-4 py-6 text-sm text-black/50">No refund requests yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-black/40">
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Decision</th>
              <th className="px-4 py-2 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer border-t border-black/5 transition-colors ${
                  selectedId === item.id ? "bg-black/[0.04]" : "hover:bg-black/[0.02]"
                }`}
              >
                <td className="px-4 py-2.5">
                  <div className="font-medium">{item.customerName}</div>
                  <div className="text-xs text-black/40">{item.customerEmail}</div>
                </td>
                <td className="px-4 py-2.5 text-black/70">{item.itemName}</td>
                <td className="px-4 py-2.5">
                  <DecisionBadge decision={item.finalDecision} />
                </td>
                <td className="px-4 py-2.5 text-xs text-black/40">
                  {new Date(item.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
