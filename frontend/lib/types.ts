export type ListingCondition = "new" | "open_box" | "refurbished" | "clearance";
export type VerifiedIssue = "none" | "damaged_in_transit" | "wrong_item_shipped" | "missing_item";
export type OrderStatus = "delivered" | "in_transit" | "returned";
export type FinalDecision = "APPROVED" | "DENIED" | "ESCALATED";

export interface Customer {
  id: string;
  name: string;
  email: string;
}

export interface OrderItem {
  id: string;
  sku: string;
  name: string;
  price: string;
  listingCondition: ListingCondition;
  verifiedIssue?: VerifiedIssue;
}

export interface Order {
  id: string;
  orderDate: string;
  total: string;
  status: OrderStatus;
  items: OrderItem[];
}

export interface RefundSubmitResponse {
  id: string;
  finalDecision: FinalDecision;
  reasoning: string;
  createdAt: string;
}

export interface AdminRefundListItem {
  id: string;
  customerName: string;
  customerEmail: string;
  orderId: string;
  itemName: string;
  finalDecision: FinalDecision;
  reasoning: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface AdminRefundDetail {
  id: string;
  message: string;
  policyOutput: Record<string, unknown>;
  aiOutput: Record<string, unknown> | null;
  finalDecision: FinalDecision;
  reasoning: string;
  createdAt: string;
  customer: Customer;
  order: Order;
  orderItem: OrderItem;
  auditLogs: AuditLogEntry[];
}

export interface AdminRefundListResponse {
  items: AdminRefundListItem[];
  total: number;
  page: number;
  pageSize: number;
}
