import { RefreshCw, Send, WalletCards } from "lucide-react";
import { useVisibleBills } from "../hooks/useVisibleBills";
import { markBillPaid } from "../services/api";
import { formatCurrency } from "../utils/format";

export function GeneratedBillsPanel() {
  const { bills, billsStatus, fetchBills, isLoading } = useVisibleBills();

  const sendBillToCustomer = () => {
    window.alert("Bill sending will be connected later.");
  };

  return (
    <section className="generated-bills-panel">
      <div className="live-orders-header">
        <div>
          <h2>Generated Bills</h2>
          <p>{billsStatus}</p>
        </div>
        <button className="icon-button labeled" onClick={fetchBills} title="Refresh bills" type="button">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {isLoading ? <p className="empty-state">Loading generated bills...</p> : null}
      {!isLoading && bills.length === 0 ? <p className="empty-state">No generated bills to show.</p> : null}

      <div className="bills-grid">
        {bills.map((bill) => (
          <article className={`generated-bill-card ${bill.paymentStatus === "Paid" ? "is-paid" : ""}`} key={bill._id}>
            <div className="bill-card-top">
              <div>
                <p className="eyebrow">Table {bill.tableNumber}</p>
                <h3>Bill #{bill._id.slice(-6).toUpperCase()}</h3>
              </div>
              <span>{bill.paymentStatus}</span>
            </div>

            <div className="order-meta">
              <span>Mobile: {bill.mobileNumber}</span>
              <span>{bill.items.length} items</span>
              <span>{new Date(bill.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>

            <div className="bill-mini-lines">
              {bill.items.map((item) => (
                <div className="bill-mini-line" key={`${item.orderId}-${item.orderItemId}`}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(item.lineTotal)}</strong>
                </div>
              ))}
            </div>

            <div className="order-actions">
              <strong>{formatCurrency(bill.totalAmount)}</strong>
              <div className="bill-card-actions">
                <button className="secondary-action" onClick={sendBillToCustomer} type="button">
                  <Send size={17} />
                  Send Bill to Customer
                </button>
                <button className="bill-action" disabled={bill.paymentStatus === "Paid"} onClick={() => markBillPaid(bill._id)} type="button">
                  <WalletCards size={17} />
                  {bill.paymentStatus === "Paid" ? "Paid" : "Mark as Paid"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
