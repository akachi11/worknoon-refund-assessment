"use client";

import { useState } from "react";
import { getCustomerOrders, getCustomers } from "@/lib/api";
import type { Customer, Order } from "@/lib/types";

interface Row {
  customer: Customer;
  order: Order;
}

export function OrderBrowser() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);

  async function handleToggle() {
    const next = !open;
    setOpen(next);

    if (next && rows === null) {
      setLoading(true);
      setError(null);
      try {
        const customers = await getCustomers();
        const perCustomer = await Promise.all(
          customers.map(async (customer) => {
            const orders = await getCustomerOrders(customer.id);
            return orders.map((order) => ({ customer, order }));
          })
        );
        setRows(perCustomer.flat());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order data.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="rounded-xl border border-black/10">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium"
      >
        <span>Browse order data</span>
        <span className="text-black/40">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t border-black/10 px-5 py-4">
          {loading && <p className="text-sm text-black/50">Loading order data…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {rows && rows.length > 0 && (
            <div className="space-y-4">
              {rows.map(({ customer, order }) => (
                <div key={order.id} className="text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-black/40">
                      {new Date(order.orderDate).toLocaleDateString()} · ${order.total} ·{" "}
                      {order.status}
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5 pl-4 text-black/60">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-baseline justify-between">
                        <span>
                          {item.name}
                          {item.listingCondition !== "new" && (
                            <span className="ml-1.5 text-xs text-black/40">
                              ({item.listingCondition.replace("_", " ")})
                            </span>
                          )}
                        </span>
                        <span className="text-xs">${item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
