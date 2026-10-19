
import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  ReceiptText,
  ShoppingCart,
  UserRound,
  Search,
  CheckCircle2,
} from 'lucide-react';
import './Billing.css';

const customers = [
  { id: 1, name: 'Rahul Sharma', phone: '9876543210' },
  { id: 2, name: 'Priya Verma', phone: '9876501234' },
  { id: 3, name: 'Amit Patel', phone: '9123456780' },
];

const products = [
  { id: 1, name: 'Wireless Mouse', price: 750, stock: 25 },
  { id: 2, name: 'Mechanical Keyboard', price: 1800, stock: 12 },
  { id: 3, name: 'USB Cable', price: 250, stock: 40 },
  { id: 4, name: 'Laptop Stand', price: 1200, stock: 8 },
  { id: 5, name: 'Headphones', price: 1500, stock: 15 },
];

function Billing() {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [successMessage, setSuccessMessage] = useState('');

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const discountAmount = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const total = subtotal - discountAmount;

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (product) => {
    setSuccessMessage('');

    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          return previous;
        }

        return previous.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (product.stock < 1) return previous;

      return [...previous, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, value) => {
    const quantity = Number(value);
    const product = products.find((item) => item.id === productId);

    if (!product || !Number.isInteger(quantity)) return;

    if (quantity < 1) {
      setCart((previous) =>
        previous.filter((item) => item.id !== productId)
      );
      return;
    }

    if (quantity > product.stock) return;

    setCart((previous) =>
      previous.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeProduct = (productId) => {
    setCart((previous) =>
      previous.filter((item) => item.id !== productId)
    );
  };

  const createBill = (event) => {
    event.preventDefault();

    if (!selectedCustomer) {
      alert('Please select a customer.');
      return;
    }

    if (cart.length === 0) {
      alert('Please add at least one product.');
      return;
    }

    const bill = {
      billNumber: `BILL-${Date.now().toString().slice(-6)}`,
      customerId: Number(selectedCustomer),
      items: cart.map(({ id, quantity }) => ({
        productId: id,
        quantity,
      })),
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    console.log('Demo bill:', bill);

    setSuccessMessage(
      `Demo bill ${bill.billNumber} created. Total: ₹${total.toLocaleString('en-IN')}`
    );

    setCart([]);
    setDiscount(0);
    setSelectedCustomer('');
    setSearch('');
  };

  return (
    <div className="billing-page">
      <div className="billing-heading">
        <div>
          <h1>Create Bill</h1>
          <p>Select a customer and add products to generate a bill.</p>
        </div>

        <div className="billing-heading-icon">
          <ReceiptText size={22} />
        </div>
      </div>

      {successMessage && (
        <div className="billing-success">
          <CheckCircle2 size={19} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')}>Dismiss</button>
        </div>
      )}

      <form className="billing-layout" onSubmit={createBill}>
        <div className="billing-main-column">
          <section className="billing-card">
            <div className="billing-section-heading">
              <div className="billing-step-number">1</div>
              <div>
                <h3>Select Customer</h3>
                <p>Choose the customer for this bill.</p>
              </div>
            </div>

            <label className="billing-label" htmlFor="billing-customer">
              Customer
            </label>

            <div className="billing-select-wrapper">
              <UserRound size={18} />
              <select
                id="billing-customer"
                value={selectedCustomer}
                onChange={(event) => setSelectedCustomer(event.target.value)}
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="billing-card">
            <div className="billing-section-heading">
              <div className="billing-step-number">2</div>
              <div>
                <h3>Add Products</h3>
                <p>Choose products to include in the bill.</p>
              </div>
            </div>

            <div className="billing-product-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="billing-product-list">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((item) => item.id === product.id);
                const unavailable =
                  product.stock === 0 ||
                  (cartItem && cartItem.quantity >= product.stock);

                return (
                  <div className="billing-product-row" key={product.id}>
                    <div className="billing-product-icon">
                      <ShoppingCart size={19} />
                    </div>

                    <div className="billing-product-details">
                      <strong>{product.name}</strong>
                      <span>{product.stock} units available</span>
                    </div>

                    <div className="billing-product-price">
                      ₹{product.price.toLocaleString('en-IN')}
                    </div>

                    <button
                      type="button"
                      className="billing-add-btn"
                      disabled={Boolean(unavailable)}
                      onClick={() => addProduct(product)}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="billing-no-products">
                  No matching products found.
                </div>
              )}
            </div>
          </section>

          <section className="billing-card">
            <div className="billing-section-heading">
              <div className="billing-step-number">3</div>
              <div>
                <h3>Bill Items</h3>
                <p>Review products and update quantities.</p>
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="billing-empty-cart">
                <ShoppingCart size={30} />
                <strong>Your bill is empty</strong>
                <span>Add products from the section above.</span>
              </div>
            ) : (
              <div className="billing-cart-wrapper">
                <table className="billing-cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>₹{item.price.toLocaleString('en-IN')}</td>
                        <td>
                          <input
                            className="billing-quantity-input"
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item.id, event.target.value)
                            }
                            aria-label={`Quantity for ${item.name}`}
                          />
                        </td>
                        <td className="billing-line-total">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="billing-remove-btn"
                            title="Remove product"
                            onClick={() => removeProduct(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="billing-summary-card">
          <div className="billing-summary-heading">
            <ReceiptText size={20} />
            <h3>Bill Summary</h3>
          </div>

          <div className="billing-summary-row">
            <span>Total Items</span>
            <strong>
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </strong>
          </div>

          <div className="billing-summary-row">
            <span>Subtotal</span>
            <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
          </div>

          <div className="billing-discount-field">
            <label htmlFor="billing-discount">Discount (₹)</label>
            <input
              id="billing-discount"
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </div>

          <div className="billing-summary-divider" />

          <div className="billing-grand-total">
            <span>Grand Total</span>
            <strong>₹{total.toLocaleString('en-IN')}</strong>
          </div>

          <div className="billing-payment-field">
            <label htmlFor="billing-payment">Payment Method</label>
            <select
              id="billing-payment"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <button type="submit" className="billing-create-btn">
            <ReceiptText size={18} />
            Create Bill
          </button>

          <p className="billing-summary-note">
            This demo does not save a bill to your backend.
          </p>
        </aside>
      </form>
    </div>
  );
}

export default Billing;
