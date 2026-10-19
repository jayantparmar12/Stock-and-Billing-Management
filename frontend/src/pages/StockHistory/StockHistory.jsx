
import React, { useMemo, useState } from 'react';
import {
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  TrendingUp,
  TrendingDown,
  Package,
  CalendarDays,
  Eye,
  X,
} from 'lucide-react';
import './StockHistory.css';

const initialHistory = [
  {
    id: 1,
    product: 'Wireless Mouse',
    sku: 'PRD-001',
    type: 'IN',
    quantity: 50,
    previousStock: 20,
    currentStock: 70,
    reason: 'New stock received',
    reference: 'PO-1024',
    date: '2026-10-18 10:30',
    performedBy: 'Admin',
  },
  {
    id: 2,
    product: 'Mechanical Keyboard',
    sku: 'PRD-002',
    type: 'OUT',
    quantity: 5,
    previousStock: 25,
    currentStock: 20,
    reason: 'Customer billing',
    reference: 'BILL-1042',
    date: '2026-10-18 11:15',
    performedBy: 'Admin',
  },
  {
    id: 3,
    product: 'USB-C Hub',
    sku: 'PRD-003',
    type: 'IN',
    quantity: 20,
    previousStock: 10,
    currentStock: 30,
    reason: 'Supplier delivery',
    reference: 'PO-1025',
    date: '2026-10-17 14:20',
    performedBy: 'Manager',
  },
  {
    id: 4,
    product: 'Laptop Stand',
    sku: 'PRD-004',
    type: 'OUT',
    quantity: 3,
    previousStock: 18,
    currentStock: 15,
    reason: 'Customer billing',
    reference: 'BILL-1039',
    date: '2026-10-17 16:45',
    performedBy: 'Admin',
  },
  {
    id: 5,
    product: 'Wireless Mouse',
    sku: 'PRD-001',
    type: 'OUT',
    quantity: 8,
    previousStock: 28,
    currentStock: 20,
    reason: 'Damaged items',
    reference: 'ADJ-001',
    date: '2026-10-16 09:10',
    performedBy: 'Manager',
  },
  {
    id: 6,
    product: 'Monitor 24-inch',
    sku: 'PRD-005',
    type: 'IN',
    quantity: 12,
    previousStock: 8,
    currentStock: 20,
    reason: 'New stock received',
    reference: 'PO-1021',
    date: '2026-10-15 12:00',
    performedBy: 'Admin',
  },
];

