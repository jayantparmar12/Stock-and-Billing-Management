import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  CheckCircle2,
  ReceiptText,
  IndianRupee,
  Eye,
  X,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import "./Refunds.css";
import api from "../../services/api";

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeRefund(raw, fallbackBill) {
  const billObj = raw.bill || fallbackBill || {};
  const customerObj = billObj.customer || {};

  const refundId = raw.id ?? 0;
  const billId = billObj.id ?? 0;
  const amount = Number(raw.amount ?? 0);
  const billTotal = Number(billObj.totalAmount ?? amount);

  return {
    id: refundId,
    refundCode: `REF-${String(refundId).padStart(4, "0")}`,
    billId,
    billCode: `BILL-${String(billId).padStart(4, "0")}`,
    customerName:
      customerObj.name ??
      customerObj.customerName ??
      (billId ? `Customer (Bill #${billId})` : "Walk-in Customer"),
    customerContact:
      customerObj.phone ??
      customerObj.mobile ??
      customerObj.phoneNumber ??
      customerObj.email ??
      "",
    amount,
    billTotal,
    isFullRefund: amount >= billTotal && billTotal > 0,
    refundDate: raw.refundDate ?? raw.createdAt ?? billObj.billDate ?? null,
    reason: "Bill Cancelled",
    status: "Completed",
    items: Array.isArray(billObj.items) ? billObj.items : [],
  };
}

