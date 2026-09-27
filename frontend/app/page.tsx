import { OrderBrowser } from "@/components/customer/OrderBrowser";
import { RefundRequestForm } from "@/components/customer/RefundRequestForm";

export default function CustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Request a refund</h1>
        <p className="mt-1 text-sm text-black/50">
          Pick a customer and item to simulate a support request.
        </p>
      </div>

      <OrderBrowser />
      <RefundRequestForm />
    </div>
  );
}
