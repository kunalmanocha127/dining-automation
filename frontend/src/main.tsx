import React from "react";
import ReactDOM from "react-dom/client";
import { io } from "socket.io-client";
import { Check, Minus, Pencil, Plus, Receipt, RefreshCw, ShoppingCart, Trash2, X } from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
};

type MenuItemForm = {
  name: string;
  description: string;
  category: string;
  price: string;
  imageUrl: string;
  isAvailable: boolean;
};

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
};

type OrderItem = {
  _id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
  fulfillmentStatus: "Pending" | "Fulfilled";
  fulfilledAt?: string | null;
};

type Order = {
  _id: string;
  tableNumber: number;
  mobileNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Received" | "Preparing" | "Ready to Serve" | "Fulfilled" | "Paid" | "Cancelled";
  orderInstructions: string;
  createdAt: string;
  updatedAt: string;
};

const emptyForm: MenuItemForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  imageUrl: "",
  isAvailable: true
};

const socket = io(API_BASE_URL, {
  withCredentials: true
});

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

const toForm = (item: MenuItem): MenuItemForm => ({
  name: item.name,
  description: item.description,
  category: item.category,
  price: String(item.price),
  imageUrl: item.imageUrl,
  isAvailable: item.isAvailable
});

const useLiveMenu = () => {
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusText, setStatusText] = React.useState("Loading menu");

  const fetchMenu = React.useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`${API_BASE_URL}/api/menu`);
    const data = (await response.json()) as MenuItem[];
    setItems(data);
    setIsLoading(false);
    setStatusText(`${data.length} menu items loaded`);
  }, []);

  React.useEffect(() => {
    fetchMenu().catch(() => {
      setIsLoading(false);
      setStatusText("Backend connection failed");
    });
  }, [fetchMenu]);

  React.useEffect(() => {
    socket.on("menu:item-created", (item: MenuItem) => {
      setItems((current) => [...current, item]);
    });

    socket.on("menu:item-updated", (item: MenuItem) => {
      setItems((current) => current.map((currentItem) => (currentItem._id === item._id ? item : currentItem)));
    });

    socket.on("menu:availability-changed", (payload: { itemId: string; isAvailable: boolean }) => {
      setItems((current) =>
        current.map((item) => (item._id === payload.itemId ? { ...item, isAvailable: payload.isAvailable } : item))
      );
    });

    socket.on("menu:item-deleted", (payload: { itemId: string }) => {
      setItems((current) => current.filter((item) => item._id !== payload.itemId));
    });

    return () => {
      socket.off("menu:item-created");
      socket.off("menu:item-updated");
      socket.off("menu:availability-changed");
      socket.off("menu:item-deleted");
    };
  }, []);

  const sortedItems = React.useMemo(
    () => [...items].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [items]
  );

  const groupedItems = React.useMemo(() => {
    return sortedItems.reduce<Record<string, MenuItem[]>>((groups, item) => {
      groups[item.category] = [...(groups[item.category] ?? []), item];
      return groups;
    }, {});
  }, [sortedItems]);


  return { fetchMenu, groupedItems, isLoading, items, setStatusText, statusText };
};

const upsertOrder = (orders: Order[], nextOrder: Order): Order[] => {
  const exists = orders.some((order) => order._id === nextOrder._id);
  const next = exists ? orders.map((order) => (order._id === nextOrder._id ? nextOrder : order)) : [nextOrder, ...orders];
  return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const useLiveOrders = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [ordersStatus, setOrdersStatus] = React.useState("Loading orders");

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`${API_BASE_URL}/api/orders/active`);
    const data = (await response.json()) as Order[];
    setOrders(data);
    setIsLoading(false);
    setOrdersStatus(`${data.length} active orders`);
  }, []);

  React.useEffect(() => {
    fetchOrders().catch(() => {
      setIsLoading(false);
      setOrdersStatus("Backend connection failed");
    });
  }, [fetchOrders]);

  React.useEffect(() => {
    socket.on("order:created", (order: Order) => {
      setOrders((current) => upsertOrder(current, order));
    });

    socket.on("order:item-fulfilled", (payload: { order: Order }) => {
      setOrders((current) => upsertOrder(current, payload.order));
    });

    socket.on("order:fulfilled", (order: Order) => {
      setOrders((current) => upsertOrder(current, order));
    });

    socket.on("order:status-updated", (payload: { orderId: string; status: Order["status"] }) => {
      setOrders((current) =>
        current.map((order) => (order._id === payload.orderId ? { ...order, status: payload.status } : order))
      );
    });

    return () => {
      socket.off("order:created");
      socket.off("order:item-fulfilled");
      socket.off("order:fulfilled");
      socket.off("order:status-updated");
    };
  }, []);

  return { fetchOrders, isLoading, orders, ordersStatus };
};

