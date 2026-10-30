import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Tags,
  Pencil,
  Trash2,
  Eye,
  X,
  Package,
  RefreshCw,
  IndianRupee,
  Layers,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import "./Categories.css";
import api from "../../services/api";

const emptyForm = {
  name: "",
  description: "",
};

const UNIT_STORAGE_KEY = "inventory_product_units";

function getStoredUnitsMap() {
  try {
    return JSON.parse(localStorage.getItem(UNIT_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function normalizeProduct(raw, fallbackCategory = null) {
  if (!raw) return null;
  const categoryName =
    typeof raw.category === "object" && raw.category !== null
      ? raw.category.name ?? ""
      : raw.category ?? fallbackCategory?.name ?? "";
  const categoryId =
    typeof raw.category === "object" && raw.category !== null
      ? raw.category.id ?? null
      : raw.categoryId ?? fallbackCategory?.id ?? null;

  const storedUnits = getStoredUnitsMap();
  const unit =
    raw.unit ??
    raw.unitType ??
    storedUnits[String(raw.id)] ??
    "pcs";

  return {
    id: raw.id,
    name: raw.name ?? raw.product ?? "Product",
    categoryName: String(categoryName).trim(),
    categoryId,
    price: Number(raw.price ?? 0),
    quantity: Number(raw.quantity ?? raw.stock ?? 0),
    unit: String(unit || "pcs").toLowerCase(),
  };
}

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Add / Edit Category Modal State + Loading State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirmation Modal State + Loading State
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Selected Category Details & Products Modal State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalProducts, setCategoryModalProducts] = useState([]);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(false);
  const [categoryProductSearch, setCategoryProductSearch] = useState("");

  const fetchCategoriesAndProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [catRes, prodRes] = await Promise.all([
        api.get("/api/categories"),
        api.get("/api/products").catch(() => ({ data: { data: [] } })),
      ]);

      const rawProducts = Array.isArray(prodRes.data?.data)
        ? prodRes.data.data.map((p) => normalizeProduct(p)).filter(Boolean)
        : [];
      setProducts(rawProducts);

      if (catRes.data?.success) {
        const rawCategories = catRes.data.data || [];

        const countByName = {};
        const countById = {};

        rawProducts.forEach((p) => {
          if (p.categoryName) {
            const key = p.categoryName.toLowerCase();
            countByName[key] = (countByName[key] || 0) + 1;
          }
          if (p.categoryId !== undefined && p.categoryId !== null) {
            countById[p.categoryId] = (countById[p.categoryId] || 0) + 1;
          }
        });

        const enriched = rawCategories.map((cat) => {
          const nameKey = (cat.name || "").trim().toLowerCase();
          const varietyCount =
            countById[cat.id] ??
            countByName[nameKey] ??
            (cat.productsVariety !== undefined && cat.productsVariety !== null
              ? Number(cat.productsVariety)
              : 0);

          return {
            ...cat,
            productsVariety: varietyCount,
          };
        });

        setCategories(enriched);
      } else {
        setError(catRes.data?.message || "Unable to load categories");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesAndProducts();
  }, [fetchCategoriesAndProducts]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter(
      (category) =>
        (category.name ?? "").toLowerCase().includes(query) ||
        (category.description ?? "").toLowerCase().includes(query)
    );
  }, [categories, search]);

  // Open Category Modal & Load Products (Supports GET /api/categories/{id}/products + Frontend Fallback)
  const openCategoryDetails = useCallback(
    async (category) => {
      if (!category) return;
      setSelectedCategory(category);
      setCategoryProductSearch("");

      // 1. Instant local filter from already-fetched products
      const targetName = (category.name ?? "").trim().toLowerCase();
      const targetId = category.id;
      const localMatches = products.filter(
        (p) =>
          (p.categoryId !== null &&
            p.categoryId !== undefined &&
            String(p.categoryId) === String(targetId)) ||
          p.categoryName.toLowerCase() === targetName
      );
      setCategoryModalProducts(localMatches);

      // 2. Also try dedicated backend endpoint GET /api/categories/{id}/products if added in CategoryController
      try {
        setCategoryProductsLoading(true);
        const res = await api.get(`/api/categories/${category.id}/products`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          const normalized = res.data.data
            .map((item) => normalizeProduct(item, category))
            .filter(Boolean);
          setCategoryModalProducts(normalized);
        }
      } catch {
        // Fallback silently to localMatches if backend endpoint is not yet added
      } finally {
        setCategoryProductsLoading(false);
      }
    },
    [products]
  );

  // Filtered products inside the modal search bar
  const displayedCategoryProducts = useMemo(() => {
    const prodQuery = categoryProductSearch.trim().toLowerCase();
    if (!prodQuery) return categoryModalProducts;

    return categoryModalProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(prodQuery) ||
        String(p.id).includes(prodQuery)
    );
  }, [categoryModalProducts, categoryProductSearch]);

  const categoryStats = useMemo(() => {
    const totalUnits = categoryModalProducts.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0
    );
    const totalValue = categoryModalProducts.reduce(
      (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
      0
    );
    return {
      totalProducts: categoryModalProducts.length,
      totalUnits,
      totalValue,
    };
  }, [categoryModalProducts]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (category, event) => {
    if (event) event.stopPropagation();
    setEditingId(category.id);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
    });
    setFormError("");
    setShowForm(true);
  };

  // Create or Edit Category with proper Loading State
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formSubmitting) return;

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setFormError("Category name is required.");
      return;
    }

    if (!description) {
      setFormError("Category description is required.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        (category.name ?? "").toLowerCase() === name.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      setFormError("A category with this name already exists.");
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");
      setError("");

      if (editingId !== null) {
        const data = {
          id: editingId,
          name,
          description,
        };
        const response = await api.put("/api/categories", data);
        if (response.data?.success) {
          await fetchCategoriesAndProducts();
          setShowForm(false);
          setForm(emptyForm);
          setEditingId(null);
        } else {
          setFormError(response.data?.message || "Unable to update category.");
        }
      } else {
        const data = {
          name,
          description,
        };
        const response = await api.post("/api/categories", data);
        if (response.data?.success) {
          setCategories((prev) => [
            ...prev,
            { productsVariety: 0, ...response.data.data },
          ]);
          setShowForm(false);
          setForm(emptyForm);
          setEditingId(null);
        } else {
          setFormError(response.data?.message || "Unable to add category.");
        }
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (editingId !== null
            ? "Unable to update category."
            : "Unable to create category.")
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (category, event) => {
    if (event) event.stopPropagation();
    setDeleteError("");
    setCategoryToDelete(category);
  };

  // Confirm Delete Category with proper Loading State
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete || deleteLoading) return;

    if ((categoryToDelete.productsVariety ?? 0) > 0) {
      setDeleteError(
        `This category contains ${categoryToDelete.productsVariety} product(s). Please move or delete those products before deleting this category.`
      );
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");
      setError("");

      const response = await api.delete(
        `/api/categories/${categoryToDelete.id}`
      );
      if (response.data?.success) {
        setCategories((current) =>
          current.filter((item) => item.id !== categoryToDelete.id)
        );
        if (selectedCategory?.id === categoryToDelete.id) {
          setSelectedCategory(null);
        }
        setCategoryToDelete(null);
      } else {
        setDeleteError(
          response.data?.message || "Unable to delete category."
        );
      }
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Unable to delete category."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="categories-page">
      <div className="categories-heading">
        <div>
          <h1>Categories</h1>
          <p>
            Organize your products into manageable groups. Click anywhere on a
            category row to view its products.
          </p>
        </div>

        <div className="categories-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={fetchCategoriesAndProducts}
            disabled={loading}
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
            Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="category-error-banner" role="alert">
          <div className="category-error-content">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="category-error-dismiss"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="category-summary-grid">
        <article className="category-summary-card">
          <div className="category-summary-icon">
            <Tags size={21} />
          </div>
          <div>
            <span>Total Categories</span>
            <strong>{categories.length}</strong>
          </div>
        </article>

        <article className="category-summary-card">
          <div className="category-summary-icon green">
            <Package size={21} />
          </div>
          <div>
            <span>Total Products Variety</span>
            <strong>
              {categories.reduce(
                (total, category) => total + (category.productsVariety ?? 0),
                0
              )}
            </strong>
          </div>
        </article>

        <article className="category-summary-card">
          <div className="category-summary-icon amber">
            <Tags size={21} />
          </div>
          <div>
            <span>Empty Categories</span>
            <strong>
              {
                categories.filter(
                  (category) => (category.productsVariety ?? 0) === 0
                ).length
              }
            </strong>
          </div>
        </article>
      </section>

      <section className="categories-table-panel">
        <div className="categories-toolbar">
          <div>
            <h3>All Categories</h3>
            <p>
              {filteredCategories.length} categories found — click any row to
              view all products inside that category
            </p>
          </div>

          <label className="category-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search categories, description..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="categories-table-scroll">
          <table className="categories-table">
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>PRODUCTS VARIETY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="categories-empty">
                    <div className="table-loading-inline">
                      <RefreshCw size={18} className="spin-icon" />
                      <span>Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="category-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => openCategoryDetails(category)}
                    title={`Click to view all products in ${category.name}`}
                  >
                    <td>
                      <div className="category-name-cell">
                        <div className="category-row-icon">
                          <Tags size={18} />
                        </div>
                        <div className="category-name-text-wrap">
                          <strong className="category-name-text">
                            {category.name}
                          </strong>
                          <span className="category-row-hint">
                            Click to view products <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="category-description">
                      {category.description || "No description"}
                    </td>

                    <td>
                      <span className="category-product-count">
                        {category.productsVariety ?? 0} products variety
                      </span>
                    </td>

                    <td>
                      <span
                        className={`category-status ${
                          (category.productsVariety ?? 0) > 0
                            ? "active"
                            : "empty"
                        }`}
                      >
                        <span className="category-status-dot" />
                        {(category.productsVariety ?? 0) > 0
                          ? "Active"
                          : "Empty"}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="category-actions">
                        <button
                          type="button"
                          className="action-button view"
                          title="View products in this category"
                          aria-label={`View products in ${category.name}`}
                          onClick={() => openCategoryDetails(category)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="action-button edit"
                          title="Edit category"
                          aria-label={`Edit ${category.name}`}
                          onClick={(e) => openEditForm(category, e)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="action-button delete"
                          title="Delete category"
                          aria-label={`Delete ${category.name}`}
                          onClick={(e) => openDeleteModal(category, e)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="5" className="categories-empty">
                    No categories found. Try another search or click &ldquo;Add
                    Category&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Category Products Modal (Opens when clicking ANYWHERE on a Category Row) */}
      {selectedCategory && (
        <div
          className="category-modal-backdrop"
          onClick={() => setSelectedCategory(null)}
        >
          <section
            className="category-modal category-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-products-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="category-modal-heading">
              <div className="category-modal-title-group">
                <div className="category-modal-badge-icon">
                  <Tags size={20} />
                </div>
                <div>
                  <div className="category-modal-title-row">
                    <h2 id="category-products-modal-title">
                      {selectedCategory.name}
                    </h2>
                    <span className="category-id-pill">
                      ID #{selectedCategory.id}
                    </span>
                    <span
                      className={`category-status ${
                        categoryStats.totalProducts > 0 ? "active" : "empty"
                      }`}
                    >
                      <span className="category-status-dot" />
                      {categoryStats.totalProducts > 0 ? "Active" : "Empty"}
                    </span>
                  </div>
                  <p className="category-modal-desc">
                    {selectedCategory.description ||
                      "All products assigned to this category in your shop."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Close modal"
                onClick={() => setSelectedCategory(null)}
              >
                <X size={19} />
              </button>
            </div>

            {/* 3 Summary Stat Cards inside Modal */}
            <div className="category-details-grid">
              <div className="category-detail-box">
                <div className="category-detail-icon blue">
                  <Package size={18} />
                </div>
                <div>
                  <span>Products Variety</span>
                  <strong>{categoryStats.totalProducts} Products</strong>
                </div>
              </div>

              <div className="category-detail-box">
                <div className="category-detail-icon green">
                  <Layers size={18} />
                </div>
                <div>
                  <span>Total Stock Qty</span>
                  <strong>{categoryStats.totalUnits} Units</strong>
                </div>
              </div>

              <div className="category-detail-box">
                <div className="category-detail-icon purple">
                  <IndianRupee size={18} />
                </div>
                <div>
                  <span>Total Stock Value</span>
                  <strong>{formatCurrency(categoryStats.totalValue)}</strong>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="category-products-section">
              <div className="category-products-header">
                <div>
                  <h3>Products in &ldquo;{selectedCategory.name}&rdquo;</h3>
                  <span>
                    Showing {displayedCategoryProducts.length} of{" "}
                    {categoryModalProducts.length} items
                  </span>
                </div>

                {categoryModalProducts.length > 0 && (
                  <label className="category-modal-search">
                    <Search size={15} />
                    <input
                      type="search"
                      placeholder="Search product name or ID..."
                      value={categoryProductSearch}
                      onChange={(e) => setCategoryProductSearch(e.target.value)}
                    />
                  </label>
                )}
              </div>

              {categoryProductsLoading && categoryModalProducts.length === 0 ? (
                <div className="details-loading">
                  <RefreshCw size={18} className="spin-icon" />
                  <span>
                    Loading products for {selectedCategory.name}...
                  </span>
                </div>
              ) : displayedCategoryProducts.length === 0 ? (
                <div className="empty-assigned-products">
                  <div className="empty-assigned-icon">
                    <Package size={24} />
                  </div>
                  <h4>
                    {categoryModalProducts.length === 0
                      ? "No products in this category yet"
                      : "No matching products found"}
                  </h4>
                  <p>
                    {categoryModalProducts.length === 0
                      ? `Add products under "${selectedCategory.name}" from the Products page.`
                      : "Try clearing your search filter."}
                  </p>
                  {categoryModalProducts.length === 0 && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        setSelectedCategory(null);
                        navigate("/products");
                      }}
                    >
                      <Plus size={15} />
                      Go to Products Page
                    </button>
                  )}
                </div>
              ) : (
                <div className="assigned-products-table-wrapper">
                  <table className="assigned-products-table">
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>UNIT PRICE</th>
                        <th>STOCK QTY</th>
                        <th>STOCK VALUE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedCategoryProducts.map((prod) => {
                        const stockValue =
                          Number(prod.price || 0) * Number(prod.quantity || 0);
                        const isOut = prod.quantity <= 0;
                        const isLow = prod.quantity > 0 && prod.quantity < 11;
                        const unitLabel = prod.unit || "pcs";

                        return (
                          <tr key={prod.id}>
                            <td>
                              <div className="assigned-product-cell">
                                <div className="assigned-product-icon">
                                  <Package size={16} />
                                </div>
                                <div>
                                  <strong className="assigned-product-name">
                                    {prod.name}
                                  </strong>
                                  <span className="assigned-product-id">
                                    ID #{prod.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="assigned-product-price">
                              {formatCurrency(prod.price)} / {unitLabel}
                            </td>

                            <td>
                              <span className="assigned-product-qty">
                                <strong>{prod.quantity}</strong> {unitLabel}
                              </span>
                            </td>

                            <td className="assigned-product-value">
                              {formatCurrency(stockValue)}
                            </td>

                            <td>
                              <span
                                className={`category-status ${
                                  isOut
                                    ? "out"
                                    : isLow
                                    ? "empty"
                                    : "active"
                                }`}
                              >
                                <span className="category-status-dot" />
                                {isOut
                                  ? "Out of Stock"
                                  : isLow
                                  ? "Low Stock"
                                  : "In Stock"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="category-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedCategory(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showForm && (
        <div
          className="category-modal-backdrop"
          onClick={() => {
            if (!formSubmitting) setShowForm(false);
          }}
        >
          <section
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="category-modal-heading">
              <div>
                <h2 id="category-modal-title">
                  {editingId !== null ? "Edit Category" : "Add Category"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update the category information."
                    : "Create a category for your products."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Close form"
                disabled={formSubmitting}
                onClick={() => setShowForm(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="category-form-fields">
                <label>
                  Category Name
                  <input
                    autoFocus
                    disabled={formSubmitting}
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Electronics"
                    maxLength={100}
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    disabled={formSubmitting}
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    placeholder="Describe this category..."
                    rows={4}
                    maxLength={500}
                    required
                  />
                </label>
              </div>

              {formError && (
                <p className="category-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="category-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={formSubmitting}
                  onClick={() => setShowForm(false)}
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
                        : "Creating Category..."}
                    </>
                  ) : editingId !== null ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete Category Confirmation Modal with Loading State */}
      {categoryToDelete && (
        <div
          className="category-modal-backdrop"
          onClick={() => {
            if (!deleteLoading) setCategoryToDelete(null);
          }}
        >
          <section
            className="category-modal delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="category-modal-heading">
              <div>
                <h2>Delete Category</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                disabled={deleteLoading}
                onClick={() => setCategoryToDelete(null)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="delete-confirm-text">
              Are you sure you want to delete{" "}
              <strong>{categoryToDelete.name}</strong> (#{categoryToDelete.id})?
            </p>

            {deleteError && (
              <p className="category-form-error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="category-form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={deleteLoading}
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={deleteLoading}
                onClick={confirmDeleteCategory}
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw size={15} className="spin-icon" />
                    Deleting...
                  </>
                ) : (
                  "Delete Category"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}