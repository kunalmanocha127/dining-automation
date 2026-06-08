import { Receipt, RefreshCw } from "lucide-react";
import { useLiveSessions } from "../hooks/useLiveSessions";
import { fulfillOrder, fulfillOrderItem } from "../services/api";
import { DiningSession } from "../types";
import { formatCurrency } from "../utils/format";

const getSessionFulfillment = (session: DiningSession) => {
  const allItems = session.orderIds.flatMap((order) => order.items);
  const fulfilledItems = allItems.filter((item) => item.fulfillmentStatus === "Fulfilled");
  const isReadyForBill = session.status === "ReadyForBill" || (allItems.length > 0 && fulfilledItems.length === allItems.length);

  return {
    fulfilledCount: fulfilledItems.length,
    itemCount: allItems.length,
    isReadyForBill
  };
};

export function LiveOrdersPanel() {
  const { fetchSessions, isLoading, sessions, sessionsStatus } = useLiveSessions();

  return (
    <section className="live-orders-panel">
      <div className="live-orders-header">
        <div>
          <h2>Live Orders</h2>
          <p>{sessionsStatus}</p>
        </div>
        <button className="icon-button labeled" onClick={fetchSessions} title="Refresh sessions" type="button">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {isLoading ? <p className="empty-state">Loading live sessions...</p> : null}
      {!isLoading && sessions.length === 0 ? <p className="empty-state">No active table sessions in queue.</p> : null}

      <div className="orders-grid">
        {sessions.map((session) => {
          const { fulfilledCount, itemCount, isReadyForBill } = getSessionFulfillment(session);

          return (
            <article className={`order-card session-card ${isReadyForBill ? "is-fulfilled" : ""}`} key={session._id}>
              <div className="order-card-top">
                <div>
                  <p className="eyebrow">Table {session.tableNumber}</p>
                  <h3>Session #{session._id.slice(-6).toUpperCase()}</h3>
                  <span className="session-chip">{session.orderIds.length} orders in this session</span>
                </div>
                <span className={`order-status ${isReadyForBill ? "fulfilled" : ""}`}>
                  {isReadyForBill ? "Ready For Bill" : session.status}
                </span>
              </div>

              <div className="order-meta">
                <span>Mobile: {session.mobileNumber}</span>
                <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span>{fulfilledCount}/{itemCount} items fulfilled</span>
              </div>

              <div className="session-orders">
                {session.orderIds.map((order, orderIndex) => {
                  const isOrderFulfilled = order.status === "Fulfilled";

                  return (
                    <section className={`session-order-block ${isOrderFulfilled ? "is-fulfilled" : ""}`} key={order._id}>
                      <div className="session-order-heading">
                        <div>
                          <h4>Order {orderIndex + 1}</h4>
                          <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <span className={`order-status ${isOrderFulfilled ? "fulfilled" : ""}`}>{order.status}</span>
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
                                  Qty {item.quantity} - {formatCurrency(item.price * item.quantity)}
                                </p>
                                {item.specialInstructions ? <span>{item.specialInstructions}</span> : null}
                              </div>
                              <button
                                disabled={isItemFulfilled}
                                onClick={() => fulfillOrderItem(order._id, item._id)}
                                type="button"
                              >
                                {isItemFulfilled ? "Done" : "Mark Fulfilled"}
                              </button>
                            </article>
                          );
                        })}
                      </div>

                      {!isOrderFulfilled ? (
                        <button className="secondary-action session-order-action" onClick={() => fulfillOrder(order._id)} type="button">
                          Mark This Order Fulfilled
                        </button>
                      ) : null}
                    </section>
                  );
                })}
              </div>

              <div className="order-actions">
                <strong>{formatCurrency(session.totalAmount)}</strong>
                {isReadyForBill ? (
                  <button className="bill-action" type="button">
                    <Receipt size={18} />
                    Generate Bill
                  </button>
                ) : (
                  <span className="session-progress">Fulfill all items to generate bill</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
