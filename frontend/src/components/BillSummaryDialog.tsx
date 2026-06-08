import { Bill } from "../types";
import { formatCurrency } from "../utils/format";

type BillSummaryDialogProps = {
  bill: Bill;
  onClose: () => void;
};

export function BillSummaryDialog({ bill, onClose }: BillSummaryDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="bill-dialog" role="dialog">
        <div className="bill-dialog-heading">
          <div>
            <p className="eyebrow">Table {bill.tableNumber}</p>
            <h2>Bill Summary</h2>
          </div>
          <span>{bill.paymentStatus}</span>
        </div>

        <div className="bill-lines">
          {bill.items.map((item) => (
            <div className="bill-line" key={`${item.orderId}-${item.orderItemId}`}>
              <div>
                <strong>{item.name}</strong>
                <span>
                  Qty {item.quantity} x {formatCurrency(item.unitPrice)}
                </span>
              </div>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          ))}
        </div>

        <div className="bill-total-row">
          <span>Total</span>
          <strong>{formatCurrency(bill.totalAmount)}</strong>
        </div>

        <button className="primary-action" onClick={onClose} type="button">
          Close
        </button>
      </section>
    </div>
  );
}
