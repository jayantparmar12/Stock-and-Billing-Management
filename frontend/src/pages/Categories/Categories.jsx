
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Tags,
  Pencil,
  Trash2,
  X,
  Package,
} from "lucide-react";
import "./Categories.css";
import api from "../../services/api";

const initialCategories = [
  {
    id: 1,
    name: "Electronics",
    description: "Electronic devices and accessories",
    productCount: 18,
  },
  {
    id: 2,
    name: "Accessories",
    description: "Computer and mobile accessories",
    productCount: 24,
  },
  {
    id: 3,
    name: "Office Supplies",
    description: "Essential supplies for office use",
    productCount: 12,
  },
  {
    id: 4,
    name: "Furniture",
    description: "Office desks, chairs and furniture",
    productCount: 8,
  },
  {
    id: 5,
    name: "Storage Devices",
    description: "External drives and storage products",
    productCount: 9,
  },
];

const emptyForm = {
  name: "",
  description: "",
};

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
      const response = await api.get('/api/categories')
      if (response.data.success) {
        setCategories(response.data.data)
      }
      else {
        setError(response.data.message)
      }
    }
    catch (err) {
      setError(err.response.data.message)
    }
  })

  useEffect(() => {
    fetchCategories()
  }, [])



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

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setFormError("Category name is required.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      setFormError("A category with this name already exists.");
      return;
    }

    if (editingId !== null) {
      try {
        const data = {
          id: editingId,
          name,
          description
        }
        const response = await api.put('/api/categories', data)
        if (response.data.success) {
          setCategories((prev) =>
            prev.map((category) =>
              category.id == editingId
                ? { ...category, ...response.data.data } : category)
          )
        }
        else {
          setError(response.data.message)
        }
      }
      catch (err) {
        setError(
          err.response.data.message
        )
      }
    } else {
      try {
        const data = {
          name,
          description
        }
        const response = await api.post('/api/categories', data)
        if (response.data.success) {
          setCategories((prev) => [...prev, response.data.data])
        }
        else {
          setError(response.data.message)
        }
      }
      catch (err) {
        setError(err.response.data.message)
      }
    }

    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleDelete = async (category) => {
    if (category.productsVariety > 0) {
      window.alert(
        "This category has products assigned to it. Remove those products from the category before deleting it."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await api.delete(`/api/categories/${category.id}`)
      if (response.data.success) {
        setCategories((current) =>
          current.filter((item) => item.id !== category.id)
        );
      }
      else {
        setError(response.data.message)
      }
    }
    catch (err) {
      setError(
        err.response.data.message
      )
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
                      {category.productsVariety} products veriety
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
