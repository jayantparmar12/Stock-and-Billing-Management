import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  RefreshCw,
  Eye,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  History,
  Filter,
} from "lucide-react";
import "./Products.css";
import api from "../../services/api";

export const UNIT_OPTIONS = [
  { value: "pcs", label: "Pieces / Unit (pcs)", shortLabel: "pcs" },
  { value: "unit", label: "Unit (unit)", shortLabel: "unit" },
  { value: "kg", label: "Kilogram (kg)", shortLabel: "kg" },
  { value: "g", label: "Gram (g)", shortLabel: "g" },
  { value: "ltr", label: "Litre (ltr)", shortLabel: "ltr" },
  { value: "ml", label: "Millilitre (ml)", shortLabel: "ml" },
  { value: "box", label: "Box (box)", shortLabel: "box" },
  { value: "pack", label: "Packet / Pack (pack)", shortLabel: "pack" },
  { value: "dozen", label: "Dozen (dozen)", shortLabel: "dozen" },
  { value: "m", label: "Meter (m)", shortLabel: "m" },
];

const UNIT_STORAGE_KEY = "inventory_product_units";

function getStoredUnitsMap() {
  try {
    return JSON.parse(localStorage.getItem(UNIT_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveStoredUnit(productId, unit) {
  if (!productId || !unit) return;
  try {
    const map = getStoredUnitsMap();
    map[String(productId)] = unit;
    localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

function formatUnitLabel(unitValue) {
  const clean = String(unitValue || "pcs").trim().toLowerCase();
  const found = UNIT_OPTIONS.find((u) => u.value.toLowerCase() === clean);
  return found ? found.shortLabel : clean || "pcs";
}

const emptyForm = {
  name: "",
  category: "",
  price: "",
  quantity: "",
  unit: "pcs",
};

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function getStockStatus(quantity, threshold = 10) {
  const qty = Number(quantity ?? 0);
  if (qty <= 0) return { label: "Out of stock", className: "out" };
  if (qty <= threshold) return { label: "Low stock", className: "low" };
  return { label: "In stock", className: "in" };
}

function normalizeProduct(raw) {
  if (!raw) return null;

  const categoryName =
    typeof raw.category === "object" && raw.category !== null
      ? raw.category.name ?? ""
      : String(raw.category ?? "");

  const categoryId =
    typeof raw.category === "object" && raw.category !== null
      ? raw.category.id
      : undefined;

  const storedUnits = getStoredUnitsMap();
  const backendUnit = raw.unit ?? raw.unitType ?? raw.measurementUnit;
  const resolvedUnit = formatUnitLabel(
    backendUnit || storedUnits[String(raw.id)] || "pcs"
  );

  if (raw.id && backendUnit) {
    saveStoredUnit(raw.id, resolvedUnit);
  }

  return {
    id: raw.id,
    name: raw.name ?? raw.product ?? "",
    category: categoryName,
    categoryId,
    price: Number(raw.price ?? 0),
    quantity: Number(raw.quantity ?? 0),
    unit: resolvedUnit,
  };
}

function normalizeStockMovement(entry, index) {
  const type =
    entry.movementType ?? entry.type ?? entry.action ?? "ADJUSTMENT";
  const quantity =
    entry.quantity ?? entry.changeQuantity ?? entry.amount ?? 0;
  const before =
    entry.previousQuantity ??
    entry.beforeQuantity ??
    entry.oldQuantity ??
    entry.beforeStock ??
    entry.oldStock ??
    entry.initialStock;
  const after =
    entry.newQuantity ??
    entry.afterQuantity ??
    entry.currentQuantity ??
    entry.afterStock ??
    entry.newStock ??
    entry.finalStock;
  const note =
    entry.note ??
    entry.reason ??
    entry.description ??
    entry.remarks ??
    entry.message ??
    "—";
  const timestamp =
    entry.createdAt ??
    entry.timestamp ??
    entry.movementDate ??
    entry.date ??
    entry.createdDate ??
    null;

  return {
    id: entry.id ?? index,
    type: String(type).toUpperCase(),
    quantity: Number(quantity),
    before,
    after,
    note,
    timestamp,
  };
}

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

export default function Products() {
  // Core Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter & Search States
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [unitFilter, setUnitFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [isLowStockApiActive, setIsLowStockApiActive] = useState(false);

  // Add / Edit Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Product Details & Stock Modal States
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockActionLoading, setStockActionLoading] = useState(false);
  const [stockFeedback, setStockFeedback] = useState({ type: "", message: "" });

  // Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all products (GET /api/products)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setIsLowStockApiActive(false);

      const response = await api.get("/api/products");
      if (response.data?.success) {
        const list = Array.isArray(response.data.data)
          ? response.data.data.map(normalizeProduct)
          : [];
        setProducts(list);
      } else {
        setError(response.data?.message || "Unable to load products.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to connect to backend."));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories (GET /api/categories)
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/categories");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Fetch low stock products from backend endpoint (GET /api/products/low-stock?threshold=...)
  const fetchLowStockFromBackend = async () => {
    const threshold = Number(lowStockThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Please enter a valid non-negative threshold for low stock.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/products/low-stock", {
        params: { threshold },
      });

      if (response.data?.success) {
        const list = Array.isArray(response.data.data)
          ? response.data.data.map(normalizeProduct)
          : [];
        setProducts(list);
        setIsLowStockApiActive(true);
      } else {
        setError(response.data?.message || "Unable to fetch low stock products.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to fetch low stock products."));
    } finally {
      setLoading(false);
    }
  };

  // Open Product Details + Stock History
  const openProductDetails = async (id) => {
    setShowDetails(true);
    setDetailsLoading(true);
    setStockFeedback({ type: "", message: "" });
    setStockQuantity("");

    try {
      const [productRes, historyRes] = await Promise.all([
        api.get(`/api/products/${id}`),
        api.get(`/api/products/${id}/stock-history`),
      ]);

      if (productRes.data?.success) {
        const normalized = normalizeProduct(productRes.data.data);
        setSelectedProduct(normalized);
        setProducts((prev) =>
          prev.map((item) => (item.id === normalized.id ? normalized : item))
        );
      }

      if (historyRes.data?.success && Array.isArray(historyRes.data.data)) {
        setStockHistory(historyRes.data.data.map(normalizeStockMovement));
      } else {
        setStockHistory([]);
      }
    } catch (err) {
      setStockFeedback({
        type: "error",
        message: getErrorMessage(err, "Unable to load product details."),
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Increase or Decrease Stock
  const handleStockUpdate = async (action) => {
    if (!selectedProduct || stockActionLoading) return;

    const quantity = Number(stockQuantity);
    const unitLabel = selectedProduct.unit || "pcs";

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setStockFeedback({
        type: "error",
        message: "Please enter a valid positive whole number for quantity.",
      });
      return;
    }

    if (action === "decrease" && quantity > selectedProduct.quantity) {
      setStockFeedback({
        type: "error",
        message: `Insufficient stock. Available quantity is ${selectedProduct.quantity} ${unitLabel}.`,
      });
      return;
    }

    try {
      setStockActionLoading(true);
      setStockFeedback({ type: "", message: "" });

      const endpoint =
        action === "increase"
          ? `/api/products/${selectedProduct.id}/increase-stock`
          : `/api/products/${selectedProduct.id}/decrease-stock`;

      const response = await api.patch(endpoint, null, {
        params: { quantity },
      });

      if (response.data?.success) {
        const updated = normalizeProduct({
          ...response.data.data,
          unit: response.data.data?.unit || selectedProduct.unit,
        });
        if (updated) {
          setSelectedProduct(updated);
          setProducts((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
        }

        try {
          const historyRes = await api.get(
            `/api/products/${selectedProduct.id}/stock-history`
          );
          if (historyRes.data?.success && Array.isArray(historyRes.data.data)) {
            setStockHistory(historyRes.data.data.map(normalizeStockMovement));
          }
        } catch {
          // Ignore secondary history refresh failure
        }

        setStockQuantity("");
        setStockFeedback({
          type: "success",
          message:
            action === "increase"
              ? `Added +${quantity} ${unitLabel} to stock.`
              : `Removed -${quantity} ${unitLabel} from stock.`,
        });
      } else {
        setStockFeedback({
          type: "error",
          message: response.data?.message || `Unable to ${action} stock.`,
        });
      }
    } catch (err) {
      setStockFeedback({
        type: "error",
        message: getErrorMessage(
          err,
          `Unable to ${action} stock. Please try again.`
        ),
      });
    } finally {
      setStockActionLoading(false);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.unit || "").toLowerCase().includes(query) ||
        String(product.id).includes(query) ||
        `prd-${product.id}`.includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        product.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesUnit =
        unitFilter === "All" ||
        (product.unit || "pcs").toLowerCase() === unitFilter.toLowerCase();

      const statusLabel = getStockStatus(
        product.quantity,
        Number(lowStockThreshold) || 10
      ).label;
      const matchesStock =
        stockFilter === "All" || statusLabel === stockFilter;

      return matchesSearch && matchesCategory && matchesUnit && matchesStock;
    });
  }, [
    products,
    search,
    categoryFilter,
    unitFilter,
    stockFilter,
    lowStockThreshold,
  ]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (product, event) => {
    if (event) event.stopPropagation();

    setEditingId(product.id);

    const matchedCategory = categories.find(
      (cat) =>
        (product.categoryId && cat.id === product.categoryId) ||
        cat.name?.toLowerCase() === product.category?.toLowerCase()
    );

    setForm({
      name: product.name,
      category: matchedCategory ? String(matchedCategory.id) : "",
      price: String(product.price),
      quantity: String(product.quantity),
      unit: product.unit || "pcs",
    });

    setFormError("");
    setShowForm(true);
  };

  // Create or Update Product with Loading Spinner
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formSubmitting) return;

    const name = form.name.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const categoryId = Number(form.category);
    const unit = formatUnitLabel(form.unit || "pcs");

    if (
      !name ||
      form.price === "" ||
      form.quantity === "" ||
      form.category === ""
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Product price must be greater than zero.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setFormError("Product quantity must be zero or a positive whole number.");
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setFormError("Please select a valid category.");
      return;
    }

    const duplicateProduct = products.some(
      (product) =>
        product.name.toLowerCase() === name.toLowerCase() &&
        product.id !== editingId
    );

    if (duplicateProduct) {
      setFormError("A product with this name already exists.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      if (editingId !== null) {
        const payload = {
          id: editingId,
          name,
          category: categoryId,
          price,
          quantity,
          unit,
        };

        const response = await api.put("/api/products", payload);
        if (response.data?.success) {
          saveStoredUnit(editingId, unit);
          const updated = normalizeProduct({
            ...response.data.data,
            unit: response.data.data?.unit || unit,
          });
          setProducts((prev) =>
            prev.map((item) => (item.id === editingId ? updated : item))
          );
          if (selectedProduct?.id === editingId) {
            setSelectedProduct(updated);
          }
          setShowForm(false);
          setForm(emptyForm);
          setEditingId(null);
        } else {
          setFormError(response.data?.message || "Unable to update product.");
        }
      } else {
        const payload = {
          name,
          category: categoryId,
          price,
          quantity,
          unit,
        };

        const response = await api.post("/api/products", payload);
        if (response.data?.success) {
          const newId = response.data.data?.id;
          if (newId) {
            saveStoredUnit(newId, unit);
          }
          const created = normalizeProduct({
            ...response.data.data,
            unit: response.data.data?.unit || unit,
          });
          setProducts((prev) => [...prev, created]);
          setShowForm(false);
          setForm(emptyForm);
        } else {
          setFormError(response.data?.message || "Unable to create product.");
        }
      }
    } catch (err) {
      setFormError(getErrorMessage(err, "Unable to save product."));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Product with Loading Spinner
  const confirmDeleteProduct = async () => {
    if (!productToDelete || deleteLoading) return;

    try {
      setDeleteLoading(true);
      setError("");

      const response = await api.delete(`/api/products/${productToDelete.id}`);
      if (response.data?.success) {
        setProducts((prev) =>
          prev.filter((item) => item.id !== productToDelete.id)
        );
        if (selectedProduct?.id === productToDelete.id) {
          setShowDetails(false);
          setSelectedProduct(null);
        }
        setProductToDelete(null);
      } else {
        setError(response.data?.message || "Unable to delete product.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete product."));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Summary Metrics
  const totalValue = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      ),
    [products]
  );

  const effectiveThreshold = Number(lowStockThreshold) || 10;

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.quantity > 0 && product.quantity <= effectiveThreshold
      ).length,
    [products, effectiveThreshold]
  );

  const outOfStockCount = useMemo(
    () => products.filter((product) => product.quantity <= 0).length,
    [products]
  );

  return (
    <div className="products-page">
      <div className="products-heading">
        <div>
          <h1>Products</h1>
          <p>
            Manage your product catalogue, measurement units (kg, ltr, pcs), and
            live inventory levels.
          </p>
        </div>

        <div className="products-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={fetchProducts}
            disabled={loading}
            title="Refresh product list"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openAddForm}
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          <div className="error-message-content">
            <AlertTriangle size={18} />
            <div>
              <strong>Action failed</strong>
              <p>{error}</p>
            </div>
          </div>
          <button
            type="button"
            className="error-dismiss-btn"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="product-summary-grid">
        <article
          className={`product-summary-card clickable ${
            stockFilter === "All" && !isLowStockApiActive ? "active-card" : ""
          }`}
          onClick={() => {
            setStockFilter("All");
            if (isLowStockApiActive) fetchProducts();
          }}
        >
          <div className="summary-card-icon blue">
            <Package size={20} />
          </div>
          <div>
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
        </article>

        <article
          className={`product-summary-card clickable ${
            stockFilter === "Low stock" ? "active-card" : ""
          }`}
          onClick={() =>
            setStockFilter((prev) =>
              prev === "Low stock" ? "All" : "Low stock"
            )
          }
        >
          <div className="summary-card-icon amber">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>Low Stock (&le; {effectiveThreshold})</span>
            <strong>{lowStockCount}</strong>
          </div>
        </article>

        <article
          className={`product-summary-card clickable ${
            stockFilter === "Out of stock" ? "active-card" : ""
          }`}
          onClick={() =>
            setStockFilter((prev) =>
              prev === "Out of stock" ? "All" : "Out of stock"
            )
          }
        >
          <div className="summary-card-icon red">
            <Package size={20} />
          </div>
          <div>
            <span>Out of Stock</span>
            <strong>{outOfStockCount}</strong>
          </div>
        </article>

        <article className="product-summary-card">
          <div className="summary-card-icon green">
            <Package size={20} />
          </div>
          <div>
            <span>Inventory Value</span>
            <strong>{formatCurrency(totalValue)}</strong>
          </div>
        </article>
      </div>

      {/* Products Table Panel */}
      <section className="products-table-panel">
        <div className="products-toolbar">
          <div>
            <h3>
              {isLowStockApiActive
                ? `Low Stock Products (Threshold < ${lowStockThreshold})`
                : "All Products"}
            </h3>
            <p>{filteredProducts.length} products shown</p>
          </div>

          <div className="products-filters">
            <label className="product-search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search by name, ID, category, unit..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="product-select">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </label>

            <label className="product-select">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                aria-label="Filter by unit type"
              >
                <option value="All">All Units</option>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </label>

            <label className="product-select">
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                aria-label="Filter by stock status"
              >
                <option value="All">All Stock</option>
                <option value="In stock">In Stock</option>
                <option value="Low stock">Low Stock</option>
                <option value="Out of stock">Out of Stock</option>
              </select>
              <ChevronDown size={15} />
            </label>

            <div className="low-stock-api-bar">
              <Filter size={14} />
              <span>Threshold:</span>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="threshold-input"
                aria-label="Low stock threshold"
              />
              {isLowStockApiActive ? (
                <button
                  type="button"
                  className="threshold-btn reset"
                  onClick={fetchProducts}
                >
                  Show All
                </button>
              ) : (
                <button
                  type="button"
                  className="threshold-btn"
                  onClick={fetchLowStockFromBackend}
                >
                  Low Stock API
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="products-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE / UNIT</th>
                <th>QUANTITY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="products-empty">
                    <div className="table-loading-inline">
                      <RefreshCw size={18} className="spin-icon" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(
                    product.quantity,
                    effectiveThreshold
                  );
                  const unitLabel = product.unit || "pcs";

                  return (
                    <tr
                      key={product.id}
                      className="product-row"
                      onClick={() => openProductDetails(product.id)}
                    >
                      <td className="product-sku">#{product.id}</td>
                      <td>
                        <div className="product-name-cell">
                          <div className="product-mini-icon">
                            <Package size={18} />
                          </div>
                          <button
                            type="button"
                            className="product-name-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductDetails(product.id);
                            }}
                          >
                            {product.name}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="category-chip">
                          {product.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="product-price">
                        {formatCurrency(product.price)}
                        <span className="product-price-unit">
                          {" "}
                          / {unitLabel}
                        </span>
                      </td>
                      <td>
                        <div className="product-qty-cell">
                          <strong className="product-qty-value">
                            {product.quantity}
                          </strong>
                          <span className="product-unit-badge">
                            {unitLabel}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`product-status ${status.className}`}>
                          <span className="status-dot"></span>
                          {status.label}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="product-actions">
                          <button
                            type="button"
                            className="action-button view"
                            title="Manage stock & view history"
                            aria-label={`Manage stock for ${product.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductDetails(product.id);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-button edit"
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                            onClick={(e) => openEditForm(product, e)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-button delete"
                            title="Delete product"
                            aria-label={`Delete ${product.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(product);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="products-empty">
                    No products match your current search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Product Details, Stock Adjust & Stock History Modal */}
      {showDetails && (
        <div
          className="product-details-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !stockActionLoading) {
              setShowDetails(false);
            }
          }}
        >
          <div className="product-details-modal" role="dialog" aria-modal="true">
            <div className="details-modal-header">
              <div>
                <h2>Product Details & Stock Manager</h2>
                <p>Adjust live inventory levels and inspect movement logs.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                disabled={stockActionLoading}
                onClick={() => setShowDetails(false)}
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="details-loading">
                <RefreshCw size={18} className="spin-icon" />
                <span>Loading product details...</span>
              </div>
            ) : selectedProduct ? (
              <>
                <div className="details-info-grid">
                  <div className="details-info-item">
                    <span>Product ID</span>
                    <strong>#{selectedProduct.id}</strong>
                  </div>
                  <div className="details-info-item">
                    <span>Product Name</span>
                    <strong>{selectedProduct.name}</strong>
                  </div>
                  <div className="details-info-item">
                    <span>Category</span>
                    <strong>{selectedProduct.category || "—"}</strong>
                  </div>
                  <div className="details-info-item">
                    <span>Price per {selectedProduct.unit || "pcs"}</span>
                    <strong>
                      {formatCurrency(selectedProduct.price)} /{" "}
                      {selectedProduct.unit || "pcs"}
                    </strong>
                  </div>
                  <div className="details-info-item">
                    <span>Available Stock</span>
                    <strong>
                      {selectedProduct.quantity} {selectedProduct.unit || "pcs"}
                    </strong>
                  </div>
                  <div className="details-info-item">
                    <span>Total Stock Value</span>
                    <strong>
                      {formatCurrency(
                        selectedProduct.price * selectedProduct.quantity
                      )}
                    </strong>
                  </div>
                </div>

                {/* Stock Increase / Decrease Section */}
                <div className="stock-controls">
                  <div className="stock-controls-header">
                    <h3>Manage Stock ({selectedProduct.unit || "pcs"})</h3>
                    <span
                      className={`product-status ${
                        getStockStatus(
                          selectedProduct.quantity,
                          effectiveThreshold
                        ).className
                      }`}
                    >
                      <span className="status-dot"></span>
                      {
                        getStockStatus(
                          selectedProduct.quantity,
                          effectiveThreshold
                        ).label
                      }
                    </span>
                  </div>

                  <div className="stock-quick-presets">
                    <span>Quick presets ({selectedProduct.unit || "pcs"}):</span>
                    {[1, 5, 10, 25, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={stockActionLoading}
                        className={`preset-pill ${
                          Number(stockQuantity) === preset ? "active" : ""
                        }`}
                        onClick={() => setStockQuantity(String(preset))}
                      >
                        +{preset} {selectedProduct.unit || "pcs"}
                      </button>
                    ))}
                  </div>

                  <div className="stock-input-row">
                    <input
                      id="stock-quantity"
                      type="number"
                      min="1"
                      step="1"
                      disabled={stockActionLoading}
                      value={stockQuantity}
                      onChange={(event) => setStockQuantity(event.target.value)}
                      placeholder={`Enter quantity in ${
                        selectedProduct.unit || "pcs"
                      } (e.g. 10)`}
                    />

                    <div className="stock-action-buttons">
                      <button
                        type="button"
                        className="stock-increase-btn"
                        disabled={stockActionLoading}
                        onClick={() => handleStockUpdate("increase")}
                      >
                        {stockActionLoading ? (
                          <RefreshCw size={15} className="spin-icon" />
                        ) : (
                          <ArrowUpCircle size={16} />
                        )}
                        {stockActionLoading ? "Updating..." : "Increase Stock"}
                      </button>

                      <button
                        type="button"
                        className="stock-decrease-btn"
                        disabled={
                          stockActionLoading || selectedProduct.quantity <= 0
                        }
                        onClick={() => handleStockUpdate("decrease")}
                      >
                        {stockActionLoading ? (
                          <RefreshCw size={15} className="spin-icon" />
                        ) : (
                          <ArrowDownCircle size={16} />
                        )}
                        {stockActionLoading ? "Updating..." : "Decrease Stock"}
                      </button>
                    </div>
                  </div>

                  {stockFeedback.message && (
                    <div
                      className={`stock-feedback ${stockFeedback.type}`}
                      role="status"
                    >
                      {stockFeedback.message}
                    </div>
                  )}
                </div>

                {/* Stock Movement History Section */}
                <div className="stock-history-section">
                  <div className="stock-history-header">
                    <History size={16} />
                    <h3>Stock Movement History</h3>
                  </div>

                  {stockHistory.length === 0 ? (
                    <p className="empty-history">
                      No stock movements recorded for this product yet.
                    </p>
                  ) : (
                    <div className="stock-history-table-wrapper">
                      <table className="stock-history-table">
                        <thead>
                          <tr>
                            <th>TYPE</th>
                            <th>QTY</th>
                            <th>STOCK CHANGE</th>
                            <th>NOTE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockHistory.map((movement) => {
                            const isIncrease =
                              movement.type.includes("IN") ||
                              (movement.after !== undefined &&
                                movement.before !== undefined &&
                                movement.after > movement.before);
                            const unitLabel = selectedProduct.unit || "pcs";

                            return (
                              <tr key={movement.id}>
                                <td>
                                  <span
                                    className={`movement-badge ${
                                      isIncrease ? "in" : "out"
                                    }`}
                                  >
                                    {movement.type}
                                  </span>
                                </td>
                                <td>
                                  <strong>
                                    {isIncrease ? "+" : "-"}
                                    {movement.quantity} {unitLabel}
                                  </strong>
                                </td>
                                <td>
                                  {movement.before !== undefined &&
                                  movement.after !== undefined
                                    ? `${movement.before} ${unitLabel} → ${movement.after} ${unitLabel}`
                                    : "—"}
                                </td>
                                <td>{movement.note}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showForm && (
        <div
          className="product-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !formSubmitting) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="product-modal-heading">
              <div>
                <h2 id="product-modal-title">
                  {editingId !== null ? "Edit Product" : "Add Product"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update product details, measurement unit, and category."
                    : "Enter the details and measurement unit for your new product."}
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                aria-label="Close form"
                disabled={formSubmitting}
                onClick={() => setShowForm(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label className="full-width-field">
                  Product Name
                  <input
                    disabled={formSubmitting}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Basmati Rice, Amul Milk, Wireless Mouse"
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    disabled={formSubmitting}
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Unit Type (Measurement)
                  <select
                    disabled={formSubmitting}
                    value={form.unit}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        unit: event.target.value,
                      })
                    }
                    required
                  >
                    {UNIT_OPTIONS.map((unitOption) => (
                      <option key={unitOption.value} value={unitOption.value}>
                        {unitOption.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Price per {formatUnitLabel(form.unit)} (₹)
                  <input
                    disabled={formSubmitting}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </label>

                <label>
                  Initial / Current Quantity ({formatUnitLabel(form.unit)})
                  <input
                    disabled={formSubmitting}
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({ ...form, quantity: event.target.value })
                    }
                    placeholder={`0 ${formatUnitLabel(form.unit)}`}
                    required
                  />
                </label>
              </div>

              {formError && (
                <p className="product-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin-icon" />
                      {editingId !== null
                        ? "Saving Changes..."
                        : "Creating Product..."}
                    </>
                  ) : editingId !== null ? (
                    "Save Changes"
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal with Loading State */}
      {productToDelete && (
        <div
          className="product-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteLoading) {
              setProductToDelete(null);
            }
          }}
        >
          <section
            className="product-modal delete-confirm-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="product-modal-heading">
              <div>
                <h2>Delete Product</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button
                className="modal-close"
                type="button"
                disabled={deleteLoading}
                onClick={() => setProductToDelete(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="delete-confirm-text">
              Are you sure you want to delete{" "}
              <strong>{productToDelete.name}</strong> (#{productToDelete.id})?
            </p>

            <div className="product-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setProductToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={confirmDeleteProduct}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    Deleting...
                  </>
                ) : (
                  "Delete Product"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}