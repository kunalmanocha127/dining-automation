import { Receipt, RefreshCw } from "lucide-react";
import React from "react";
import { BillSummaryDialog } from "./BillSummaryDialog";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { useLiveSessions } from "../hooks/useLiveSessions";
import { endSession, fulfillOrder, fulfillOrderItem, generateSessionBill } from "../services/api";
import { Bill, DiningSession } from "../types";
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
  const [bill, setBill] = React.useState<Bill | null>(null);
  const [billError, setBillError] = React.useState("");
  const [billTarget, setBillTarget] = React.useState<DiningSession | null>(null);
  const [endTarget, setEndTarget] = React.useState<DiningSession | null>(null);

  const handleGenerateBill = async (session: DiningSession) => {
    try {
      setBillError("");
      const generatedBill = await generateSessionBill(session._id);
      setBill(generatedBill);
      setBillTarget(null);
      await fetchSessions();
    } catch (error) {
      setBillError(error instanceof Error ? error.message : "Could not generate bill.");
    }
  };

  const handleEndSession = async (session: DiningSession) => {
    try {
      setBillError("");
      await endSession(session._id);
      setEndTarget(null);
      await fetchSessions();
    } catch (error) {
      setBillError(error instanceof Error ? error.message : "Could not end session.");
    }
  };

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
      {billError ? <p className="empty-state">{billError}</p> : null}

      <div className="orders-grid">
        {sessions.map((session) => {
          const { fulfilledCount, itemCount, isReadyForBill } = getSessionFulfillment(session);
          const hasBill = Boolean(session.billId);

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
                {hasBill ? (
                  <button className="danger-action" onClick={() => setEndTarget(session)} type="button">
                    End Session
                  </button>
                ) : isReadyForBill ? (
                  <button className="bill-action" onClick={() => setBillTarget(session)} type="button">
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

      {bill ? <BillSummaryDialog bill={bill} onClose={() => setBill(null)} /> : null}
      {billTarget ? (
        <ConfirmActionDialog
          confirmLabel="Generate Bill"
          message={`Generate a final bill for Table ${billTarget.tableNumber}? This bill will move to the Generated Bills tab.`}
          onCancel={() => setBillTarget(null)}
          onConfirm={() => handleGenerateBill(billTarget)}
          title="CONFIRM BILL GENERATION"
        />
      ) : null}
      {endTarget ? (
        <ConfirmActionDialog
          confirmLabel="End Session"
          danger
          message={`End the dining session for Table ${endTarget.tableNumber}? It will be removed from Live Orders.`}
          onCancel={() => setEndTarget(null)}
          onConfirm={() => handleEndSession(endTarget)}
          title="END SESSION WARNING"
        />
      ) : null}
    </section>
  );
}