export default function Refunds() {
  const [bills, setBills] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [billFilter, setBillFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | FULL | PARTIAL

  // Modal State
  const [selectedRefund, setSelectedRefund] = useState(null);

  // Fetch all bills from GET /api/bill, then fetch each bill's refunds via GET /api/bill/{id}/refunds
  const fetchAllRefunds = useCallback(async (selectedBillId = "ALL") => {
    try {
      setLoading(true);
      setError("");

      const billsRes = await api.get("/api/bill");
      if (!billsRes.data?.success || !Array.isArray(billsRes.data.data)) {
        setError(billsRes.data?.message || "Unable to load bills for refunds.");
        setLoading(false);
        return;
      }

      const allBills = billsRes.data.data;
      setBills(allBills);

      const targetBills =
        selectedBillId === "ALL"
          ? allBills
          : allBills.filter((b) => String(b.id) === String(selectedBillId));

      const refundResponses = await Promise.allSettled(
        targetBills.map((bill) =>
          api
            .get(`/api/bill/${bill.id}/refunds`)
            .then((res) => ({ bill, data: res.data }))
        )
      );

      const collectedRefunds = [];
      refundResponses.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.data?.success &&
          Array.isArray(result.value.data.data)
        ) {
          const { bill, data } = result.value;
          data.data.forEach((entry) => {
            collectedRefunds.push(normalizeRefund(entry, bill));
          });
        }
      });

      // Sort newest first by refundDate (and id descending)
      collectedRefunds.sort((a, b) => {
        const timeA = a.refundDate ? new Date(a.refundDate).getTime() : 0;
        const timeB = b.refundDate ? new Date(b.refundDate).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      });

      setRefunds(collectedRefunds);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to connect to backend to load refunds."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRefunds("ALL");
  }, [fetchAllRefunds]);

  const handleBillFilterChange = (value) => {
    setBillFilter(value);
    fetchAllRefunds(value);
  };

  // Filtered Refunds
  const filteredRefunds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return refunds.filter((item) => {
      const matchesSearch =
        !query ||
        item.refundCode.toLowerCase().includes(query) ||
        item.billCode.toLowerCase().includes(query) ||
        String(item.id).includes(query) ||
        String(item.billId).includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.customerContact.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "FULL" && item.isFullRefund) ||
        (typeFilter === "PARTIAL" && !item.isFullRefund);

      return matchesSearch && matchesType;
    });
  }, [refunds, search, typeFilter]);

  // Summary Stats
  const stats = useMemo(() => {
    const totalRefundedAmount = filteredRefunds.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const fullRefundCount = filteredRefunds.filter(
      (item) => item.isFullRefund
    ).length;
    const partialRefundCount = filteredRefunds.filter(
      (item) => !item.isFullRefund
    ).length;
    const avgRefund =
      filteredRefunds.length > 0
        ? totalRefundedAmount / filteredRefunds.length
        : 0;

    return {
      totalCount: filteredRefunds.length,
      totalRefundedAmount,
      fullRefundCount,
      partialRefundCount,
      avgRefund,
    };
  }, [filteredRefunds]);

  return (
    <div className="refunds-page">
      <div className="refunds-heading">
        <div>
          <h1>Refunds</h1>
          <p>
            Track all customer refunds generated from cancelled bills.
          </p>
        </div>

        <div className="refunds-heading-actions">
          <button
            type="button"
            className="refunds-refresh-btn"
            onClick={() => fetchAllRefunds(billFilter)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>

          <div className="refunds-heading-icon">
            <RotateCcw size={22} />
          </div>
        </div>
      </div>

      {error && (
        <div className="refunds-error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="refunds-stats">
        <div className="refund-stat-card">
          <div className="refund-stat-icon blue">
            <RotateCcw size={20} />
          </div>
          <div>
            <p>Total Refunds</p>
            <h2>{stats.totalCount}</h2>
            <span>Processed refund records</span>
          </div>
        </div>

        <div className="refund-stat-card">
          <div className="refund-stat-icon green">
            <IndianRupee size={20} />
          </div>
          <div>
            <p>Total Refunded Amount</p>
            <h2>{formatCurrency(stats.totalRefundedAmount)}</h2>
            <span>Returned on cancelled bills</span>
          </div>
        </div>

        <div className="refund-stat-card">
          <div className="refund-stat-icon orange">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p>Full vs Partial Refunds</p>
            <h2>
              {stats.fullRefundCount} Full / {stats.partialRefundCount} Partial
            </h2>
            <span>Based on paid amount vs bill total</span>
          </div>
        </div>

        <div className="refund-stat-card">
          <div className="refund-stat-icon red">
            <ReceiptText size={20} />
          </div>
          <div>
            <p>Average Refund</p>
            <h2>{formatCurrency(stats.avgRefund)}</h2>
            <span>Per cancelled paid bill</span>
          </div>
        </div>
      </div>

      <div className="refunds-table-card">
        <div className="refunds-table-heading">
          <div>
            <h3>Refund History</h3>
            <p>
              When a paid or partially paid bill is cancelled, its paid amount
              is automatically refunded here.
            </p>
          </div>
          <span className="refunds-count-badge">
            {filteredRefunds.length} records
          </span>
        </div>

        <div className="refunds-filters">
          <div className="refunds-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search by Refund ID, Bill ID, or customer name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={billFilter}
            onChange={(event) => handleBillFilterChange(event.target.value)}
            aria-label="Filter refunds by bill"
          >
            <option value="ALL">All Bills ({bills.length})</option>
            {bills.map((bill) => (
              <option key={bill.id} value={String(bill.id)}>
                Bill #{bill.id} — {bill.customer?.name || "Customer"}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by refund coverage"
          >
            <option value="ALL">All Refund Types</option>
            <option value="FULL">Full Bill Refund</option>
            <option value="PARTIAL">Partial Paid Refund</option>
          </select>
        </div>

        <div className="refunds-table-wrapper">
          <table className="refunds-table">
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Bill ID</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Refund Type</th>
                <th>Refund Date</th>
                <th>Refund Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="refunds-empty">
                    Loading refund records...
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((item) => (
                  <tr
                    key={item.id}
                    className="refund-row"
                    onClick={() => setSelectedRefund(item)}
                  >
                    <td>
                      <strong className="refund-id">{item.refundCode}</strong>
                    </td>

                    <td>
                      <span className="refund-method">{item.billCode}</span>
                    </td>

                    <td>
                      <div className="refund-customer-cell">
                        <strong>{item.customerName}</strong>
                        {item.customerContact && (
                          <span>{item.customerContact}</span>
                        )}
                      </div>
                    </td>

                    <td className="refund-reason">{item.reason}</td>

                    <td>
                      <span className="refund-method">
                        {item.isFullRefund ? "Full Refund" : "Partial Paid"}
                      </span>
                    </td>

                    <td className="refund-date">
                      <span className="refund-date-inline">
                        <Calendar size={13} />
                        {formatDateTime(item.refundDate)}
                      </span>
                    </td>

                    <td className="refund-amount">
                      {formatCurrency(item.amount)}
                    </td>

                    <td>
                      <span className="refund-status completed">
                        <CheckCircle2 size={13} />
                        {item.status}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="refund-view-btn"
                        title="View refund details"
                        onClick={() => setSelectedRefund(item)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {!loading && filteredRefunds.length === 0 && (
                <tr>
                  <td colSpan="9" className="refunds-empty">
                    No refunds found. Refunds are created automatically when a
                    bill with a paid amount &gt; ₹0 is cancelled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="refunds-table-footer">
          Showing {filteredRefunds.length} of {refunds.length} total refund
          records
        </div>
      </div>

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div
          className="refund-modal-overlay"
          onClick={() => setSelectedRefund(null)}
        >
          <div
            className="refund-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="refund-modal-heading">
              <div>
                <h2>Refund Details</h2>
                <p>
                  {selectedRefund.refundCode} • Linked to{" "}
                  {selectedRefund.billCode}
                </p>
              </div>

              <button
                type="button"
                className="refund-modal-close"
                onClick={() => setSelectedRefund(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="refund-detail-amount">
              <span>Refunded Amount</span>
              <strong>{formatCurrency(selectedRefund.amount)}</strong>
              <span className="refund-status completed">
                <CheckCircle2 size={13} />
                Refund Completed
              </span>
            </div>

            <div className="refund-detail-list">
              <div>
                <span>Refund ID</span>
                <strong>#{selectedRefund.id}</strong>
              </div>
              <div>
                <span>Bill ID</span>
                <strong>#{selectedRefund.billId}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedRefund.customerName}</strong>
              </div>
              {selectedRefund.customerContact && (
                <div>
                  <span>Customer Contact</span>
                  <strong>{selectedRefund.customerContact}</strong>
                </div>
              )}
              <div>
                <span>Original Bill Total</span>
                <strong>{formatCurrency(selectedRefund.billTotal)}</strong>
              </div>
              <div>
                <span>Refund Date & Time</span>
                <strong>{formatDateTime(selectedRefund.refundDate)}</strong>
              </div>
              <div>
                <span>Reason</span>
                <strong>{selectedRefund.reason}</strong>
              </div>
            </div>

            {selectedRefund.items.length > 0 && (
              <div className="refund-items-box">
                <h4>Cancelled Bill Items ({selectedRefund.items.length})</h4>
                <ul>
                  {selectedRefund.items.map((item, idx) => (
                    <li key={idx}>
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <strong>{formatCurrency(item.itemTotal)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              className="refund-close-btn"
              onClick={() => setSelectedRefund(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}