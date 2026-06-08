import { API_BASE_URL } from "../config";
import { CreateOrderPayload, DiningSession, MenuItem, MenuItemForm, Order } from "../types";

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/menu`);
  return (await response.json()) as MenuItem[];
};

export const saveMenuItem = async (form: MenuItemForm, editingId: string | null): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/menu${editingId ? `/${editingId}` : ""}`, {
    method: editingId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...form, price: Number(form.price) })
  });
};

export const toggleMenuItemAvailability = async (item: MenuItem): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/menu/${item._id}/availability`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isAvailable: !item.isAvailable })
  });
};

export const deleteMenuItem = async (itemId: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/menu/${itemId}`, { method: "DELETE" });
};

export const fetchActiveOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/active`);
  return (await response.json()) as Order[];
};

export const fetchActiveSessions = async (): Promise<DiningSession[]> => {
  const response = await fetch(`${API_BASE_URL}/api/sessions/active`);
  return (await response.json()) as DiningSession[];
};

export const createOrder = async (payload: CreateOrderPayload): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
};

export const fulfillOrderItem = async (orderId: string, itemId: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/orders/${orderId}/items/${itemId}/fulfill`, { method: "PATCH" });
};

export const fulfillOrder = async (orderId: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/orders/${orderId}/fulfill`, { method: "PATCH" });
};
