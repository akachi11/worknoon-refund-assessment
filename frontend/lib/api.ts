import type {
  AdminRefundDetail,
  AdminRefundListResponse,
  Customer,
  Order,
  RefundSubmitResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }

  return body as T;
}

export function getCustomers() {
  return request<Customer[]>("/api/customers");
}

export function getCustomerOrders(customerId: string) {
  return request<Order[]>(`/api/customers/${customerId}/orders`);
}

export function submitRefundRequest(input: {
  customerId: string;
  orderId: string;
  orderItemId: string;
  message: string;
}) {
  return request<RefundSubmitResponse>("/api/refund-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminRequests(params?: { finalDecision?: string; customerId?: string }) {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => Boolean(v)) as [string, string][]
  ).toString();

  return request<AdminRefundListResponse>(`/api/admin/refund-requests${qs ? `?${qs}` : ""}`);
}

export function getAdminRequestDetail(id: string) {
  return request<AdminRefundDetail>(`/api/admin/refund-requests/${id}`);
}
