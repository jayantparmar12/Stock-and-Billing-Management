
import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Users,
  UserRound,
  Pencil,
  Trash2,
  X,
  MapPin,
  Mail,
  Phone,
  AlertTriangle
} from 'lucide-react';
import './Customers.css';
import api from '../../services/api'

const initialCustomers = [
  {
    id: 1,
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9876543210',
    address: 'Indore, Madhya Pradesh',
  },
  {
    id: 2,
    name: 'Priya Verma',
    email: 'priya@example.com',
    phone: '9876501234',
    address: 'Bhopal, Madhya Pradesh',
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit@example.com',
    phone: '9123456780',
    address: 'Gwalior, Madhya Pradesh',
  },
  {
    id: 4,
    name: 'Neha Singh',
    email: 'neha@example.com',
    phone: '9988776655',
    address: 'Jabalpur, Madhya Pradesh',
  },
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

function Customers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers')
      if (response.data.success) {
        console.log(response)
        setCustomers(response.data.data)
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
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.phone} ${customer.address}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
    setShowModal(true);
  };

  const handleChange = async (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const value = form.phone

    if(!/^\d{0,10}$/.test(value)){
        setFormError("Please enter 10-digit valid phone number")
        return;
      }

    if (editingId !== null) {
      try {
        const response = await api.put(`/api/customers/${editingId}`, form)
        if (response.data.success) {
          setCustomers((prev) =>
            prev.map(customer => customer.id == editingId ? response.data.data : customer)
          )
        }
        else{
          setError(
            response.data.message
          )
        }
      }
      catch (err) {
        setError(
          err.response.data.message
        )
      }
    } else {
      try {
        const newCustomer = {
          ...form
        };
        const response = await api.post('/api/customers', newCustomer)
        if (response.data.success) {
          setCustomers((prev) => [...prev, response.data.data])
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
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this customer?'
    );

    if (confirmed) {
      try{
        const response = await api.delete(`/api/customers/${id}`)
        if(response.data.success){
          setCustomers((prev)=>
            prev.filter((customer)=> customer.id !== id)
          )
        }
        else{
          setError(
            response.data.message
          )
        }
      }
      catch(err){
        setError(
          err.response.data.message
        )
      }
    }
  };

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <h1>Customers</h1>
          <p>Manage your customer information and contact details.</p>
        </div>

        <button className="customer-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Customer
        </button>
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

      <div className="customer-stats">
        <div className="customer-stat-card">
          <div className="customer-stat-icon blue">
            <Users size={22} />
          </div>
          <div>
            <p>Total Customers</p>
            <h2>{customers.length}</h2>
            <span>Customers in your records</span>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="customer-stat-icon purple">
            <UserRound size={22} />
          </div>
          <div>
            <p>Customer Records</p>
            <h2>{filteredCustomers.length}</h2>
            <span>Matching current search</span>
          </div>
        </div>
      </div>

      <div className="customers-table-card">
        <div className="customers-table-header">
          <div>
            <h3>All Customers</h3>
            <p>View and manage your customers.</p>
          </div>

          <div className="customer-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customers, contact, address..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="customers-table-wrapper">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Customer ID</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-name-cell">
                      <div className="customer-avatar">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.email || 'No email added'}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="customer-contact-cell">
                      <span>
                        <Phone size={14} />
                        {customer.phone || 'Not provided'}
                      </span>
                      <span>
                        <Mail size={14} />
                        {customer.email || 'Not provided'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="customer-address">
                      <MapPin size={15} />
                      {customer.address || 'Not provided'}
                    </span>
                  </td>

                  <td>
                    <span className="customer-id">CUS-{customer.id}</span>
                  </td>

                  <td>
                    <div className="customer-actions">
                      <button
                        className="customer-edit-btn"
                        title="Edit customer"
                        onClick={() => openEditModal(customer)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="customer-delete-btn"
                        title="Delete customer"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5" className="customers-empty">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="customers-table-footer">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {showModal && (
        <div
          className="customer-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
          >
            <div className="customer-modal-header">
              <div>
                <h2 id="customer-modal-title">
                  {editingId !== null ? 'Edit Customer' : 'Add Customer'}
                </h2>
                <p>
                  Enter the customer's details below.
                </p>
              </div>

              <button
                className="customer-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-group">
                <label htmlFor="customer-name">Full Name *</label>
                <input
                  id="customer-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="customer-form-group">
                <label htmlFor="customer-email">Email</label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="customer-form-group">
                <label htmlFor="customer-phone">Phone Number *</label>
                <input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="customer-form-group">
                <label htmlFor="customer-address">Address</label>
                <textarea
                  id="customer-address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter customer address"
                  rows="3"
                />
              </div>

               {formError && (
                <p className="product-form-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="customer-modal-actions">
                <button
                  type="button"
                  className="customer-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="customer-primary-btn">
                  {editingId !== null ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
