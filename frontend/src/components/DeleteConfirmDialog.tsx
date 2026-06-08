import { MenuItem } from "../types";

type DeleteConfirmDialogProps = {
  item: MenuItem;
  onCancel: () => void;
  onConfirm: (item: MenuItem) => void;
};

export function DeleteConfirmDialog({ item, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="confirm-dialog" role="dialog">
        <h2>PERMANENT DELETE WARNING</h2>
        <p>
          This will permanently delete <strong>{item.name}</strong> from the menu.
        </p>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="danger-action" onClick={() => onConfirm(item)} type="button">
            Delete Permanently
          </button>
        </div>
      </section>
    </div>
  );
}
