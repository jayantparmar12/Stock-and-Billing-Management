
import { useState } from 'react';
import {
  Search,
  CreditCard,
  Wallet,
  Banknote,
  TrendingUp,
  Eye,
  X,
} from 'lucide-react';
import './Payments.css';

const initialPayments = [
  {
    id: 101,
    billId: 'BILL-0011',
    customer: 'Rahul Sharma',
    amount: 2250,
    method: 'UPI',
    status: 'COMPLETED',
    date: '2026-10-18',
  },
  {
    id: 102,
    billId: 'BILL-0012',
    customer: 'Priya Verma',
    amount: 1800,
    method: 'CASH',
    status: 'COMPLETED',
    date: '2026-10-18',
  },
  {
    id: 103,
    billId: 'BILL-0013',
    customer: 'Amit Patel',
    amount: 3200,
    method: 'CARD',
    status: 'PENDING',
    date: '2026-10-17',
  },
  {
    id: 104,
    billId: 'BILL-0014',
    customer: 'Neha Singh',
    amount: 950,
    method: 'BANK_TRANSFER',
    status: 'COMPLETED',
    date: '2026-10-16',
  },
  {
    id: 105,
    billId: 'BILL-0015',
    customer: 'Vikas Jain',
    amount: 1250,
    method: 'UPI',
    status: 'FAILED',
    date: '2026-10-15',
  },
];

const formatCurrency = (amount) =>
  `₹${amount.toLocaleString('en-IN')}`;

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

function Payments() {
  const [payments] = useState(initialPayments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      `${payment.billId} ${payment.customer} ${payment.id}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || payment.status === statusFilter;

    const matchesMethod =
      methodFilter === 'ALL' || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const completedPayments = payments.filter(
    (payment) => payment.status === 'COMPLETED'
  );

  const totalCollected = completedPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  const pendingAmount = payments
    .filter((payment) => payment.status === 'PENDING')
    .reduce((total, payment) => total + payment.amount, 0);

  const failedCount = payments.filter(
    (payment) => payment.status === 'FAILED'
  ).length;

  const getMethodIcon = (method) => {
    if (method === 'CASH') return <Banknote size={17} />;
    if (method === 'UPI') return <Wallet size={17} />;
    return <CreditCard size={17} />;
  };

  const getMethodLabel = (method) => {
    const labels = {
      CASH: 'Cash',
      UPI: 'UPI',
      CARD: 'Card',
      BANK_TRANSFER: 'Bank Transfer',
    };

    return labels[method] || method;
  };

  return (
    <div className="payments-page">
      <div className="payments-heading">
        <div>
          <h1>Payments</h1>
          <p>Track collections and review payment transactions.</p>
        </div>

        <div className="payments-heading-icon">
          <CreditCard size={22} />
        </div>
      </div>

      <div className="payments-stats">
        <div className="payments-stat-card">
          <div className="payments-stat-icon green">
            <Wallet size={22} />
          </div>
          <div>
            <p>Total Collected</p>
            <h2>{formatCurrency(totalCollected)}</h2>
            <span>Completed payments only</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon orange">
            <Banknote size={22} />
          </div>
          <div>
            <p>Pending Amount</p>
            <h2>{formatCurrency(pendingAmount)}</h2>
            <span>Awaiting payment</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon blue">
            <CreditCard size={22} />
          </div>
          <div>
            <p>Total Transactions</p>
            <h2>{payments.length}</h2>
            <span>All recorded payments</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon red">
            <TrendingUp size={22} />
          </div>
          <div>
            <p>Failed Payments</p>
            <h2>{failedCount}</h2>
            <span>Transactions that failed</span>
          </div>
        </div>
      </div>

      <div className="payments-table-card">
        <div className="payments-table-heading">
          <div>
            <h3>Payment Transactions</h3>
            <p>Search and filter your payment history.</p>
          </div>
        </div>

        <div className="payments-filters">
          <div className="payments-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search bill or customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            aria-label="Filter by payment method"
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>

        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="payment-transaction">
                      <strong>PAY-{payment.id}</strong>
                      <span>{payment.billId}</span>
                    </div>
                  </td>

                  <td>
                    <span className="payment-customer">
                      {payment.customer}
                    </span>
                  </td>

                  <td>
                    <span className="payment-method">
                      {getMethodIcon(payment.method)}
                      {getMethodLabel(payment.method)}
                    </span>
                  </td>

                  <td className="payment-date">
                    {formatDate(payment.date)}
                  </td>

                  <td className="payment-amount">
                    {formatCurrency(payment.amount)}
                  </td>

                  <td>
                    <span
                      className={`payment-status ${payment.status.toLowerCase()}`}
                    >
                      <span className="payment-status-dot" />
                      {payment.status === 'COMPLETED'
                        ? 'Completed'
                        : payment.status === 'PENDING'
                          ? 'Pending'
                          : 'Failed'}
                    </span>
                  </td>

                  <td>
                    <button
                      className="payment-view-btn"
                      title="View payment details"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="7" className="payments-empty">
                    No payments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-table-footer">
          Showing {filteredPayments.length} of {payments.length} transactions
        </div>
      </div>

      {selectedPayment && (
        <div
          className="payment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPayment(null);
            }
          }}
        >
          <div
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
            <div className="payment-modal-heading">
              <div>
                <h2 id="payment-modal-title">Payment Details</h2>
                <p>Transaction information</p>
              </div>

              <button
                className="payment-modal-close"
                aria-label="Close"
                onClick={() => setSelectedPayment(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="payment-detail-amount">
              <span>Payment Amount</span>
              <strong>{formatCurrency(selectedPayment.amount)}</strong>
              <span
                className={`payment-status ${selectedPayment.status.toLowerCase()}`}
              >
                <span className="payment-status-dot" />
                {selectedPayment.status}
              </span>
            </div>

            <div className="payment-detail-list">
              <div>
                <span>Transaction ID</span>
                <strong>PAY-{selectedPayment.id}</strong>
              </div>
              <div>
                <span>Bill Number</span>
                <strong>{selectedPayment.billId}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedPayment.customer}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{getMethodLabel(selectedPayment.method)}</strong>
              </div>
              <div>
                <span>Payment Date</span>
                <strong>{formatDate(selectedPayment.date)}</strong>
              </div>
            </div>

            <button
              className="payment-close-btn"
              onClick={() => setSelectedPayment(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
