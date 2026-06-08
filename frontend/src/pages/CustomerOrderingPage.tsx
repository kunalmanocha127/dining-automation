import React from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useLiveMenu } from "../hooks/useLiveMenu";
import { createOrder } from "../services/api";
import { CartItem, MenuItem } from "../types";
import { formatCurrency } from "../utils/format";

export function CustomerOrderingPage() {
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
    const response = await createOrder({
      tableNumber,
      mobileNumber,
      orderInstructions,
      items: cartItems.map((item) => ({
        menuItemId: item.menuItem._id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      }))
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setOrderStatus(data.message ?? "Could not place order");
      setIsPlacingOrder(false);
      return;
    }

    setCart({});
    setOrderInstructions("");
    setOrderStatus("Order added to your table session");
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
