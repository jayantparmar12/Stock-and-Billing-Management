
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout/MainLayout";
import "./styles/global.css";
import Dashboard from "./pages/Dashboard/Dashboard";

function PagePlaceholder({ title }) {
  return (
    <section>
      <h1>{title}</h1>
      <p>This page is under development.</p>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={<Dashboard />}
          />
          <Route
            path="/products"
            element={<PagePlaceholder title="Products" />}
          />
          <Route
            path="/categories"
            element={<PagePlaceholder title="Categories" />}
          />
          <Route
            path="/customers"
            element={<PagePlaceholder title="Customers" />}
          />
          <Route
            path="/billing"
            element={<PagePlaceholder title="Billing" />}
          />
          <Route
            path="/payments"
            element={<PagePlaceholder title="Payments" />}
          />
          <Route
            path="/refunds"
            element={<PagePlaceholder title="Refunds" />}
          />
          <Route
            path="/stock-history"
            element={<PagePlaceholder title="Stock History" />}
          />
        </Route>

        <Route
          path="*"
          element={<PagePlaceholder title="Page not found" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
