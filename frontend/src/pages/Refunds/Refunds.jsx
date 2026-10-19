
import { useState } from 'react';
import {
  Search,
  RotateCcw,
  Wallet,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  X,
} from 'lucide-react';
import './Refunds.css';

const initialRefunds = [
  {
    id: 201,
    billId: 'BILL-0011',
    customer: 'Rahul Sharma',
    amount: 750,
    reason: 'Defective product',
    status: 'COMPLETED',
    date: '2026-10-18',
    method: 'UPI',
  },
  {
    id: 202,
    billId: 'BILL-0012',
    customer: 'Priya Verma',
    amount: 450,
    reason: 'Wrong item delivered',
    status: 'PENDING',
    date: '2026-10-18',
    method: 'CASH',
  },
  {
    id: 203,
    billId: 'BILL-0013',
    customer: 'Amit Patel',
    amount: 1200,
    reason: 'Product returned',
    status: 'COMPLETED',
    date: '2026-10-17',
    method: 'CARD',
  },
  {
    id: 204,
    billId: 'BILL-0014',
    customer: 'Neha Singh',
    amount: 300,
    reason: 'Damaged packaging',
    status: 'REJECTED',
    date: '2026-10-16',
    method: 'UPI',
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

function Refunds() {
  const [refunds] = useState(initialRefunds);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRefund, setSelectedRefund] = useState(null);

  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch =
      `${refund.id} ${refund.billId} ${refund.customer} ${refund.reason}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || refund.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const completedRefunds = refunds.filter(
    (refund) => refund.status === 'COMPLETED'
  );

  const totalRefunded = completedRefunds.reduce(
    (sum, refund) => sum + refund.amount,
    0
  );

  const pendingAmount = refunds
    .filter((refund) => refund.status === 'PENDING')
    .reduce((sum, refund) => sum + refund.amount, 0);

  const rejectedCount = refunds.filter(
    (refund) => refund.status === 'REJECTED'
  ).length;

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED') return <CheckCircle2 size={15} />;
    if (status === 'PENDING') return <Clock3 size={15} />;
    return <XCircle size={15} />;
  };

  const getStatusLabel = (status) => {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'PENDING') return 'Pending';
    return 'Rejected';
  };

  return (
    <div className="refunds-page">
      <div className="refunds-heading">
        <div>
          <h1>Refunds</h1>
          <p>Review returned products and customer refund records.</p>
        </div>

        <div className="refunds-heading-icon">
          <RotateCcw size={22} />
        </div>
      </div>

      <div className="refunds-stats">
        <div className="refund-stat-card">
          <div className="refund-stat-icon green">
            <Wallet size={22} />
          </div>
          <div>
            <p>Total Refunded</p>
            <h2>{formatCurrency(totalRefunded)}</h2>
            <span>Completed refunds only</span>
          </div>
        </div>

        <div className="refund-stat-card">
          <div className="refund-stat-icon orange">
            <Clock3 size={22} />
          </div>
          <div>
            <p>Pending Amount</p>
            <h2>{formatCurrency(pendingAmount)}</h2>
            <span>Awaiting processing</span>
          </div>
        </div>

        <div className="refund-stat-card">
          <div className="refund-stat-icon blue">
            <RotateCcw size={22} />
          </div>
          <div>
            <p>Total Requests</p>
            <h2>{refunds.length}</h2>
            <span>All refund records</span>
          </div>
        </div>

        <div className="refund-stat-card">
          <div className="refund-stat-icon red">
            <XCircle size={22} />
          </div>
          <div>
            <p>Rejected Requests</p>
            <h2>{rejectedCount}</h2>
            <span>Requests not approved</span>
          </div>
        </div>
      </div>

      <div className="refunds-table-card">
        <div className="refunds-table-heading">
          <div>
            <h3>Refund History</h3>
            <p>Search refund records and review their status.</p>
          </div>
        </div>

        <div className="refunds-filters">
          <div className="refunds-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search bill, customer or reason..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            aria-label="Filter refunds by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="refunds-table-wrapper">
          <table className="refunds-table">
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Customer / Bill</th>
                <th>Reason</th>
                <th>Method</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredRefunds.map((refund) => (
                <tr key={refund.id}>
                  <td>
                    <strong className="refund-id">
                      REF-{refund.id}
                    </strong>
                  </td>

                  <td>
                    <div className="refund-customer-cell">
                      <strong>{refund.customer}</strong>
                      <span>{refund.billId}</span>
                    </div>
                  </td>

                  <td>
                    <span className="refund-reason">
                      {refund.reason}
                    </span>
                  </td>

                  <td>
                    <span className="refund-method">
                      {refund.method.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="refund-date">
                    {formatDate(refund.date)}
                  </td>

                  <td className="refund-amount">
                    {formatCurrency(refund.amount)}
                  </td>

                  <td>
                    <span
                      className={`refund-status ${refund.status.toLowerCase()}`}
                    >
                      {getStatusIcon(refund.status)}
                      {getStatusLabel(refund.status)}
                    </span>
                  </td>

                  <td>
                    <button
                      className="refund-view-btn"
                      title="View refund details"
                      onClick={() => setSelectedRefund(refund)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRefunds.length === 0 && (
                <tr>
                  <td colSpan="8" className="refunds-empty">
                    No refund records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="refunds-table-footer">
          Showing {filteredRefunds.length} of {refunds.length} refund records
        </div>
      </div>

      {selectedRefund && (
        <div
          className="refund-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRefund(null);
            }
          }}
        >
          <div
            className="refund-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-modal-title"
          >
            <div className="refund-modal-heading">
              <div>
                <h2 id="refund-modal-title">Refund Details</h2>
                <p>Refund request information</p>
              </div>

              <button
                className="refund-modal-close"
                aria-label="Close"
                onClick={() => setSelectedRefund(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="refund-detail-amount">
              <span>Refund Amount</span>
              <strong>{formatCurrency(selectedRefund.amount)}</strong>
              <span
                className={`refund-status ${selectedRefund.status.toLowerCase()}`}
              >
                {getStatusIcon(selectedRefund.status)}
                {getStatusLabel(selectedRefund.status)}
              </span>
            </div>

            <div className="refund-detail-list">
              <div>
                <span>Refund ID</span>
                <strong>REF-{selectedRefund.id}</strong>
              </div>
              <div>
                <span>Bill Number</span>
                <strong>{selectedRefund.billId}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedRefund.customer}</strong>
              </div>
              <div>
                <span>Reason</span>
                <strong>{selectedRefund.reason}</strong>
              </div>
              <div>
                <span>Refund Method</span>
                <strong>{selectedRefund.method.replace('_', ' ')}</strong>
              </div>
              <div>
                <span>Request Date</span>
                <strong>{formatDate(selectedRefund.date)}</strong>
              </div>
            </div>

            <button
              className="refund-close-btn"
              onClick={() => setSelectedRefund(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Refunds;
