
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout/MainLayout";
import "./styles/global.css";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Products from "./pages/Products/Products.jsx";
import Categories from "./pages/Categories/Categories.jsx";
import Customers from "./pages/Customers/Customers.jsx";

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
