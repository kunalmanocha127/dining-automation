export type MenuItem = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
};

export type MenuItemForm = {
  name: string;
  description: string;
  category: string;
  price: string;
  imageUrl: string;
  isAvailable: boolean;
};

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
};

export type OrderItem = {
  _id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
  fulfillmentStatus: "Pending" | "Fulfilled";
  fulfilledAt?: string | null;
};

export type Order = {
  _id: string;
  sessionId?: string;
  tableNumber: number;
  mobileNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Received" | "Preparing" | "Ready to Serve" | "Fulfilled" | "Paid" | "Cancelled";
  orderInstructions: string;
  createdAt: string;
  updatedAt: string;
};

export type DiningSession = {
  _id: string;
  tableNumber: number;
  mobileNumber: string;
  status: "Active" | "ReadyForBill" | "Paid" | "Closed" | "Cancelled";
  orderIds: Order[];
  totalAmount: number;
  startedAt: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderPayload = {
  tableNumber: number;
  mobileNumber: string;
  orderInstructions: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions: string;
  }>;
};
