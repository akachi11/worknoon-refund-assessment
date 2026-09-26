"use client";

import { useState } from "react";
import { RequestsTable } from "@/components/admin/RequestsTable";
import { RequestDetail } from "@/components/admin/RequestDetail";

export default function AdminPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Refund requests</h1>
        <p className="mt-1 text-sm text-black/50">
          Decisions, reasoning, and the audit trail behind each one.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <RequestsTable selectedId={selectedId} onSelect={setSelectedId} />

        <div className="rounded-xl border border-black/10 p-5">
          {selectedId ? (
            <RequestDetail id={selectedId} />
          ) : (
            <p className="text-sm text-black/40">Select a request to see its full detail.</p>
          )}
        </div>
      </div>
    </div>
  );
}