function LiveOrdersPanel() {
  const { fetchOrders, isLoading, orders, ordersStatus } = useLiveOrders();

  const fulfillItem = async (orderId: string, itemId: string) => {
    await fetch(`${API_BASE_URL}/api/orders/${orderId}/items/${itemId}/fulfill`, { method: "PATCH" });
  };

  const fulfillOrder = async (orderId: string) => {
    await fetch(`${API_BASE_URL}/api/orders/${orderId}/fulfill`, { method: "PATCH" });
  };

  return (
    <section className="live-orders-panel">
      <div className="live-orders-header">
        <div>
          <h2>Live Orders</h2>
          <p>{ordersStatus}</p>
        </div>
        <button className="icon-button labeled" onClick={fetchOrders} title="Refresh orders" type="button">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {isLoading ? <p className="empty-state">Loading live orders...</p> : null}
      {!isLoading && orders.length === 0 ? <p className="empty-state">No active orders in queue.</p> : null}

      <div className="orders-grid">
        {orders.map((order) => {
          const isOrderFulfilled = order.status === "Fulfilled";
          const fulfilledCount = order.items.filter((item) => item.fulfillmentStatus === "Fulfilled").length;

          return (
            <article className={`order-card ${isOrderFulfilled ? "is-fulfilled" : ""}`} key={order._id}>
              <div className="order-card-top">
                <div>
                  <p className="eyebrow">Table {order.tableNumber}</p>
                  <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                </div>
                <span className={`order-status ${isOrderFulfilled ? "fulfilled" : ""}`}>{order.status}</span>
              </div>

              <div className="order-meta">
                <span>Mobile: {order.mobileNumber}</span>
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span>{fulfilledCount}/{order.items.length} fulfilled</span>
              </div>

              {order.orderInstructions ? <p className="order-note">Order note: {order.orderInstructions}</p> : null}

              <div className="order-items">
                {order.items.map((item) => {
                  const isItemFulfilled = item.fulfillmentStatus === "Fulfilled";

                  return (
                    <article className={`order-item-box ${isItemFulfilled ? "is-fulfilled" : ""}`} key={item._id}>
                      {isItemFulfilled ? <div className="fulfilled-stamp">FULFILLED</div> : null}
                      <div>
                        <h4>{item.name}</h4>
                        <p>
                          Qty {item.quantity} · {formatCurrency(item.price * item.quantity)}
                        </p>
                        {item.specialInstructions ? <span>{item.specialInstructions}</span> : null}
                      </div>
                      <button
                        disabled={isItemFulfilled}
                        onClick={() => fulfillItem(order._id, item._id)}
                        type="button"
                      >
                        {isItemFulfilled ? "Done" : "Mark Fulfilled"}
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="order-actions">
                <strong>{formatCurrency(order.totalAmount)}</strong>
                {isOrderFulfilled ? (
                  <button className="bill-action" type="button">
                    <Receipt size={18} />
                    Generate Bill
                  </button>
                ) : (
                  <button className="secondary-action" onClick={() => fulfillOrder(order._id)} type="button">
                    Mark Order Fulfilled
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminMenuDashboard() {
  const { fetchMenu, groupedItems, isLoading, items, setStatusText, statusText } = useLiveMenu();
  const [form, setForm] = React.useState<MenuItemForm>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"menu" | "orders">("menu");
  const availableCount = items.filter((item) => item.isAvailable).length;

  const updateForm = (field: keyof MenuItemForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    const response = await fetch(`${API_BASE_URL}/api/menu${editingId ? `/${editingId}` : ""}`, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) })
    });

    if (!response.ok) {
      setStatusText("Could not save menu item");
      setIsSaving(false);
      return;
    }

    resetForm();
    setIsSaving(false);
    setStatusText(editingId ? "Menu item updated" : "Menu item added");
  };

  const toggleAvailability = async (item: MenuItem) => {
    await fetch(`${API_BASE_URL}/api/menu/${item._id}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable })
    });
  };

  const deleteItem = async (item: MenuItem) => {
    await fetch(`${API_BASE_URL}/api/menu/${item._id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setStatusText(`${item.name} removed`);
  };

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin Menu Control</p>
          <h1>Dining Automation</h1>
        </div>
        <button className="icon-button labeled" onClick={fetchMenu} title="Refresh menu" type="button">
          <RefreshCw size={18} />
          Refresh
        </button>
      </section>

      <div className="admin-tabs" role="tablist">
        <button className={activeTab === "menu" ? "active" : ""} onClick={() => setActiveTab("menu")} type="button">
          Menu Configuration
        </button>
        <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")} type="button">
          Live Orders
        </button>
      </div>

      {activeTab === "menu" ? (
        <>
          <section className="metrics-row" aria-label="Menu summary">
            <div>
              <span>Total Items</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>Available</span>
              <strong>{availableCount}</strong>
            </div>
            <div>
              <span>Unavailable</span>
              <strong>{items.length - availableCount}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{statusText}</strong>
            </div>
          </section>

          <section className="workspace">
            <form className="editor-panel" onSubmit={saveItem}>
              <div className="panel-heading">
                <h2>{editingId ? "Edit Item" : "Add Item"}</h2>
                {editingId ? (
                  <button className="icon-button" onClick={resetForm} title="Cancel edit" type="button">
                    <X size={18} />
                  </button>
                ) : null}
              </div>

              <label>
                Name
                <input required value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
              </label>
              <label>
                Category
                <input required value={form.category} onChange={(event) => updateForm("category", event.target.value)} />
              </label>
              <label>
                Price
                <input
                  min="0"
                  required
                  type="number"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                />
              </label>
              <label>
                Image URL
                <input value={form.imageUrl} onChange={(event) => updateForm("imageUrl", event.target.value)} />
              </label>
              <label>
                Description
                <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
              </label>
              <label className="checkbox-row">
                <input
                  checked={form.isAvailable}
                  type="checkbox"
                  onChange={(event) => updateForm("isAvailable", event.target.checked)}
                />
                Available now
              </label>

              <button className="primary-action" disabled={isSaving} type="submit">
                {editingId ? <Check size={18} /> : <Plus size={18} />}
                {editingId ? "Save Changes" : "Add Menu Item"}
              </button>
            </form>

            <section className="menu-panel">
              {isLoading ? <p className="empty-state">Loading menu items...</p> : null}
              {!isLoading && items.length === 0 ? <p className="empty-state">No menu items yet.</p> : null}

              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <section className="category-section" key={category}>
                  <div className="category-heading">
                    <h2>{category}</h2>
                    <span>{categoryItems.length} items</span>
                  </div>

                  <div className="item-grid">
                    {categoryItems.map((item) => (
                      <article className={`menu-card ${item.isAvailable ? "" : "is-disabled"}`} key={item._id}>
                        <div className="menu-card-main">
                          <div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                          </div>
                          <strong>{formatCurrency(item.price)}</strong>
                        </div>

                        <div className="card-actions">
                          <button
                            className={`switch ${item.isAvailable ? "on" : ""}`}
                            onClick={() => toggleAvailability(item)}
                            title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                            type="button"
                          >
                            <span />
                          </button>
                          <button
                            className="icon-button"
                            onClick={() => {
                              setEditingId(item._id);
                              setForm(toForm(item));
                            }}
                            title="Edit item"
                            type="button"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="icon-button danger"
                            onClick={() => setDeleteTarget(item)}
                            title="Delete item"
                            type="button"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          </section>
        </>
      ) : (
        <LiveOrdersPanel />
      )}

      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <section aria-modal="true" className="confirm-dialog" role="dialog">
            <h2>PERMANENT DELETE WARNING</h2>
            <p>
              This will permanently delete <strong>{deleteTarget.name}</strong> from the menu.
            </p>
            <div className="confirm-actions">
              <button className="secondary-action" onClick={() => setDeleteTarget(null)} type="button">
                Cancel
              </button>
              <button className="danger-action" onClick={() => deleteItem(deleteTarget)} type="button">
                Delete Permanently
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function CustomerOrderingPage() {
  const { groupedItems, isLoading, items } = useLiveMenu();
  const params = new URLSearchParams(window.location.search);
  const tableNumber = Number(params.get("table") ?? 0);
  const [cart, setCart] = React.useState<Record<string, CartItem>>({});
  const [mobileNumber, setMobileNumber] = React.useState("");
  const [orderInstructions, setOrderInstructions] = React.useState("");
  const [orderStatus, setOrderStatus] = React.useState("Ready to order");
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  React.useEffect(() => {
    setCart((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (!item.isAvailable && next[item._id]) {
          delete next[item._id];
        }
      });
      return next;
    });
  }, [items]);

  const addToCart = (item: MenuItem) => {
    setCart((current) => ({
      ...current,
      [item._id]: {
        menuItem: item,
        quantity: (current[item._id]?.quantity ?? 0) + 1,
        specialInstructions: current[item._id]?.specialInstructions ?? ""
      }
    }));
  };

  const changeQuantity = (itemId: string, change: number) => {
    setCart((current) => {
      const target = current[itemId];
      if (!target) return current;

      const nextQuantity = target.quantity + change;
      const next = { ...current };

      if (nextQuantity < 1) {
        delete next[itemId];
        return next;
      }

      next[itemId] = { ...target, quantity: nextQuantity };
      return next;
    });
  };

  const updateItemInstructions = (itemId: string, specialInstructions: string) => {
    setCart((current) => {
      const target = current[itemId];
      if (!target) return current;
      return { ...current, [itemId]: { ...target, specialInstructions } };
    });
  };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!tableNumber) {
      setOrderStatus("Table number missing from QR link");
      return;
    }

    if (cartItems.length === 0) {
      setOrderStatus("Add at least one item");
      return;
    }

    setIsPlacingOrder(true);
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber,
        mobileNumber,
        orderInstructions,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItem._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        }))
      })
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setOrderStatus(data.message ?? "Could not place order");
      setIsPlacingOrder(false);
      return;
    }

    setCart({});
    setOrderInstructions("");
    setOrderStatus("Order sent to kitchen");
    setIsPlacingOrder(false);
  };

  return (
    <main className="customer-shell">
      <header className="customer-header">
        <div>
          <p className="eyebrow">Table {tableNumber || "Not Found"}</p>
          <h1>Order Menu</h1>
        </div>
        <div className="cart-badge" aria-label="Cart item count">
          <ShoppingCart size={18} />
          {cartQuantity}
        </div>
      </header>

      <section className="customer-layout">
        <section className="customer-menu">
          {isLoading ? <p className="empty-state">Loading menu...</p> : null}

          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <section className="customer-category" key={category}>
              <h2>{category}</h2>
              <div className="customer-item-list">
                {categoryItems.map((item) => (
                  <article className={`customer-item ${item.isAvailable ? "" : "is-disabled"}`} key={item._id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <strong>{formatCurrency(item.price)}</strong>
                    </div>
                    <button disabled={!item.isAvailable} onClick={() => addToCart(item)} type="button">
                      {item.isAvailable ? "Add" : "Unavailable"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        <form className="cart-panel" onSubmit={placeOrder}>
          <div className="panel-heading">
            <h2>Your Order</h2>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>

          {cartItems.length === 0 ? <p className="empty-state">Your cart is empty.</p> : null}

          {cartItems.map((item) => (
            <article className="cart-line" key={item.menuItem._id}>
              <div className="cart-line-main">
                <div>
                  <h3>{item.menuItem.name}</h3>
                  <span>{formatCurrency(item.menuItem.price)}</span>
                </div>
                <div className="quantity-control">
                  <button onClick={() => changeQuantity(item.menuItem._id, -1)} title="Decrease quantity" type="button">
                    <Minus size={16} />
                  </button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => changeQuantity(item.menuItem._id, 1)} title="Increase quantity" type="button">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <label>
                Special instructions
                <input
                  placeholder="Optional"
                  value={item.specialInstructions}
                  onChange={(event) => updateItemInstructions(item.menuItem._id, event.target.value)}
                />
              </label>
            </article>
          ))}

          <label>
            Mobile number
            <input
              inputMode="numeric"
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="10 digit mobile number"
              required
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value.replace(/\D/g, ""))}
            />
          </label>

          <label>
            Order instructions
            <textarea
              placeholder="Optional"
              value={orderInstructions}
              onChange={(event) => setOrderInstructions(event.target.value)}
            />
          </label>

          <button className="primary-action" disabled={isPlacingOrder || cartItems.length === 0} type="submit">
            <Check size={18} />
            Place Order
          </button>
          <p className="customer-status">{orderStatus}</p>
        </form>
      </section>
    </main>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  if (view === "customer") {
    return <CustomerOrderingPage />;
  }

  return <AdminMenuDashboard />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
