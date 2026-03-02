export type OrderItem = {
  productId: number;
  productName: string;
  productWeight: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: "Pending" | "Confirmed" | "Delivered";
  timestamp: number;
};

const STORAGE_KEY = "sunrise_orders";

export function getAllOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

export function saveOrder(
  order: Omit<Order, "id" | "timestamp" | "status">,
): Order {
  const existing = getAllOrders();
  const newOrder: Order = {
    ...order,
    id: existing.length > 0 ? Math.max(...existing.map((o) => o.id)) + 1 : 1001,
    timestamp: Date.now(),
    status: "Pending",
  };
  const updated = [...existing, newOrder];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newOrder;
}

export function updateOrderStatus(
  orderId: number,
  status: Order["status"],
): void {
  const existing = getAllOrders();
  const updated = existing.map((o) =>
    o.id === orderId ? { ...o, status } : o,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
