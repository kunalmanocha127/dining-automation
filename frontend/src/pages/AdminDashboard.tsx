import React from "react";
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { LiveOrdersPanel } from "../components/LiveOrdersPanel";
import { useLiveMenu } from "../hooks/useLiveMenu";
import { deleteMenuItem, saveMenuItem, toggleMenuItemAvailability } from "../services/api";
import { MenuItem, MenuItemForm } from "../types";
import { formatCurrency } from "../utils/format";

const emptyForm: MenuItemForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  imageUrl: "",
  isAvailable: true
};

const toForm = (item: MenuItem): MenuItemForm => ({
  name: item.name,
  description: item.description,
  category: item.category,
  price: String(item.price),
  imageUrl: item.imageUrl,
  isAvailable: item.isAvailable
});

export function AdminDashboard() {
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

  const handleSaveItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    const response = await saveMenuItem(form, editingId);

    if (!response.ok) {
      setStatusText("Could not save menu item");
      setIsSaving(false);
      return;
    }

    resetForm();
    setIsSaving(false);
    setStatusText(editingId ? "Menu item updated" : "Menu item added");
  };

  const handleDeleteItem = async (item: MenuItem) => {
    await deleteMenuItem(item._id);
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
            <form className="editor-panel" onSubmit={handleSaveItem}>
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
                            onClick={() => toggleMenuItemAvailability(item)}
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
        <DeleteConfirmDialog item={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteItem} />
      ) : null}
    </main>
  );
}
