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

function getRefundErrorMessage(err, fallback) {
  if (err?.response?.status === 403) {
    return "Access Denied: You do not have permission to view refunds.";
  }
  if (err?.response?.status === 401) {
    return "Session expired. Please sign in again.";
  }
  if (typeof err?.response?.data === "string" && err.response.data.trim()) {
    return err.response.data;
  }
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
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
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modal State
  const [selectedRefund, setSelectedRefund] = useState(null);

  const fetchAllRefunds = useCallback(async (selectedBillId = "ALL") => {
    try {
      setLoading(true);
      setError("");

      const [billsRes, directRefundsRes] = await Promise.allSettled([
        api.get("/api/bill"),
        selectedBillId === "ALL"
          ? api.get("/api/refunds")
          : api.get(`/api/bill/${selectedBillId}/refunds`),
      ]);

        if (billsRes.status === "rejected" && directRefundsRes.status === "rejected") {
        setError(
          getRefundErrorMessage(
            billsRes.reason || directRefundsRes.reason,
            "Unable to load refunds from backend."
          )
        );
      } else if (
        directRefundsRes.status === "fulfilled" &&
        directRefundsRes.value.data &&
        !directRefundsRes.value.data.success
      ) {
        setError(
          directRefundsRes.value.data.message || "Unable to load refunds."
        );
      }

      const allBills =
        billsRes.status === "fulfilled" &&
        billsRes.value.data?.success &&
        Array.isArray(billsRes.value.data.data)
          ? billsRes.value.data.data
          : [];
      setBills(allBills);

      const billMap = new Map();
      allBills.forEach((b) => billMap.set(b.id, b));

      let collectedRefunds = [];

      if (
        directRefundsRes.status === "fulfilled" &&
        directRefundsRes.value.data?.success &&
        Array.isArray(directRefundsRes.value.data.data)
      ) {
        collectedRefunds = directRefundsRes.value.data.data.map((entry) =>
          normalizeRefund(entry, billMap.get(entry.bill?.id))
        );
      } else {
        // Fallback: fetch per-bill via /api/bill/{id}/refunds
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
      }

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

  const filteredRefunds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return refunds.filter((item) => {
      const matchesSearch =
        !query ||
        item.refundCode.toLowerCase().includes(query) ||
        item.billCode.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.customerContact.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "FULL" && item.isFullRefund) ||
        (typeFilter === "PARTIAL" && !item.isFullRefund);

      return matchesSearch && matchesType;
    });
  }, [refunds, search, typeFilter]);

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
          <p>Track all customer refunds generated from cancelled bills.</p>
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
                    No refunds found for your shop.
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
