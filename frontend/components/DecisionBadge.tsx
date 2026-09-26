import type { FinalDecision } from "@/lib/types";

const styles: Record<FinalDecision, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  DENIED: "bg-red-50 text-red-700 ring-red-600/20",
  ESCALATED: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function DecisionBadge({ decision }: { decision: FinalDecision }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[decision]}`}
    >
      {decision}
    </span>
  );
}
