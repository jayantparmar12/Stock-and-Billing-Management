import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  ReceiptText,
  RotateCcw,
  Eye,
  Plus,
  X,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import "./Payments.css";
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

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

export default function Payments() {
  const [paymentRows, setPaymentRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [billFilter, setBillFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Payment Detail Modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Record New Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedBillIdForPay, setSelectedBillIdForPay] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchPaymentsData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [billsRes, directPaymentsRes, refundsRes] =
        await Promise.allSettled([
          api.get("/api/bill"),
          api.get("/api/payments"),
          api.get("/api/refunds"),
        ]);

      if (billsRes.status === "rejected") {
        setError(
          getErrorMessage(
            billsRes.reason,
            "Unable to load payments data from backend."
          )
        );
        setPaymentRows([]);
        return;
      }

      const rawBills = Array.isArray(billsRes.value?.data?.data)
        ? billsRes.value.data.data
        : [];

      // 1. Collect all payments (from /api/payments or fallback per-bill /api/bill/{id}/payments)
      let allPaymentsRaw = [];
      if (
        directPaymentsRes.status === "fulfilled" &&
        directPaymentsRes.value.data?.success &&
        Array.isArray(directPaymentsRes.value.data.data)
      ) {
        allPaymentsRaw = directPaymentsRes.value.data.data;
      } else {
        const perBillPay = await Promise.allSettled(
          rawBills.map((b) =>
            api
              .get(`/api/bill/${b.id}/payments`)
              .then((r) => ({ bill: b, list: r.data?.data || [] }))
          )
        );
        perBillPay.forEach((res) => {
          if (res.status === "fulfilled" && Array.isArray(res.value.list)) {
            res.value.list.forEach((p) =>
              allPaymentsRaw.push({ ...p, bill: p.bill || res.value.bill })
            );
          }
        });
      }

      // Group payment installments by billId
      const paymentsByBillId = new Map();
      allPaymentsRaw.forEach((p) => {
        const bId = p.bill?.id;
        if (bId !== undefined && bId !== null) {
          const key = Number(bId);
          if (!paymentsByBillId.has(key)) {
            paymentsByBillId.set(key, []);
          }
          paymentsByBillId.get(key).push({
            id: p.id,
            code: `PAY-${String(p.id ?? 0).padStart(4, "0")}`,
            amount: Number(p.amount ?? 0),
            paymentDate: p.paymentDate,
          });
        }
      });

      // 2. Collect all refunds (from /api/refunds or fallback per-bill /api/bill/{id}/refunds)
      let allRefundsRaw = [];
      if (
        refundsRes.status === "fulfilled" &&
        refundsRes.value.data?.success &&
        Array.isArray(refundsRes.value.data.data)
      ) {
        allRefundsRaw = refundsRes.value.data.data;
      } else {
        const perBillRef = await Promise.allSettled(
          rawBills.map((b) =>
            api
              .get(`/api/bill/${b.id}/refunds`)
              .then((r) => ({ bill: b, list: r.data?.data || [] }))
          )
        );
        perBillRef.forEach((res) => {
          if (res.status === "fulfilled" && Array.isArray(res.value.list)) {
            res.value.list.forEach((r) =>
              allRefundsRaw.push({ ...r, bill: r.bill || res.value.bill })
            );
          }
        });
      }

      const refundsByBillId = new Map();
      allRefundsRaw.forEach((r) => {
        const bId = r.bill?.id;
        if (bId !== undefined && bId !== null) {
          const key = Number(bId);
          const prev = refundsByBillId.get(key) || {
            amount: 0,
            refundDate: null,
            refundCode: `REF-${String(r.id ?? 0).padStart(4, "0")}`,
          };
          refundsByBillId.set(key, {
            amount: prev.amount + Number(r.amount ?? 0),
            refundDate: r.refundDate || prev.refundDate,
            refundCode: `REF-${String(r.id ?? 0).padStart(4, "0")}`,
          });
        }
      });

      // 3. Build unified payment records (one complete row per bill showing Paid, Refunded, Due & Unpaid!)
      const unifiedRows = rawBills.map((bill) => {
        const bId = Number(bill.id);
        const billInstallments = (paymentsByBillId.get(bId) || []).sort(
          (a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)
        );
        const sumInstallments = billInstallments.reduce(
          (sum, item) => sum + item.amount,
          0
        );

        const totalAmount = Number(bill.totalAmount ?? 0);
        const paidAmount =
          bill.paidAmount !== undefined && bill.paidAmount !== null
            ? Math.max(Number(bill.paidAmount), sumInstallments)
            : sumInstallments;

        const refundMeta = refundsByBillId.get(bId);
        const isCancelled =
          String(bill.status || "").toUpperCase() === "CANCELLED" ||
          Boolean(refundMeta);

        const refundedAmount = isCancelled
          ? refundMeta?.amount || paidAmount
          : 0;

        const remaining = isCancelled
          ? 0
          : Math.max(0, totalAmount - paidAmount);

        // Unified status:
        // - REFUNDED: Bill cancelled / refund processed
        // - PAID: Active bill, fully paid (remaining === 0)
        // - PARTIAL: Active bill, paid > 0 && remaining > 0
        // - UNPAID: Active bill, paid === 0
        let ledgerStatus = "UNPAID";
        if (isCancelled) {
          ledgerStatus = "REFUNDED";
        } else if (paidAmount >= totalAmount && totalAmount > 0) {
          ledgerStatus = "PAID";
        } else if (paidAmount > 0) {
          ledgerStatus = "PARTIAL";
        } else {
          ledgerStatus = "UNPAID";
        }

        const latestPayment = billInstallments[0] || null;
        const primaryCode =
          billInstallments.length > 0
            ? latestPayment.code
            : isCancelled && refundMeta?.refundCode
            ? refundMeta.refundCode
            : "NO-PAYMENT";

        const activityDate =
          refundMeta?.refundDate ||
          latestPayment?.paymentDate ||
          bill.billDate ||
          null;

        return {
          billId: bId,
          billCode: `BILL-${String(bId).padStart(4, "0")}`,
          primaryCode,
          installmentsCount: billInstallments.length,
          installments: billInstallments,
          customerName: bill.customer?.name ?? `Customer (Bill #${bId})`,
          customerContact: bill.customer?.phone ?? "",
          totalAmount,
          paidAmount,
          refundedAmount,
          remaining,
          activityDate,
          billDate: bill.billDate,
          status: isCancelled ? "CANCELLED" : "ACTIVE",
          ledgerStatus, // "PAID" | "PARTIAL" | "UNPAID" | "REFUNDED"
        };
      });

      unifiedRows.sort((a, b) => (b.billId ?? 0) - (a.billId ?? 0));
      setPaymentRows(unifiedRows);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load payments data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentsData();
  }, [fetchPaymentsData]);

  // Bills that can accept a new payment (ACTIVE & remaining > 0)
  const payableBills = useMemo(
    () =>
      paymentRows.filter((row) => row.status === "ACTIVE" && row.remaining > 0),
    [paymentRows]
  );

  const selectedPayableBill = useMemo(
    () =>
      payableBills.find(
        (b) => String(b.billId) === String(selectedBillIdForPay)
      ) || null,
    [payableBills, selectedBillIdForPay]
  );

  // Filtered rows in the single unified Payments table
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return paymentRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.billCode.toLowerCase().includes(query) ||
        row.primaryCode.toLowerCase().includes(query) ||
        String(row.billId).includes(query) ||
        row.customerName.toLowerCase().includes(query) ||
        row.customerContact.toLowerCase().includes(query);

      const matchesBill =
        billFilter === "ALL" || String(row.billId) === String(billFilter);

      const matchesStatus =
        statusFilter === "ALL" || row.ledgerStatus === statusFilter;

      return matchesSearch && matchesBill && matchesStatus;
    });
  }, [paymentRows, search, billFilter, statusFilter]);

  // Summary Stats
  const stats = useMemo(() => {
    const activeCollected = paymentRows.reduce(
      (sum, r) => sum + (r.status === "ACTIVE" ? r.paidAmount : 0),
      0
    );
    const totalPending = paymentRows.reduce(
      (sum, r) => sum + (r.status === "ACTIVE" ? r.remaining : 0),
      0
    );
    const totalRefunded = paymentRows.reduce(
      (sum, r) => sum + r.refundedAmount,
      0
    );

    const paidCount = paymentRows.filter(
      (r) => r.ledgerStatus === "PAID"
    ).length;
    const partialCount = paymentRows.filter(
      (r) => r.ledgerStatus === "PARTIAL"
    ).length;
    const unpaidCount = paymentRows.filter(
      (r) => r.ledgerStatus === "UNPAID"
    ).length;
    const refundedCount = paymentRows.filter(
      (r) => r.ledgerStatus === "REFUNDED"
    ).length;

    return {
      activeCollected,
      totalPending,
      totalRefunded,
      paidCount,
      partialCount,
      unpaidCount,
      refundedCount,
    };
  }, [paymentRows]);

  const openRecordPaymentModal = (preselectedBillId) => {
    setPaymentError("");
    setPaymentAmountInput("");
    if (preselectedBillId) {
      setSelectedBillIdForPay(String(preselectedBillId));
    } else {
      setSelectedBillIdForPay(
        payableBills.length > 0 ? String(payableBills[0].billId) : ""
      );
    }
    setShowRecordModal(true);
  };

  const handleRecordPaymentSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPayableBill) {
      setPaymentError("Please select a bill with a pending balance.");
      return;
    }

    const amount = Number(paymentAmountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Amount must be greater than zero.");
      return;
    }

    if (amount > selectedPayableBill.remaining) {
      setPaymentError(
        `Payment cannot exceed remaining balance (${formatCurrency(
          selectedPayableBill.remaining
        )}).`
      );
      return;
    }

    try {
      setPaymentSubmitting(true);
      setPaymentError("");

      const response = await api.patch(
        `/api/bill/bill_id/${selectedPayableBill.billId}/payment`,
        null,
        {
          params: { payment: amount },
        }
      );

      if (response.data?.success) {
        setShowRecordModal(false);
        setSuccessBanner(
          `Payment of ${formatCurrency(amount)} recorded for ${
            selectedPayableBill.billCode
          }.`
        );
        await fetchPaymentsData();
      } else {
        setPaymentError(response.data?.message || "Unable to record payment.");
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to record payment."));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const renderStatusBadge = (ledgerStatus) => {
    if (ledgerStatus === "PAID") {
      return (
        <span className="payment-status completed">
          <span className="payment-status-dot" />
          PAID (Full Paid)
        </span>
      );
    }
    if (ledgerStatus === "PARTIAL") {
      return (
        <span className="payment-status pending">
          <span className="payment-status-dot" />
          PARTIAL (Due Left)
        </span>
      );
    }
    if (ledgerStatus === "REFUNDED") {
      return (
        <span
          className="payment-status"
          style={{ background: "#f3e8ff", color: "#7e22ce" }}
        >
          <span
            className="payment-status-dot"
            style={{ background: "#7e22ce" }}
          />
          REFUNDED
        </span>
      );
    }
    return (
      <span
        className="payment-status"
        style={{ background: "#fef2f2", color: "#dc2626" }}
      >
        <span
          className="payment-status-dot"
          style={{ background: "#dc2626" }}
        />
        UNPAID (₹0 Paid)
      </span>
    );
  };

  return (
    <div className="payments-page">
      <div className="payments-heading">
        <div>
          <h1>Payments</h1>
          <p>
            Track who paid, how much is pending, who hasn&apos;t paid yet, and
            who took a refund.
          </p>
        </div>

        <div className="payments-heading-actions">
          <button
            type="button"
            className="payments-refresh-btn"
            onClick={fetchPaymentsData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>

          <button
            type="button"
            className="payments-record-btn"
            onClick={() => openRecordPaymentModal()}
          >
            <Plus size={16} />
            Record Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="payments-error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="payments-success-banner" role="status">
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
          <button type="button" onClick={() => setSuccessBanner("")}>
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Clear Summary Cards */}
      <div className="payments-stats">
        <div className="payments-stat-card">
          <div className="payments-stat-icon green">
            <IndianRupee size={20} />
          </div>
          <div>
            <p>Total Collected (Active)</p>
            <h2>{formatCurrency(stats.activeCollected)}</h2>
            <span>
              {stats.paidCount} Fully Paid • {stats.partialCount} Partial
            </span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon orange">
            <Clock size={20} />
          </div>
          <div>
            <p>Remaining Balance (Baki)</p>
            <h2>{formatCurrency(stats.totalPending)}</h2>
            <span>
              {stats.unpaidCount} Unpaid • {stats.partialCount} Partial Bills
            </span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon red">
            <RotateCcw size={20} />
          </div>
          <div>
            <p>Refunded Amount</p>
            <h2>{formatCurrency(stats.totalRefunded)}</h2>
            <span>Across {stats.refundedCount} cancelled/refunded bills</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon blue">
            <ReceiptText size={20} />
          </div>
          <div>
            <p>Payment Status Summary</p>
            <h2>
              {stats.paidCount} Paid / {stats.unpaidCount + stats.partialCount}{" "}
              Due
            </h2>
            <span>
              {stats.unpaidCount} Unpaid • {stats.partialCount} Partial •{" "}
              {stats.refundedCount} Refunded
            </span>
          </div>
        </div>
      </div>

      {/* Single Unified Payments Table */}
      <div className="payments-table-card">
        <div className="payments-table-heading">
          <div>
            <h3>Customer Payment Records</h3>
            <p>
              Complete payment status of every customer bill — Paid, Partial,
              Unpaid, and Refunded.
            </p>
          </div>
          <span className="payments-count-badge">
            {filteredRows.length} records
          </span>
        </div>

        <div className="payments-filters">
          <div className="payments-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search by Customer, Bill ID (BILL-0001), or Payment ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={billFilter}
            onChange={(event) => setBillFilter(event.target.value)}
          >
            <option value="ALL">All Bills ({paymentRows.length})</option>
            {paymentRows.map((r) => (
              <option key={r.billId} value={String(r.billId)}>
                {r.billCode} — {r.customerName} ({r.ledgerStatus})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Fully Paid (Pura Pay Kiya)</option>
            <option value="PARTIAL">Partially Paid (Kuch Baki Hai)</option>
            <option value="UNPAID">Unpaid (Bilkul Pay Nahi Kiya)</option>
            <option value="REFUNDED">Refunded (Refund Liya)</option>
          </select>
        </div>

        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Payment / Bill</th>
                <th>Customer</th>
                <th>Bill Total</th>
                <th>Paid Amount</th>
                <th>Refunded</th>
                <th>Remaining (Baki)</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="payments-empty">
                    Loading payment records...
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.billId}
                    className="payment-row"
                    onClick={() => setSelectedRecord(row)}
                  >
                    <td>
                      <div className="payment-transaction">
                        <strong>
                          {row.primaryCode === "NO-PAYMENT"
                            ? row.billCode
                            : row.primaryCode}
                        </strong>
                        <span>
                          {row.primaryCode === "NO-PAYMENT"
                            ? "No payment recorded yet"
                            : `Linked to ${row.billCode}${
                                row.installmentsCount > 1
                                  ? ` (${row.installmentsCount} installments)`
                                  : ""
                              }`}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="payment-transaction">
                        <strong className="payment-customer">
                          {row.customerName}
                        </strong>
                        {row.customerContact && (
                          <span>{row.customerContact}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong>{formatCurrency(row.totalAmount)}</strong>
                    </td>

                    <td
                      className="payment-amount"
                      style={{
                        color:
                          row.paidAmount > 0
                            ? "#15803d"
                            : "#94a3b8",
                      }}
                    >
                      {row.paidAmount > 0
                        ? `+${formatCurrency(row.paidAmount)}`
                        : "₹0.00"}
                    </td>

                    <td
                      style={{
                        fontWeight: 700,
                        color: row.refundedAmount > 0 ? "#7e22ce" : "#94a3b8",
                      }}
                    >
                      {row.refundedAmount > 0
                        ? `-${formatCurrency(row.refundedAmount)}`
                        : "—"}
                    </td>

                    <td
                      style={{
                        fontWeight: 700,
                        color: row.remaining > 0 ? "#dc2626" : "#64748b",
                      }}
                    >
                      {formatCurrency(row.remaining)}
                    </td>

                    <td className="payment-date">
                      <span className="payment-date-inline">
                        <Calendar size={13} />
                        {formatDateTime(row.activityDate)}
                      </span>
                    </td>

                    <td>{renderStatusBadge(row.ledgerStatus)}</td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {row.status === "ACTIVE" && row.remaining > 0 && (
                          <button
                            type="button"
                            onClick={() => openRecordPaymentModal(row.billId)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "7px",
                              border: "none",
                              background: "#3563e9",
                              color: "#ffffff",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Pay Now
                          </button>
                        )}
                        <button
                          type="button"
                          className="payment-view-btn"
                          title="View full payment & refund details"
                          onClick={() => setSelectedRecord(row)}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan="9" className="payments-empty">
                    No payment records match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-table-footer">
          Showing {filteredRows.length} of {paymentRows.length} customer payment
          records
        </div>
      </div>

      {/* Payment & Refund Details Modal */}
      {selectedRecord && (
        <div
          className="payment-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-modal-heading">
              <div>
                <h2>Payment Summary</h2>
                <p>
                  {selectedRecord.billCode} • {selectedRecord.customerName}
                </p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() => setSelectedRecord(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-detail-amount">
              <span>Paid by Customer</span>
              <strong>{formatCurrency(selectedRecord.paidAmount)}</strong>
              {renderStatusBadge(selectedRecord.ledgerStatus)}
            </div>

            <div className="payment-detail-list">
              <div>
                <span>Bill ID</span>
                <strong>{selectedRecord.billCode}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedRecord.customerName}</strong>
              </div>
              <div>
                <span>Total Bill Amount</span>
                <strong>{formatCurrency(selectedRecord.totalAmount)}</strong>
              </div>
              <div>
                <span>Amount Paid</span>
                <strong style={{ color: "#15803d" }}>
                  {formatCurrency(selectedRecord.paidAmount)}
                </strong>
              </div>
              <div>
                <span>Refunded Amount</span>
                <strong style={{ color: "#7e22ce" }}>
                  {formatCurrency(selectedRecord.refundedAmount)}
                </strong>
              </div>
              <div>
                <span>Remaining Balance (Baki)</span>
                <strong
                  style={{
                    color:
                      selectedRecord.remaining > 0 ? "#dc2626" : "#334155",
                  }}
                >
                  {formatCurrency(selectedRecord.remaining)}
                </strong>
              </div>
            </div>

            {selectedRecord.installments.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Payment Installments ({selectedRecord.installments.length})
                </p>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  {selectedRecord.installments.map((inst) => (
                    <div
                      key={inst.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        fontSize: "12px",
                      }}
                    >
                      <span>
                        <strong>{inst.code}</strong> •{" "}
                        {formatDateTime(inst.paymentDate)}
                      </span>
                      <strong style={{ color: "#15803d" }}>
                        +{formatCurrency(inst.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              {selectedRecord.status === "ACTIVE" &&
                selectedRecord.remaining > 0 && (
                  <button
                    type="button"
                    className="payment-close-btn"
                    onClick={() => {
                      const bId = selectedRecord.billId;
                      setSelectedRecord(null);
                      openRecordPaymentModal(bId);
                    }}
                  >
                    Pay Remaining ({formatCurrency(selectedRecord.remaining)})
                  </button>
                )}
              <button
                type="button"
                className="payment-close-btn"
                style={
                  selectedRecord.status === "ACTIVE" &&
                  selectedRecord.remaining > 0
                    ? { background: "#64748b" }
                    : undefined
                }
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record New Payment Modal */}
      {showRecordModal && (
        <div
          className="payment-modal-overlay"
          onClick={() => setShowRecordModal(false)}
        >
          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-modal-heading">
              <div>
                <h2>Record Bill Payment</h2>
                <p>Select an unpaid or partially paid bill to add payment.</p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() => setShowRecordModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {payableBills.length === 0 ? (
              <div className="payments-empty">
                All active bills in your shop are already fully paid!
              </div>
            ) : (
              <form onSubmit={handleRecordPaymentSubmit}>
                <div className="payment-form-group">
                  <label htmlFor="select-payable-bill">Select Bill</label>
                  <select
                    id="select-payable-bill"
                    value={selectedBillIdForPay}
                    onChange={(e) => {
                      setSelectedBillIdForPay(e.target.value);
                      setPaymentAmountInput("");
                      setPaymentError("");
                    }}
                    required
                  >
                    {payableBills.map((b) => (
                      <option key={b.billId} value={String(b.billId)}>
                        {b.billCode} — {b.customerName} (Due:{" "}
                        {formatCurrency(b.remaining)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPayableBill && (
                  <div className="payment-detail-list">
                    <div>
                      <span>Bill Total</span>
                      <strong>
                        {formatCurrency(selectedPayableBill.totalAmount)}
                      </strong>
                    </div>
                    <div>
                      <span>Already Paid</span>
                      <strong>
                        {formatCurrency(selectedPayableBill.paidAmount)}
                      </strong>
                    </div>
                    <div>
                      <span>Remaining Due (Baki)</span>
                      <strong className="due-highlight">
                        {formatCurrency(selectedPayableBill.remaining)}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="payment-form-group">
                  <div className="payment-label-row">
                    <label htmlFor="payment-amount-input">
                      Payment Amount (₹)
                    </label>
                    {selectedPayableBill && (
                      <button
                        type="button"
                        className="fill-full-due-btn"
                        onClick={() =>
                          setPaymentAmountInput(
                            String(selectedPayableBill.remaining)
                          )
                        }
                      >
                        Pay Full ({formatCurrency(selectedPayableBill.remaining)})
                      </button>
                    )}
                  </div>
                  <input
                    id="payment-amount-input"
                    type="number"
                    min="0.01"
                    max={selectedPayableBill?.remaining}
                    step="0.01"
                    placeholder="Enter amount..."
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    required
                  />
                </div>

                {paymentError && (
                  <p className="payment-form-error" role="alert">
                    {paymentError}
                  </p>
                )}

                <button
                  type="submit"
                  className="payment-close-btn"
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? "Saving Payment..." : "Record Payment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}