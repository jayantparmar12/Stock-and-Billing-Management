
import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import "./Products.css";

import api from '../../services/api';
import axios from "axios";


const initialProducts = [
  { id: 1, name: "Wireless Mouse", sku: "PRD-1001", category: "Accessories", price: 799, quantity: 42 },
  { id: 2, name: "Mechanical Keyboard", sku: "PRD-1002", category: "Accessories", price: 2499, quantity: 7 },
  { id: 3, name: "USB-C Hub", sku: "PRD-1003", category: "Electronics", price: 1599, quantity: 28 },
  { id: 4, name: "Laptop Stand", sku: "PRD-1004", category: "Accessories", price: 999, quantity: 0 },
  { id: 5, name: "Webcam HD", sku: "PRD-1005", category: "Electronics", price: 2199, quantity: 5 },
  { id: 6, name: "USB Cable", sku: "PRD-1006", category: "Electronics", price: 299, quantity: 65 },
];

const emptyForm = {
  name: "",
  sku: "",
  category: "Accessories",
  price: "",
  quantity: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getStockStatus(quantity) {
  if (quantity === 0) return { label: "Out of stock", className: "out" };
  if (quantity <= 10) return { label: "Low stock", className: "low" };
  return { label: "In stock", className: "in" };
}

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [realProducts, setRealProducts] = useState([]);
  const [categories, setCategoreis] = useState([])
  useEffect(()=>{
    const featchProducts = async () => {
      try{
        setLoading(true)
        setError(false)

        const response = await api.get('/api/products');
        if(response.data.success) {
          setRealProducts(response.data.data)
        }
        else {
          setError(response.data.message || 'Unable to laod products')
        }
      }
      catch(err){
        setError(
          err.response.data.message || 'Unabel to connect with backend'
        )
      }
      finally {
        setLoading(false)
      }
    }
    featchProducts()
  },[])

  useEffect(()=>{
    const featchCategory = async () =>{
      try{
        setLoading(true)
        setError(false)
        const resposne = await api.get('/api/categories')
        if(resposne.data.success) {
          setCategoreis(resposne.data.data)
        }
      } catch(err){
          setFormError(
            err.response.data.message || 'Unable to connect with backend'
          )
      }
      finally{
        setLoading(false)
      }
    }
    featchCategory()
  },[])
  
  console.log(realProducts)
  console.log(categories)
  

  const filteredProducts = useMemo(() => {
    return realProducts.filter((product) => {
      const query = search.toLowerCase().trim();

      const matchesSearch =
        (product.product ?? '').trim().toLowerCase().includes(query) ||
        String(product.id ?? '').trim().includes(query);

      return matchesSearch;
    });
  }, [realProducts, search]);

console.log(filteredProducts)
  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      quantity: String(product.quantity),
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const sku = form.sku.trim();
    const price = Number(form.price);
    const quantity = Number(form.quantity);

    if (!name || !sku || form.price === "" || form.quantity === "") {
      setFormError("Please fill in all fields.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setFormError("Price must be a valid non-negative number.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setFormError("Quantity must be a non-negative whole number.");
      return;
    }

    const duplicateSku = products.some(
      (product) =>
        product.sku.toLowerCase() === sku.toLowerCase() &&
        product.id !== editingId
    );

    if (duplicateSku) {
      setFormError("This SKU already exists.");
      return;
    }

    const productData = {
      name,
      sku,
      category: form.category,
      price,
      quantity,
    };

    if (editingId !== null) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingId
            ? { ...product, ...productData }
            : product
        )
      );
    } else {
      setProducts((current) => [
        ...current,
        { id: Date.now(), ...productData },
      ]);
    }

    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  };

  const handleDelete = (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}" from this demo list?`
    );

    if (!confirmed) return;

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    );
  };

  const totalValue = realProducts.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  const lowStockCount = realProducts.filter(
    (product) => product.quantity > 0 && product.quantity <= 10
  ).length;

  const outOfStockCount = realProducts.filter(
    (product) => product.quantity === 0
  ).length;

  return (
    <div className="products-page">
      <div className="products-heading">
        <div>
          <h1>Products</h1>
          <p>Manage your product catalogue and inventory levels.</p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          <Plus size={17} />
          Add Product
        </button>
      </div>

      <div className="product-summary-grid">
        <article className="product-summary-card">
          <div className="summary-card-icon blue">
            <Package size={20} />
          </div>
          <div>
            <span>Total Products</span>
            <strong>{realProducts.length}</strong>
          </div>
        </article>

        <article className="product-summary-card">
          <div className="summary-card-icon amber">
            <Package size={20} />
          </div>
          <div>
            <span>Low Stock Items</span>
            <strong>{lowStockCount}</strong>
          </div>
        </article>

        <article className="product-summary-card">
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

      <section className="products-table-panel">
        <div className="products-toolbar">
          <div>
            <h3>All Products</h3>
            <p>{filteredProducts.length} products shown</p>
          </div>

          <div className="products-filters">
            <label className="product-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search product..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>


            <label className="product-select">
              <label className="product-select">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option key="all-categories" value="All">
                    All Categories
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={String(category.id)}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <ChevronDown size={15} />
              </label>

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
          </div>
        </div>

        <div className="products-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>QUANTITY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product.quantity);

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name-cell">
                        <div className="product-mini-icon">
                          <Package size={18} />
                        </div>
                        <strong>{product.product}</strong>
                      </div>
                    </td>
                    <td>{product.category.name}</td>
                    <td className="product-price">
                      {formatCurrency(product.price)}
                    </td>
                    <td>{product.quantity}</td>
                    <td>
                      <span className={`product-status ${status.className}`}>
                        <span className="status-dot"></span>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="action-button edit"
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEditForm(product)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-button delete"
                          title="Delete demo product"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="products-empty">
                    No products match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="product-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowForm(false);
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
                    ? "Update product details."
                    : "Enter the details for your new product."}
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                aria-label="Close form"
                onClick={() => setShowForm(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label>
                  Product Name
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Wireless Mouse"
                    required
                  />
                </label>

                <label>
                  SKU
                  <input
                    value={form.sku}
                    onChange={(event) =>
                      setForm({ ...form, sku: event.target.value })
                    }
                    placeholder="e.g. PRD-1007"
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  >
                    <option>Accessories</option>
                    <option>Electronics</option>
                    <option>Office Supplies</option>
                  </select>
                </label>

                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </label>

                <label className="full-width-field">
                  Quantity
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({ ...form, quantity: event.target.value })
                    }
                    placeholder="0"
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
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  {editingId !== null ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
