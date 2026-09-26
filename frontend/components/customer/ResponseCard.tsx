import { DecisionBadge } from "@/components/DecisionBadge";
import type { RefundSubmitResponse } from "@/lib/types";

export function ResponseCard({
  message,
  result,
}: {
  message: string;
  result: RefundSubmitResponse;
}) {
  return (
    <div className="space-y-3">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-4 py-2.5 text-sm text-white">
        {message}
      </div>

      <div className="mr-auto max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm border border-black/10 bg-white px-4 py-3">
        <DecisionBadge decision={result.finalDecision} />
        <p className="text-sm text-black/70">{result.reasoning}</p>
      </div>
    </div>
  );
}