function formatDate(dateString) {
  const [date, time] = dateString.split(' ');
  const parsedDate = new Date(`${date}T${time}`);

  return parsedDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StockHistory() {
  const [history] = useState(initialHistory);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const stats = useMemo(() => {
    const stockIn = history
      .filter((item) => item.type === 'IN')
      .reduce((total, item) => total + item.quantity, 0);

    const stockOut = history
      .filter((item) => item.type === 'OUT')
      .reduce((total, item) => total + item.quantity, 0);

    return {
      totalTransactions: history.length,
      stockIn,
      stockOut,
      netChange: stockIn - stockOut,
    };
  }, [history]);

  const filteredHistory = history.filter((item) => {
    const query = search.toLowerCase();

    const matchesSearch =
      item.product.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.reference.toLowerCase().includes(query) ||
      item.performedBy.toLowerCase().includes(query);

    const matchesType =
      typeFilter === 'ALL' || item.type === typeFilter;

    const matchesReason =
      reasonFilter === 'ALL' || item.reason === reasonFilter;

    return matchesSearch && matchesType && matchesReason;
  });

  return (
    <div className="stock-history-page">
      <div className="stock-history-heading">
        <div>
          <h1>Stock History</h1>
          <p>Track every stock movement in your inventory.</p>
        </div>

        <div className="history-heading-icon">
          <History size={22} />
        </div>
      </div>

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon total">
            <History size={21} />
          </div>
          <div>
            <p>Total Transactions</p>
            <h2>{stats.totalTransactions}</h2>
            <span>Recorded movements</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon stock-in">
            <ArrowDownToLine size={21} />
          </div>
          <div>
            <p>Total Stock In</p>
            <h2>{stats.stockIn}</h2>
            <span>Units added</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon stock-out">
            <ArrowUpFromLine size={21} />
          </div>
          <div>
            <p>Total Stock Out</p>
            <h2>{stats.stockOut}</h2>
            <span>Units removed</span>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon net-change">
            {stats.netChange >= 0 ? (
              <TrendingUp size={21} />
            ) : (
              <TrendingDown size={21} />
            )}
          </div>
          <div>
            <p>Net Stock Change</p>
            <h2>
              {stats.netChange > 0 ? '+' : ''}
              {stats.netChange}
            </h2>
            <span>Net units changed</span>
          </div>
        </div>
      </div>

      <div className="history-table-card">
        <div className="history-table-header">
          <div>
            <h2>Movement Records</h2>
            <p>Review stock additions and deductions.</p>
          </div>

          <span className="history-record-count">
            {filteredHistory.length} records
          </span>
        </div>

        <div className="history-filters">
          <div className="history-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search product, SKU, reference..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by movement type"
          >
            <option value="ALL">All movements</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(event) => setReasonFilter(event.target.value)}
            aria-label="Filter by reason"
          >
            <option value="ALL">All reasons</option>
            <option value="New stock received">New stock received</option>
            <option value="Supplier delivery">Supplier delivery</option>
            <option value="Customer billing">Customer billing</option>
            <option value="Damaged items">Damaged items</option>
          </select>
        </div>

        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Movement</th>
                <th>Quantity</th>
                <th>Stock Change</th>
                <th>Reason</th>
                <th>Date & Time</th>
                <th>Reference</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="history-product-cell">
                      <div className="history-product-icon">
                        <Package size={19} />
                      </div>
                      <div>
                        <strong>{item.product}</strong>
                        <span>{item.sku}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`movement-badge ${
                        item.type === 'IN' ? 'movement-in' : 'movement-out'
                      }`}
                    >
                      {item.type === 'IN' ? (
                        <ArrowDownToLine size={14} />
                      ) : (
                        <ArrowUpFromLine size={14} />
                      )}
                      {item.type === 'IN' ? 'Stock In' : 'Stock Out'}
                    </span>
                  </td>

                  <td>
                    <strong
                      className={
                        item.type === 'IN'
                          ? 'quantity-positive'
                          : 'quantity-negative'
                      }
                    >
                      {item.type === 'IN' ? '+' : '-'}
                      {item.quantity}
                    </strong>
                  </td>

                  <td>
                    <div className="stock-change-cell">
                      <span>{item.previousStock}</span>
                      <span className="stock-change-arrow">→</span>
                      <strong>{item.currentStock}</strong>
                    </div>
                  </td>

                  <td>
                    <span className="history-reason">{item.reason}</span>
                  </td>

                  <td>
                    <div className="history-date-cell">
                      <CalendarDays size={15} />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </td>

                  <td>
                    <span className="history-reference">{item.reference}</span>
                  </td>

                  <td>
                    <button
                      className="history-view-button"
                      title="View details"
                      aria-label={`View ${item.product} movement details`}
                      onClick={() => setSelectedRecord(item)}
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="history-empty-state">
                      <History size={30} />
                      <strong>No stock movements found</strong>
                      <span>Try changing your search or filters.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="history-table-footer">
          Showing {filteredHistory.length} of {history.length} records
        </div>
      </div>

      {selectedRecord && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="history-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <h2>Movement Details</h2>
                <p>Reference: {selectedRecord.reference}</p>
              </div>

              <button
                className="history-modal-close"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="history-detail-product">
              <div className="history-product-icon large">
                <Package size={24} />
              </div>
              <div>
                <h3>{selectedRecord.product}</h3>
                <p>{selectedRecord.sku}</p>
              </div>
              <span
                className={`movement-badge ${
                  selectedRecord.type === 'IN'
                    ? 'movement-in'
                    : 'movement-out'
                }`}
              >
                {selectedRecord.type === 'IN' ? 'Stock In' : 'Stock Out'}
              </span>
            </div>

            <div className="history-detail-grid">
              <div>
                <span>Quantity Changed</span>
                <strong>
                  {selectedRecord.type === 'IN' ? '+' : '-'}
                  {selectedRecord.quantity} units
                </strong>
              </div>

              <div>
                <span>Previous Stock</span>
                <strong>{selectedRecord.previousStock} units</strong>
              </div>

              <div>
                <span>Current Stock</span>
                <strong>{selectedRecord.currentStock} units</strong>
              </div>

              <div>
                <span>Reason</span>
                <strong>{selectedRecord.reason}</strong>
              </div>

              <div>
                <span>Performed By</span>
                <strong>{selectedRecord.performedBy}</strong>
              </div>

              <div>
                <span>Date & Time</span>
                <strong>{formatDate(selectedRecord.date)}</strong>
              </div>
            </div>

            <button
              className="history-modal-done"
              onClick={() => setSelectedRecord(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockHistory;
