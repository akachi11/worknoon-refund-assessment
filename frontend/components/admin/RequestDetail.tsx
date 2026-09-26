"use client";

import { useEffect, useState } from "react";
import { getAdminRequestDetail } from "@/lib/api";
import type { AdminRefundDetail } from "@/lib/types";
import { DecisionBadge } from "@/components/DecisionBadge";

const actorLabels: Record<string, string> = {
  policy_engine: "Policy engine",
  ai_gemini: "Gemini",
  ai_openai: "OpenAI",
  system: "System",
};

export function RequestDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<AdminRefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setDetail(null);
    getAdminRequestDetail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load detail."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-sm text-black/50">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!detail) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{detail.customer.name}</p>
          <p className="text-xs text-black/40">{detail.customer.email}</p>
        </div>
        <DecisionBadge decision={detail.finalDecision} />
      </div>

      <div className="rounded-lg bg-black/[0.03] p-3 text-sm">
        <p className="text-xs font-medium text-black/40">Customer message</p>
        <p className="mt-1">{detail.message}</p>
      </div>

      <div className="text-sm">
        <p className="text-xs font-medium text-black/40">Item</p>
        <p className="mt-1">
          {detail.orderItem.name} — ${detail.orderItem.price} · {detail.orderItem.listingCondition}
          {detail.orderItem.verifiedIssue && detail.orderItem.verifiedIssue !== "none" && (
            <> · verified issue: {detail.orderItem.verifiedIssue}</>
          )}
        </p>
      </div>

      <div className="text-sm">
        <p className="text-xs font-medium text-black/40">Reasoning</p>
        <p className="mt-1 text-black/70">{detail.reasoning}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-black/40">Audit trail</p>
        <ol className="space-y-2">
          {detail.auditLogs.map((log) => (
            <li key={log.id} className="rounded-lg border border-black/10 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {actorLabels[log.actor] ?? log.actor} — {log.action.replace(/_/g, " ")}
                </span>
                <span className="text-black/40">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-black/[0.03] p-2 text-black/60">
                {JSON.stringify(log.detail, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
