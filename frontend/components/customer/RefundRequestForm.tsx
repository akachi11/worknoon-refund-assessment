"use client";

import { useEffect, useState } from "react";
import { getCustomerOrders, getCustomers, submitRefundRequest } from "@/lib/api";
import type { Customer, Order, RefundSubmitResponse } from "@/lib/types";
import { ResponseCard } from "./ResponseCard";

interface ItemOption {
  orderId: string;
  itemId: string;
  label: string;
}

export function RefundRequestForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemKey, setItemKey] = useState("");
  const [message, setMessage] = useState("");

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; response: RefundSubmitResponse } | null>(
    null
  );

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load customers."));
  }, []);

  useEffect(() => {
    setOrders([]);
    setItemKey("");
    setResult(null);

    if (!customerId) return;

    setOrdersLoading(true);
    setError(null);
    getCustomerOrders(customerId)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders."))
      .finally(() => setOrdersLoading(false));
  }, [customerId]);

  const itemOptions: ItemOption[] = orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.id,
      itemId: item.id,
      label: `${item.name} — $${item.price} (ordered ${new Date(order.orderDate).toLocaleDateString()})`,
    }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selected = itemOptions.find((o) => `${o.orderId}:${o.itemId}` === itemKey);
    if (!customerId || !selected || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await submitRefundRequest({
        customerId,
        orderId: selected.orderId,
        orderItemId: selected.itemId,
        message: message.trim(),
      });
      setResult({ message: message.trim(), response });
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit refund request.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(customerId && itemKey && message.trim()) && !submitting;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-black/10 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-black/70">Customer</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-black/70">Item</span>
            <select
              value={itemKey}
              onChange={(e) => setItemKey(e.target.value)}
              disabled={!customerId || ordersLoading}
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 disabled:bg-black/5 disabled:text-black/30"
            >
              <option value="">
                {ordersLoading ? "Loading items…" : "Select an item…"}
              </option>
              {itemOptions.map((o) => (
                <option key={`${o.orderId}:${o.itemId}`} value={`${o.orderId}:${o.itemId}`}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-black/70">Your message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Describe what happened with this item…"
            className="w-full resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-30"
        >
          {submitting ? "Submitting…" : "Submit refund request"}
        </button>
      </form>

      {result && <ResponseCard message={result.message} result={result.response} />}
    </div>
  );
}
