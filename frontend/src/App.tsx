import { AdminDashboard } from "./pages/AdminDashboard";
import { CustomerOrderingPage } from "./pages/CustomerOrderingPage";

export function App() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  if (view === "customer") {
    return <CustomerOrderingPage />;
  }

  return <AdminDashboard />;
}
