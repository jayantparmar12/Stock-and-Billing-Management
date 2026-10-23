import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Clock,
  ReceiptText,
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
  const [billsWithMeta, setBillsWithMeta] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [billFilter, setBillFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PAID | PARTIAL

  // Payment Detail Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Record New Payment Modal State (PATCH /api/bill/bill_id/{id}/payment)
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedBillIdForPay, setSelectedBillIdForPay] = useState("");
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Fetch all bills and each bill's payments + refunds
  const fetchPaymentsData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const billsRes = await api.get("/api/bill");
      if (!billsRes.data?.success || !Array.isArray(billsRes.data.data)) {
        setError(billsRes.data?.message || "Unable to load bills.");
        setLoading(false);
        return;
      }

      const rawBills = billsRes.data.data;

      const perBillResults = await Promise.allSettled(
        rawBills.map(async (bill) => {
          const [payRes, refRes] = await Promise.allSettled([
            api.get(`/api/bill/${bill.id}/payments`),
            api.get(`/api/bill/${bill.id}/refunds`),
          ]);

          const payList =
            payRes.status === "fulfilled" &&
            payRes.value.data?.success &&
            Array.isArray(payRes.value.data.data)
              ? payRes.value.data.data
              : [];

          const refList =
            refRes.status === "fulfilled" &&
            refRes.value.data?.success &&
            Array.isArray(refRes.value.data.data)
              ? refRes.value.data.data
              : [];

          return { bill, payList, refList };
        })
      );

      const enrichedBills = [];
      const allPayments = [];

      perBillResults.forEach((result) => {
        if (result.status !== "fulfilled") return;
        const { bill, payList, refList } = result.value;

        const totalAmount = Number(bill.totalAmount ?? 0);
        const totalPaidFromLogs = payList.reduce(
          (sum, p) => sum + Number(p.amount ?? 0),
          0
        );
        const paidAmount =
          bill.paidAmount !== undefined && bill.paidAmount !== null
            ? Number(bill.paidAmount)
            : totalPaidFromLogs;

        const isCancelled =
          bill.status === "CANCELLED" || refList.length > 0;
        const remaining = isCancelled
          ? 0
          : Math.max(0, totalAmount - paidAmount);

        let paymentStatus = bill.paymentStatus;
        if (!paymentStatus) {
          if (paidAmount >= totalAmount && totalAmount > 0) {
            paymentStatus = "PAID";
          } else if (paidAmount > 0) {
            paymentStatus = "PARTIAL";
          } else {
            paymentStatus = "UNPAID";
          }
        }

        const customerName =
          bill.customer?.name ??
          bill.customer?.customerName ??
          `Customer (Bill #${bill.id})`;
        const customerContact =
          bill.customer?.phone ??
          bill.customer?.mobile ??
          bill.customer?.phoneNumber ??
          bill.customer?.email ??
          "";

        const billMeta = {
          id: bill.id,
          billCode: `BILL-${String(bill.id).padStart(4, "0")}`,
          billDate: bill.billDate,
          customerName,
          customerContact,
          totalAmount,
          paidAmount,
          remaining,
          status: isCancelled ? "CANCELLED" : "ACTIVE",
          paymentStatus,
          items: Array.isArray(bill.items) ? bill.items : [],
        };

        enrichedBills.push(billMeta);

        payList.forEach((pay) => {
          const payId = pay.id ?? 0;
          const amount = Number(pay.amount ?? 0);

          allPayments.push({
            id: payId,
            transactionCode: `PAY-${String(payId).padStart(4, "0")}`,
            billId: bill.id,
            billCode: billMeta.billCode,
            customerName,
            customerContact,
            amount,
            paymentDate: pay.paymentDate ?? pay.createdAt ?? bill.billDate,
            billTotal: totalAmount,
            billPaidAmount: paidAmount,
            billRemaining: remaining,
            billPaymentStatus: paymentStatus,
            billStatus: billMeta.status,
          });
        });
      });

      // Sort payments newest first by paymentDate (and id descending)
      allPayments.sort((a, b) => {
        const timeA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const timeB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.id ?? 0) - Number(a.id ?? 0);
      });

      setBillsWithMeta(
        enrichedBills.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      );
      setPayments(allPayments);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load payments data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentsData();
  }, [fetchPaymentsData]);

  // Bills that still have a pending balance (for "+ Record Payment" modal)
  const payableBills = useMemo(
    () =>
      billsWithMeta.filter(
        (b) => b.status === "ACTIVE" && b.remaining > 0
      ),
    [billsWithMeta]
  );

  const selectedPayableBill = useMemo(
    () =>
      payableBills.find(
        (b) => String(b.id) === String(selectedBillIdForPay)
      ) || null,
    [payableBills, selectedBillIdForPay]
  );

  // Filtered Payment Transactions
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((item) => {
      const matchesSearch =
        !query ||
        item.transactionCode.toLowerCase().includes(query) ||
        item.billCode.toLowerCase().includes(query) ||
        String(item.id).includes(query) ||
        String(item.billId).includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.customerContact.toLowerCase().includes(query);

      const matchesBill =
        billFilter === "ALL" || String(item.billId) === String(billFilter);

      const matchesStatus =
        statusFilter === "ALL" || item.billPaymentStatus === statusFilter;

      return matchesSearch && matchesBill && matchesStatus;
    });
  }, [payments, search, billFilter, statusFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = billsWithMeta.reduce(
      (sum, b) => sum + (b.status === "ACTIVE" ? b.remaining : 0),
      0
    );
    const paidBillsCount = billsWithMeta.filter(
      (b) => b.status === "ACTIVE" && b.paymentStatus === "PAID"
    ).length;
    const pendingBillsCount = payableBills.length;

    return {
      totalCollected,
      totalPending,
      totalTransactions: payments.length,
      paidBillsCount,
      pendingBillsCount,
    };
  }, [payments, billsWithMeta, payableBills]);

  const openRecordPaymentModal = () => {
    setPaymentError("");
    setPaymentAmountInput("");
    setSelectedBillIdForPay(
      payableBills.length > 0 ? String(payableBills[0].id) : ""
    );
    setShowRecordModal(true);
  };

  // Submit Payment (PATCH /api/bill/bill_id/{id}/payment?payment=...)
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
        `/api/bill/bill_id/${selectedPayableBill.id}/payment`,
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
          } (${selectedPayableBill.customerName}).`
        );
        await fetchPaymentsData();
      } else {
        setPaymentError(
          response.data?.message || "Unable to record payment."
        );
      }
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Unable to record payment."));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="payments-page">
      <div className="payments-heading">
        <div>
          <h1>Payments</h1>
          <p>
            View all received bill payments and record partial or full
            installments.
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
            onClick={openRecordPaymentModal}
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

      {/* 4 Summary Cards */}
      <div className="payments-stats">
        <div className="payments-stat-card">
          <div className="payments-stat-icon green">
            <IndianRupee size={20} />
          </div>
          <div>
            <p>Total Collected</p>
            <h2>{formatCurrency(stats.totalCollected)}</h2>
            <span>Across {stats.totalTransactions} payments</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon orange">
            <Clock size={20} />
          </div>
          <div>
            <p>Pending Bill Balance</p>
            <h2>{formatCurrency(stats.totalPending)}</h2>
            <span>Across {stats.pendingBillsCount} unpaid/partial bills</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon blue">
            <CreditCard size={20} />
          </div>
          <div>
            <p>Total Transactions</p>
            <h2>{stats.totalTransactions}</h2>
            <span>Recorded payment entries</span>
          </div>
        </div>

        <div className="payments-stat-card">
          <div className="payments-stat-icon red">
            <ReceiptText size={20} />
          </div>
          <div>
            <p>Paid vs Pending Bills</p>
            <h2>
              {stats.paidBillsCount} Paid / {stats.pendingBillsCount} Due
            </h2>
            <span>Active bill settlement status</span>
          </div>
        </div>
      </div>

      <div className="payments-table-card">
        <div className="payments-table-heading">
          <div>
            <h3>Payment Transactions</h3>
            <p>Every full or partial payment recorded against a customer bill.</p>
          </div>
          <span className="payments-count-badge">
            {filteredPayments.length} transactions
          </span>
        </div>

        <div className="payments-filters">
          <div className="payments-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search by Payment ID, Bill ID, or customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={billFilter}
            onChange={(event) => setBillFilter(event.target.value)}
            aria-label="Filter payments by bill"
          >
            <option value="ALL">All Bills</option>
            {billsWithMeta.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.billCode} — {b.customerName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by bill payment status"
          >
            <option value="ALL">All Bill Statuses</option>
            <option value="PAID">Fully Paid Bills (PAID)</option>
            <option value="PARTIAL">Partially Paid Bills (PARTIAL)</option>
          </select>
        </div>

        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Customer</th>
                <th>Bill Total</th>
                <th>Payment Date</th>
                <th>Amount Paid</th>
                <th>Bill Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="payments-empty">
                    Loading payment transactions...
                  </td>
                </tr>
              ) : (
                filteredPayments.map((item) => (
                  <tr
                    key={item.id}
                    className="payment-row"
                    onClick={() => setSelectedPayment(item)}
                  >
                    <td>
                      <div className="payment-transaction">
                        <strong>{item.transactionCode}</strong>
                        <span>Linked to {item.billCode}</span>
                      </div>
                    </td>

                    <td>
                      <div className="payment-transaction">
                        <strong className="payment-customer">
                          {item.customerName}
                        </strong>
                        {item.customerContact && (
                          <span>{item.customerContact}</span>
                        )}
                      </div>
                    </td>

                    <td>{formatCurrency(item.billTotal)}</td>

                    <td className="payment-date">
                      <span className="payment-date-inline">
                        <Calendar size={13} />
                        {formatDateTime(item.paymentDate)}
                      </span>
                    </td>

                    <td className="payment-amount">
                      +{formatCurrency(item.amount)}
                    </td>

                    <td>
                      <span
                        className={`payment-status ${
                          item.billPaymentStatus === "PAID"
                            ? "completed"
                            : "pending"
                        }`}
                      >
                        <span className="payment-status-dot" />
                        {item.billPaymentStatus}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="payment-view-btn"
                        title="View payment details"
                        onClick={() => setSelectedPayment(item)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {!loading && filteredPayments.length === 0 && (
                <tr>
                  <td colSpan="7" className="payments-empty">
                    No payment records match your filters. Click "Record
                    Payment" above to add a payment for an unpaid bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="payments-table-footer">
          Showing {filteredPayments.length} of {payments.length} payment
          transactions
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div
          className="payment-modal-overlay"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-modal-heading">
              <div>
                <h2>Payment Details</h2>
                <p>
                  {selectedPayment.transactionCode} •{" "}
                  {selectedPayment.billCode}
                </p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() => setSelectedPayment(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-detail-amount">
              <span>Amount Received</span>
              <strong>{formatCurrency(selectedPayment.amount)}</strong>
              <span
                className={`payment-status ${
                  selectedPayment.billPaymentStatus === "PAID"
                    ? "completed"
                    : "pending"
                }`}
              >
                <span className="payment-status-dot" />
                Bill is {selectedPayment.billPaymentStatus}
              </span>
            </div>

            <div className="payment-detail-list">
              <div>
                <span>Payment ID</span>
                <strong>#{selectedPayment.id}</strong>
              </div>
              <div>
                <span>Bill ID</span>
                <strong>#{selectedPayment.billId}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedPayment.customerName}</strong>
              </div>
              <div>
                <span>Payment Date & Time</span>
                <strong>{formatDateTime(selectedPayment.paymentDate)}</strong>
              </div>
              <div>
                <span>Total Bill Amount</span>
                <strong>{formatCurrency(selectedPayment.billTotal)}</strong>
              </div>
              <div>
                <span>Total Paid on Bill</span>
                <strong>
                  {formatCurrency(selectedPayment.billPaidAmount)}
                </strong>
              </div>
              <div>
                <span>Remaining Balance on Bill</span>
                <strong>{formatCurrency(selectedPayment.billRemaining)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="payment-close-btn"
              onClick={() => setSelectedPayment(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Record New Payment Modal (PATCH /api/bill/bill_id/{id}/payment) */}
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
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {payableBills.length === 0 ? (
              <div className="payments-empty">
                All active bills are already fully paid!
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
                      <option key={b.id} value={String(b.id)}>
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
                      <span>Remaining Due</span>
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