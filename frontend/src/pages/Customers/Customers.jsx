import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Pencil,
  Trash2,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";
import "./Customers.css";
import api from "../../services/api";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Add / Edit Modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Customer Details & Bills History Modal (GET /api/bill/customer_id/{id})
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/customers");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setCustomers(response.data.data);
      } else {
        setError(response.data?.message || "Unable to load customers.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !query ||
        (c.name ?? "").toLowerCase().includes(query) ||
        (c.phone ?? "").toLowerCase().includes(query) ||
        (c.email ?? "").toLowerCase().includes(query) ||
        (c.address ?? "").toLowerCase().includes(query)
    );
  }, [customers, search]);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (customer, event) => {
    if (event) event.stopPropagation();
    setEditingId(customer.id);
    setForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
    });
    setFormError("");
    setShowForm(true);
  };

  const openCustomerHistory = async (customer) => {
    setSelectedCustomer(customer);
    setBillsLoading(true);
    try {
      const response = await api.get(`/api/bill/customer_id/${customer.id}`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        setCustomerBills(response.data.data);
      } else {
        setCustomerBills([]);
      }
    } catch {
      setCustomerBills([]);
    } finally {
      setBillsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name || !phone) {
      setFormError("Customer name and phone number are required.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      if (editingId !== null) {
        const response = await api.put("/api/customers", {
          id: editingId,
          name,
          phone,
          email: form.email.trim(),
          address: form.address.trim(),
        });
        if (response.data?.success) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === editingId ? response.data.data : c))
          );
          setShowForm(false);
        }
      } else {
        const response = await api.post("/api/customers", {
          name,
          phone,
          email: form.email.trim(),
          address: form.address.trim(),
        });
        if (response.data?.success) {
          setCustomers((prev) => [...prev, response.data.data]);
          setShowForm(false);
        }
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Unable to save customer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer, event) => {
    if (event) event.stopPropagation();
    try {
      const response = await api.delete(`/api/customers/${customer.id}`);
      if (response.data?.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cannot delete customer with existing bills."
      );
    }
  };

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <h1>Customers</h1>
          <p>Manage your shop's customers and view their purchase history.</p>
        </div>

        <div className="customers-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={fetchCustomers}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openAddForm}
          >
            <Plus size={16} />
            Add Customer
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

      <div className="customers-table-card">
        <div className="customers-toolbar">
          <div>
            <h3>Shop Customers ({filteredCustomers.length})</h3>
            <p>Click any customer to view all bills linked to them.</p>
          </div>

          <label className="customers-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>CUSTOMER NAME</th>
                <th>PHONE</th>
                <th>EMAIL</th>
                <th>ADDRESS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="customers-empty">
                    Loading customers...
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="customer-row"
                    onClick={() => openCustomerHistory(customer)}
                  >
                    <td>#{customer.id}</td>
                    <td>
                      <div className="customer-name-cell">
                        <div className="customer-avatar">
                          <Users size={16} />
                        </div>
                        <strong>{customer.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="customer-meta">
                        <Phone size={13} /> {customer.phone || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="customer-meta">
                        <Mail size={13} /> {customer.email || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="customer-meta">
                        <MapPin size={13} /> {customer.address || "—"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="customer-actions">
                        <button
                          type="button"
                          className="action-button view"
                          title="View purchase history"
                          onClick={() => openCustomerHistory(customer)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-button edit"
                          title="Edit customer"
                          onClick={(e) => openEditForm(customer, e)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-button delete"
                          title="Delete customer"
                          onClick={(e) => handleDelete(customer, e)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" className="customers-empty">
                    No customers found. Click "Add Customer" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showForm && (
        <div
          className="customer-modal-backdrop"
          onClick={() => setShowForm(false)}
        >
          <div
            className="customer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="customer-modal-header">
              <h2>{editingId ? "Edit Customer" : "Add Customer"}</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="customer-form" onSubmit={handleSubmit}>
              <label>
                Customer Name *
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </label>

              <label>
                Phone Number *
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. xxxxxxxxxx"
                  required
                />
              </label>

              <label>
                Email Address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="rahul@example.com"
                />
              </label>

              <label>
                Address
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="City / Street address"
                />
              </label>

              {formError && <p className="customer-form-error">{formError}</p>}

              <div className="customer-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {selectedCustomer && (
        <div
          className="customer-modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="customer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="customer-modal-header">
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>Phone: {selectedCustomer.phone}</p>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)}>
                <X size={18} />
              </button>
            </div>

            <h4 className="customer-bills-title">
              <ReceiptText size={15} /> Bills History ({customerBills.length})
            </h4>

            {billsLoading ? (
              <p className="customers-empty">Loading bills...</p>
            ) : customerBills.length === 0 ? (
              <p className="customers-empty">
                No bills created for this customer yet.
              </p>
            ) : (
              <ul className="customer-bills-list">
                {customerBills.map((b) => (
                  <li key={b.id}>
                    <span>
                      Bill #{b.id} ({b.items?.length || 0} items)
                    </span>
                    <strong>{formatCurrency(b.totalAmount)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
