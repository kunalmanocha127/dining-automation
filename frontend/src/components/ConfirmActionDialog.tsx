type ConfirmActionDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm
}: ConfirmActionDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className={`confirm-dialog ${danger ? "danger-confirm" : ""}`} role="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className={danger ? "danger-action" : "primary-action"} onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
