
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Tags,
  Pencil,
  Trash2,
  X,
  Package,
  AlertTriangle
} from "lucide-react";
import "./Categories.css";
import api from "../../services/api";

const emptyForm = {
  name: "",
  description: "",
};

function getCategoryError(err, fallback) {
  if (err?.response?.status === 403) {
    return "Access Denied: Only ADMIN can add, edit, or delete categories.";
  }
  if (err?.response?.status === 401) {
    return "Session expired. Please sign in again.";
  }
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}


export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/api/categories");
      if (response.data?.success) {
        setCategories(response.data.data || []);
      } else {
        setError(response.data?.message || "Unable to load categories.");
      }
    } catch (err) {
      setError(getCategoryError(err, "Unable to connect to backend to load categories."));
    }
  }, []);

  useState(()=>{
    fetchCategories()
  },[])



  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description,
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setError("");

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

    try {
      if (editingId !== null) {
        const response = await api.put("/api/categories", {
          id: editingId,
          name,
          description,
        });
        if (response.data?.success) {
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === editingId ? { ...cat, ...response.data.data } : cat
            )
          );
          setShowForm(false);
          setForm(emptyForm);
          setEditingId(null);
        } else {
          setFormError(response.data?.message || "Unable to update category.");
        }
      } else {
        const response = await api.post("/api/categories", { name, description });
        if (response.data?.success) {
          setCategories((prev) => [
            ...prev,
            { productsVariety: 0, ...response.data.data },
          ]);
          setShowForm(false);
          setForm(emptyForm);
        } else {
          setFormError(response.data?.message || "Unable to add category.");
        }
      }
    } catch (err) {
      const msg = getCategoryError(err, "Unable to save category.");
      setFormError(msg);
      setError(msg);
    }
  };

  const handleDelete = async (category) => {
    if ((category.productsVariety ?? 0) > 0) {
      setError(
        `Cannot delete "${category.name}" because products are assigned to it.`
      );
      return;
    }
    try {
      setError("");
      const response = await api.delete(`/api/categories/${category.id}`);
      if (response.data?.success) {
        setCategories((current) =>
          current.filter((item) => item.id !== category.id)
        );
      } else {
        setError(response.data?.message || "Unable to delete category.");
      }
    } catch (err) {
      setError(getCategoryError(err, "Unable to delete category."));
    }
  };

  return (
    <div className="categories-page">
      <div className="categories-heading">
        <div>
          <h1>Categories</h1>
          <p>Organize your products into manageable groups.</p>

        </div>

        <button className="primary-button" onClick={openAddForm}>
          <Plus size={17} />
          Add Category
        </button>
        
      </div>
           {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "12px 16px",
            marginBottom: "18px",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            style={{
              border: "none",
              background: "transparent",
              color: "#991b1b",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Dismiss
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
                (total, category) => total + category.productsVariety,
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
              {categories.filter((category) => category.productsVariety === 0).length}
            </strong>
          </div>
        </article>
      </section>

      <section className="categories-table-panel">
        <div className="categories-toolbar">
          <div>
            <h3>All Categories</h3>
            <p>{filteredCategories.length} categories found</p>
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
                <th>PRODUCTS Variety</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="category-name-cell">
                      <div className="category-row-icon">
                        <Tags size={18} />
                      </div>
                      <strong>{category.name}</strong>
                    </div>
                  </td>

                  <td className="category-description">
                    {category.description || "No description"}
                  </td>

                  <td>
                    <span className="category-product-count">
                      {category.productsVariety? `${category.productsVariety}` :"0"} Products Veriety
                    </span>
                  </td>

                  <td>
                    <span
                      className={`category-status ${category.productsVariety > 0 ? "active" : "empty"
                        }`}
                    >
                      <span className="category-status-dot" />
                      {category.productsVariety > 0 ? "Active" : "Empty"}
                    </span>
                  </td>

                  <td>
                    <div className="category-actions">
                      <button
                        type="button"
                        className="action-button edit"
                        title="Edit category"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => openEditForm(category)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="action-button delete"
                        title="Delete category"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="5" className="categories-empty">
                    No categories found. Try another search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="category-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
          }}
        >
          <section
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
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
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  {editingId !== null ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}


    </div>
  );
}
