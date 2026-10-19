
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout/MainLayout";
import "./styles/global.css";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Products from "./pages/Products/Products.jsx";
import Categories from "./pages/Categories/Categories.jsx";
import Customers from "./pages/Customers/Customers.jsx";
import Billing from "./pages/Billling/Billing.jsx";
import Payments from "./pages/Payments/Payments.jsx";
import Refunds from "./pages/Refunds/Refunds.jsx";
import StockHistory from "./pages/StockHistory/StockHistory.jsx";

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
            element={<Products />}
          />
          <Route
            path="/categories"
            element={<Categories />}
          />
          <Route
            path="/customers"
            element={<Customers />}
          />
          <Route
            path="/billing"
            element={<Billing />}
          />
          <Route
            path="/payments"
            element={<Payments />}
          />
          <Route
            path="/refunds"
            element={<Refunds />}
          />
          <Route
            path="/stock-history"
            element={<StockHistory />}
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
