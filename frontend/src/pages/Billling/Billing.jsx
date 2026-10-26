import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ReceiptText,
  ShoppingCart,
  UserRound,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  CreditCard,
  Ban,
  X,
  FileText,
  RotateCcw,
} from "lucide-react";
import "./Billing.css";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getError(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function normalizeProduct(raw) {
  if (!raw) return null;
  const categoryName =
    typeof raw.category === "object" && raw.category !== null
      ? raw.category.name ?? ""
      : String(raw.category ?? "");

  return {
    id: raw.id,
    name: raw.name ?? raw.product ?? "",
    category: categoryName,
    price: Number(raw.price ?? 0),
    stock: Number(raw.quantity ?? raw.stock ?? 0),
  };
}

function normalizeCustomer(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name ?? raw.customerName ?? `Customer #${raw.id}`,
    phone:
      raw.phone ??
      raw.phoneNumber ??
      raw.mobile ??
      raw.contact ??
      raw.email ??
      "",
    email: raw.email ?? "",
  };
}

function normalizeBill(raw) {
  if (!raw) return null;
  const totalAmount = Number(raw.totalAmount ?? 0);
  const paidAmount =
    raw.paidAmount !== undefined && raw.paidAmount !== null
      ? Number(raw.paidAmount)
      : undefined;

  return {
    id: raw.id,
    billDate: raw.billDate,
    customer: raw.customer ? normalizeCustomer(raw.customer) : null,
    totalAmount,
    paidAmount,
    status: raw.status ?? "ACTIVE",
    paymentStatus: raw.paymentStatus ?? undefined,
    items: Array.isArray(raw.items)
      ? raw.items.map((item, idx) => ({
          id: idx,
          productName: item.productName ?? item.product?.product ?? "Product",
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          itemTotal: Number(
            item.itemTotal ??
              Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0)
          ),
        }))
      : [],
  };
}

export default function Billing() {
  // Active View Tab: "create" | "history"
  const [activeTab, setActiveTab] = useState("create");

  // Core Data States
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [billsLoading, setBillsLoading] = useState(false);

  // Page Feedback Banners
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Create Bill States
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [initialPaymentOption, setInitialPaymentOption] = useState("UNPAID"); // "UNPAID" | "FULL" | "PARTIAL"
  const [initialCustomPayment, setInitialCustomPayment] = useState("");
  const [creatingBill, setCreatingBill] = useState(false);

  // Bills History Filter States
  const [customerKeyword, setCustomerKeyword] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeFilterLabel, setActiveFilterLabel] = useState("");

  // Bill Details Modal States (GET /api/bill/{id}, /{id}/payments, /{id}/refunds)
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billPayments, setBillPayments] = useState([]);
  const [billRefunds, setBillRefunds] = useState([]);
  const [billDetailsLoading, setBillDetailsLoading] = useState(false);
  const [paymentInput, setPaymentInput] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ type: "", message: "" });

  // Fetch Customers & Products for Bill Creation
  const fetchCustomersAndProducts = useCallback(async () => {
    try {
      setLoadingInitial(true);

      const [productsRes, customersRes] = await Promise.allSettled([
        api.get("/api/products"),
        api.get("/api/customers").catch(() => api.get("/api/customer")),
      ]);

      if (
        productsRes.status === "fulfilled" &&
        productsRes.value.data?.success &&
        Array.isArray(productsRes.value.data.data)
      ) {
        setProducts(productsRes.value.data.data.map(normalizeProduct));
      }

      if (
        customersRes.status === "fulfilled" &&
        customersRes.value.data?.success &&
        Array.isArray(customersRes.value.data.data)
      ) {
        setCustomers(customersRes.value.data.data.map(normalizeCustomer));
      }
    } catch (err) {
      setError(
        getError(err, "Unable to load customers and products.")
      );
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  // Fetch All Bills (GET /api/bill)
  const fetchAllBills = useCallback(async () => {
    try {
      setBillsLoading(true);
      setError("");
      setActiveFilterLabel("");

      const response = await api.get("/api/bill");
      if (response.data?.success && Array.isArray(response.data.data)) {
        const list = response.data.data
          .map(normalizeBill)
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setBills(list);
      } else {
        setError(response.data?.message || "Unable to load bills.");
      }
    } catch (err) {
      setError(getError(err, "Unable to load bills."));
    } finally {
      setBillsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomersAndProducts();
    fetchAllBills();
  }, [fetchCustomersAndProducts, fetchAllBills]);

  // Cart Subtotal & Total
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const totalItemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Filter Products in Create Bill section
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter(
      (product) =>
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        String(product.id).includes(query)
    );
  }, [products, productSearch]);

  // Add Product to Bill Cart
  const addProductToCart = (product) => {
    setSuccessMessage("");
    setError("");

    setCart((previous) => {
      const existing = previous.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return previous;
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

  // Update Cart Item Quantity
  const updateCartQuantity = (productId, value) => {
    if (value === "") {
      setCart((previous) =>
        previous.map((item) =>
          item.id === productId ? { ...item, quantity: "" } : item
        )
      );
      return;
    }

    const quantity = Number(value);
    const product = products.find((item) => item.id === productId);
    if (!product || !Number.isInteger(quantity)) return;

    if (quantity < 1) {
      setCart((previous) => previous.filter((item) => item.id !== productId));
      return;
    }

    const clampedQty = Math.min(quantity, product.stock);
    setCart((previous) =>
      previous.map((item) =>
        item.id === productId ? { ...item, quantity: clampedQty } : item
      )
    );
  };

  const removeProductFromCart = (productId) => {
    setCart((previous) => previous.filter((item) => item.id !== productId));
  };

  // Create Bill Submit (POST /api/bill + optional PATCH /api/bill/bill_id/{id}/payment)
  const handleCreateBill = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const customerIdNum = Number(selectedCustomer);
    if (!selectedCustomer || !Number.isInteger(customerIdNum) || customerIdNum <= 0) {
      setError("Please select a customer before creating a bill.");
      return;
    }

    const validCartItems = cart.filter(
      (item) => Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0
    );

    if (validCartItems.length === 0) {
      setError("Bill must contain at least one product with quantity > 0.");
      return;
    }

    let paymentToRecord = 0;
    if (initialPaymentOption === "FULL") {
      paymentToRecord = subtotal;
    } else if (initialPaymentOption === "PARTIAL") {
      paymentToRecord = Number(initialCustomPayment);
      if (
        !Number.isFinite(paymentToRecord) ||
        paymentToRecord <= 0 ||
        paymentToRecord > subtotal
      ) {
        setError(
          `Partial payment must be greater than ₹0 and at most ${formatCurrency(
            subtotal
          )}.`
        );
        return;
      }
    }

    const payload = {
      customer_id: customerIdNum,
      items: validCartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity),
      })),
    };

    try {
      setCreatingBill(true);

      const response = await api.post("/api/bill", payload);
      if (response.data?.success && response.data.data) {
        const createdBill = normalizeBill(response.data.data);

        // If user selected immediate Full or Partial payment, record it via PATCH /api/bill/bill_id/{id}/payment
        if (paymentToRecord > 0 && createdBill?.id) {
          try {
            await api.patch(
              `/api/bill/bill_id/${createdBill.id}/payment`,
              null,
              {
                params: { payment: paymentToRecord },
              }
            );
          } catch (payErr) {
            setError(
              `Bill #${createdBill.id} was created, but payment update failed: ` +
                getError(payErr, "Unable to record payment.")
            );
          }
        }

        setSuccessMessage(
          `Bill #${createdBill.id} created for ${
            createdBill.customer?.name || "Customer"
          } — Total: ${formatCurrency(createdBill.totalAmount)}${
            paymentToRecord > 0
              ? ` (Paid: ${formatCurrency(paymentToRecord)})`
              : ""
          }`
        );

        // Reset form and refresh live stock & bills
        setCart([]);
        setSelectedCustomer("");
        setProductSearch("");
        setInitialPaymentOption("UNPAID");
        setInitialCustomPayment("");

        await Promise.all([fetchCustomersAndProducts(), fetchAllBills()]);
      } else {
        setError(response.data?.message || "Unable to create bill.");
      }
    } catch (err) {
      setError(getError(err, "Unable to create bill."));
    } finally {
      setCreatingBill(false);
    }
  };

  // Search Bills by Customer Name (GET /api/bill/search?keyword=...)
  const handleSearchByCustomerName = async (event) => {
    event.preventDefault();
    const keyword = customerKeyword.trim();
    if (!keyword) {
      fetchAllBills();
      return;
    }

    try {
      setBillsLoading(true);
      setError("");

      const response = await api.get("/api/bill/search", {
        params: { keyword },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setBills(
          response.data.data
            .map(normalizeBill)
            .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        );
        setActiveFilterLabel(`Search: "${keyword}"`);
      } else {
        setError(response.data?.message || "No matching bills found.");
      }
    } catch (err) {
      setError(getError(err, "Unable to search bills."));
    } finally {
      setBillsLoading(false);
    }
  };

  // Filter Bills by Customer ID (GET /api/bill/customer_id/{id})
  const handleFilterByCustomerId = async (value) => {
    setFilterCustomerId(value);
    if (value === "All") {
      fetchAllBills();
      return;
    }

    try {
      setBillsLoading(true);
      setError("");

      const response = await api.get(`/api/bill/customer_id/${value}`);
      if (response.data?.success && Array.isArray(response.data.data)) {
        const custObj = customers.find((c) => String(c.id) === String(value));
        setBills(
          response.data.data
            .map(normalizeBill)
            .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        );
        setActiveFilterLabel(
          `Customer: ${custObj ? custObj.name : `#${value}`}`
        );
      } else {
        setError(
          response.data?.message || "Unable to filter bills by customer."
        );
      }
    } catch (err) {
      setError(
        getError(err, "Unable to filter bills by customer.")
      );
    } finally {
      setBillsLoading(false);
    }
  };

  // Filter Bills by Date Range (GET /api/bill/date-range?start=...&end=...)
  const handleDateRangeFilter = async (event) => {
    event.preventDefault();
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    const startIso = `${startDate}T00:00:00`;
    const endIso = `${endDate}T23:59:59`;

    try {
      setBillsLoading(true);
      setError("");

      const response = await api.get("/api/bill/date-range", {
        params: {
          start: startIso,
          end: endIso,
        },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        setBills(
          response.data.data
            .map(normalizeBill)
            .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
        );
        setActiveFilterLabel(`Date Range: ${startDate} to ${endDate}`);
      } else {
        setBills([]);
        setActiveFilterLabel(`Date Range: ${startDate} to ${endDate}`);
      }
    } catch (err) {
      setBills([]);
      setError(
        getError(err, "No bills found in the selected date range.")
      );
    } finally {
      setBillsLoading(false);
    }
  };

  const resetBillFilters = () => {
    setCustomerKeyword("");
    setFilterCustomerId("All");
    setStartDate("");
    setEndDate("");
    fetchAllBills();
  };

  // Open Bill Details Modal (GET /api/bill/{id}, GET /api/bill/{id}/payments, GET /api/bill/{id}/refunds)
  const openBillDetails = async (billId, keepFeedback = false) => {
    setShowBillModal(true);
    setBillDetailsLoading(true);
    setConfirmCancel(false);
    setPaymentInput("");
    if (!keepFeedback) {
      setModalFeedback({ type: "", message: "" });
    }

    try {
      const [billRes, paymentsRes, refundsRes] = await Promise.allSettled([
        api.get(`/api/bill/${billId}`),
        api.get(`/api/bill/${billId}/payments`),
        api.get(`/api/bill/${billId}/refunds`),
      ]);

      let loadedBill = null;
      if (billRes.status === "fulfilled" && billRes.value.data?.success) {
        loadedBill = normalizeBill(billRes.value.data.data);
      }

      const paymentsList =
        paymentsRes.status === "fulfilled" &&
        paymentsRes.value.data?.success &&
        Array.isArray(paymentsRes.value.data.data)
          ? paymentsRes.value.data.data
          : [];

      const refundsList =
        refundsRes.status === "fulfilled" &&
        refundsRes.value.data?.success &&
        Array.isArray(refundsRes.value.data.data)
          ? refundsRes.value.data.data
          : [];

      setBillPayments(paymentsList);
      setBillRefunds(refundsList);

      if (loadedBill) {
        // Compute paidAmount & statuses from payments/refunds if DTO omits them
        const computedPaid = paymentsList.reduce(
          (sum, p) => sum + Number(p.amount ?? 0),
          0
        );
        const effectivePaid =
          loadedBill.paidAmount !== undefined
            ? loadedBill.paidAmount
            : computedPaid;

        let effectivePaymentStatus = loadedBill.paymentStatus;
        if (!effectivePaymentStatus) {
          if (
            effectivePaid >= loadedBill.totalAmount &&
            loadedBill.totalAmount > 0
          ) {
            effectivePaymentStatus = "PAID";
          } else if (effectivePaid > 0) {
            effectivePaymentStatus = "PARTIAL";
          } else {
            effectivePaymentStatus = "UNPAID";
          }
        }

        const effectiveStatus =
          loadedBill.status === "CANCELLED" || refundsList.length > 0
            ? "CANCELLED"
            : "ACTIVE";

        const enrichedBill = {
          ...loadedBill,
          paidAmount: effectivePaid,
          paymentStatus: effectivePaymentStatus,
          status: effectiveStatus,
        };

        setSelectedBill(enrichedBill);
        setBills((prev) =>
          prev.map((item) => (item.id === enrichedBill.id ? enrichedBill : item))
        );
      }
    } catch (err) {
      setModalFeedback({
        type: "error",
        message: getError(err, "Unable to load bill details."),
      });
    } finally {
      setBillDetailsLoading(false);
    }
  };

  // Record Payment on Existing Bill (PATCH /api/bill/bill_id/{id}/payment?payment=...)
  const handleUpdatePayment = async (amountOverride) => {
    if (!selectedBill) return;

    const amount = Number(
      amountOverride !== undefined ? amountOverride : paymentInput
    );
    const remaining = Math.max(
      0,
      selectedBill.totalAmount - (selectedBill.paidAmount ?? 0)
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      setModalFeedback({
        type: "error",
        message: "Please enter a valid payment amount greater than 0.",
      });
      return;
    }

    if (amount > remaining) {
      setModalFeedback({
        type: "error",
        message: `Payment cannot exceed remaining balance (${formatCurrency(
          remaining
        )}).`,
      });
      return;
    }

    try {
      setPaymentSubmitting(true);
      setModalFeedback({ type: "", message: "" });

      const response = await api.patch(
        `/api/bill/bill_id/${selectedBill.id}/payment`,
        null,
        {
          params: { payment: amount },
        }
      );

      if (response.data?.success) {
        setModalFeedback({
          type: "success",
          message: `Payment of ${formatCurrency(
            amount
          )} recorded successfully.`,
        });
        setPaymentInput("");
        await openBillDetails(selectedBill.id, true);
      } else {
        setModalFeedback({
          type: "error",
          message: response.data?.message || "Unable to update payment.",
        });
      }
    } catch (err) {
      setModalFeedback({
        type: "error",
        message: getError(err, "Unable to update payment."),
      });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Cancel Bill (PATCH /api/bill/cancell_bill/{id})
  const handleCancelBill = async () => {
    if (!selectedBill) return;

    try {
      setCancelSubmitting(true);
      setModalFeedback({ type: "", message: "" });

      const response = await api.patch(
        `/api/bill/cancell_bill/${selectedBill.id}`
      );

      if (response.data?.success) {
        setModalFeedback({
          type: "success",
          message:
            "Bill cancelled. Product stock has been restored and any paid amount was refunded.",
        });
        setConfirmCancel(false);
        await Promise.all([
          openBillDetails(selectedBill.id, true),
          fetchCustomersAndProducts(),
        ]);
      } else {
        setModalFeedback({
          type: "error",
          message: response.data?.message || "Unable to cancel bill.",
        });
      }
    } catch (err) {
      const msg = getError(err, "Unable to cancel bill.");
      if (msg.toLowerCase().includes("already cancelled")) {
        setSelectedBill((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : prev
        );
      }
      setModalFeedback({
        type: "error",
        message: msg,
      });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const remainingBalance = selectedBill
    ? Math.max(0, selectedBill.totalAmount - (selectedBill.paidAmount ?? 0))
    : 0;

  return (
    <div className="billing-page">
      <div className="billing-heading">
        <div>
          <h1>Billing & Invoices</h1>
          <p>
            Create customer bills, record partial or full payments, and manage
            invoices.
          </p>
        </div>

        <div className="billing-tabs">
          <button
            type="button"
            className={`billing-tab-btn ${
              activeTab === "create" ? "active" : ""
            }`}
            onClick={() => setActiveTab("create")}
          >
            <Plus size={16} />
            Create Bill
          </button>

          <button
            type="button"
            className={`billing-tab-btn ${
              activeTab === "history" ? "active" : ""
            }`}
            onClick={() => setActiveTab("history")}
          >
            <FileText size={16} />
            All Bills ({bills.length})
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

      {successMessage && (
        <div className="billing-success" role="status">
          <CheckCircle2 size={19} />
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage("")}>
            Dismiss
          </button>
        </div>
      )}

      {activeTab === "create" ? (
        <form className="billing-layout" onSubmit={handleCreateBill}>
          <div className="billing-main-column">
            {/* Step 1: Select Customer */}
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
                  <option value="">
                    {loadingInitial
                      ? "Loading customers..."
                      : "Select a customer"}
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""} (#
                      {customer.id})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Step 2: Add Products */}
            <section className="billing-card">
              <div className="billing-section-heading">
                <div className="billing-step-number">2</div>
                <div>
                  <h3>Add Products</h3>
                  <p>
                    Choose in-stock products to include in the bill (stock will
                    automatically deduct).
                  </p>
                </div>
              </div>

              <div className="billing-product-search">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                />
              </div>

              <div className="billing-product-list">
                {loadingInitial ? (
                  <div className="billing-no-products">Loading products...</div>
                ) : (
                  filteredProducts.map((product) => {
                    const cartItem = cart.find(
                      (item) => item.id === product.id
                    );
                    const currentCartQty = Number(cartItem?.quantity ?? 0);
                    const unavailable =
                      product.stock <= 0 || currentCartQty >= product.stock;

                    return (
                      <div className="billing-product-row" key={product.id}>
                        <div className="billing-product-icon">
                          <ShoppingCart size={18} />
                        </div>

                        <div className="billing-product-details">
                          <strong>{product.name}</strong>
                          <span>
                            {product.category
                              ? `${product.category} • `
                              : ""}
                            {product.stock > 0
                              ? `${product.stock} units available`
                              : "Out of stock"}
                            {currentCartQty > 0
                              ? ` (${currentCartQty} in bill)`
                              : ""}
                          </span>
                        </div>

                        <div className="billing-product-price">
                          {formatCurrency(product.price)}
                        </div>

                        <button
                          type="button"
                          className="billing-add-btn"
                          disabled={unavailable}
                          onClick={() => addProductToCart(product)}
                        >
                          <Plus size={15} />
                          {product.stock <= 0 ? "Out of Stock" : "Add"}
                        </button>
                      </div>
                    );
                  })
                )}

                {!loadingInitial && filteredProducts.length === 0 && (
                  <div className="billing-no-products">
                    No matching products found.
                  </div>
                )}
              </div>
            </section>

            {/* Step 3: Bill Items Cart */}
            <section className="billing-card">
              <div className="billing-section-heading">
                <div className="billing-step-number">3</div>
                <div>
                  <h3>Bill Items</h3>
                  <p>Review selected products and adjust quantities.</p>
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
                        <th>Unit Price</th>
                        <th>Available</th>
                        <th>Qty</th>
                        <th>Item Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.stock}</td>
                          <td>
                            <input
                              className="billing-quantity-input"
                              type="number"
                              min="1"
                              max={item.stock}
                              value={item.quantity}
                              onChange={(event) =>
                                updateCartQuantity(item.id, event.target.value)
                              }
                              aria-label={`Quantity for ${item.name}`}
                            />
                          </td>
                          <td className="billing-line-total">
                            {formatCurrency(
                              item.price * (Number(item.quantity) || 0)
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="billing-remove-btn"
                              title="Remove product"
                              onClick={() => removeProductFromCart(item.id)}
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

          {/* Right Sidebar: Bill Summary & Payment Recording */}
          <aside className="billing-summary-card">
            <div className="billing-summary-heading">
              <ReceiptText size={20} />
              <h3>Bill Summary</h3>
            </div>

            <div className="billing-summary-row">
              <span>Distinct Products</span>
              <strong>{cart.length}</strong>
            </div>

            <div className="billing-summary-row">
              <span>Total Quantity</span>
              <strong>{totalItemsCount} units</strong>
            </div>

            <div className="billing-summary-divider" />

            <div className="billing-grand-total">
              <span>Total Amount</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>

            <div className="billing-payment-field">
              <label htmlFor="billing-payment-status">
                Initial Payment Option
              </label>
              <select
                id="billing-payment-status"
                value={initialPaymentOption}
                onChange={(event) =>
                  setInitialPaymentOption(event.target.value)
                }
              >
                <option value="UNPAID">Unpaid (Pay Later)</option>
                <option value="FULL">Mark Full Paid ({formatCurrency(subtotal)})</option>
                <option value="PARTIAL">Record Partial Payment</option>
              </select>
            </div>

            {initialPaymentOption === "PARTIAL" && (
              <div className="billing-discount-field">
                <label htmlFor="billing-partial-amount">
                  Amount Paid Now (₹)
                </label>
                <input
                  id="billing-partial-amount"
                  type="number"
                  min="0.01"
                  max={subtotal}
                  step="0.01"
                  placeholder="Enter amount paid..."
                  value={initialCustomPayment}
                  onChange={(event) =>
                    setInitialCustomPayment(event.target.value)
                  }
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="billing-create-btn"
              disabled={creatingBill || cart.length === 0}
            >
              <ReceiptText size={18} />
              {creatingBill ? "Creating Bill..." : "Create Bill"}
            </button>

            <p className="billing-summary-note">
              Creating a bill automatically deducts product stock and records a
              SALE stock movement.
            </p>
          </aside>
        </form>
      ) : (
        /* All Bills & Filters Section */
        <section className="billing-history-panel">
          <div className="billing-filters-bar">
            <form
              className="billing-search-form"
              onSubmit={handleSearchByCustomerName}
            >
              <div className="billing-search-box">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Search bills by customer name..."
                  value={customerKeyword}
                  onChange={(e) => setCustomerKeyword(e.target.value)}
                />
              </div>
              <button type="submit" className="billing-filter-btn">
                Search
              </button>
            </form>

            <div className="billing-customer-filter">
              <UserRound size={15} />
              <select
                value={filterCustomerId}
                onChange={(e) => handleFilterByCustomerId(e.target.value)}
                aria-label="Filter bills by customer"
              >
                <option value="All">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} (#{c.id})
                  </option>
                ))}
              </select>
            </div>

            <form
              className="billing-date-filter"
              onSubmit={handleDateRangeFilter}
            >
              <Calendar size={15} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date"
              />
              <button type="submit" className="billing-filter-btn">
                Filter Dates
              </button>
            </form>

            <button
              type="button"
              className="billing-reset-btn"
              onClick={resetBillFilters}
              title="Reset filters and reload all bills"
            >
              <RefreshCw
                size={15}
                className={billsLoading ? "spin-icon" : ""}
              />
              Reset
            </button>
          </div>

          {activeFilterLabel && (
            <div className="active-filter-banner">
              <span>Showing filtered bills — {activeFilterLabel}</span>
              <button type="button" onClick={resetBillFilters}>
                Clear Filter
              </button>
            </div>
          )}

          <div className="billing-table-wrapper">
            <table className="billing-history-table">
              <thead>
                <tr>
                  <th>BILL ID</th>
                  <th>CUSTOMER</th>
                  <th>DATE & TIME</th>
                  <th>ITEMS</th>
                  <th>TOTAL AMOUNT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {billsLoading ? (
                  <tr>
                    <td colSpan="6" className="billing-empty-row">
                      Loading bills...
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => {
                    const itemCount = bill.items.reduce(
                      (sum, i) => sum + i.quantity,
                      0
                    );

                    return (
                      <tr
                        key={bill.id}
                        className="billing-history-row"
                        onClick={() => openBillDetails(bill.id)}
                      >
                        <td className="bill-id-cell">#{bill.id}</td>
                        <td>
                          <strong>
                            {bill.customer?.name || "Walk-in Customer"}
                          </strong>
                          {bill.customer?.phone && (
                            <span className="bill-customer-sub">
                              {bill.customer.phone}
                            </span>
                          )}
                        </td>
                        <td>{formatDateTime(bill.billDate)}</td>
                        <td>
                          <span className="bill-items-pill">
                            {bill.items.length} items ({itemCount} units)
                          </span>
                        </td>
                        <td className="bill-total-cell">
                          {formatCurrency(bill.totalAmount)}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="billing-view-btn"
                            onClick={() => openBillDetails(bill.id)}
                          >
                            <Eye size={15} />
                            Manage / Pay
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}

                {!billsLoading && bills.length === 0 && (
                  <tr>
                    <td colSpan="6" className="billing-empty-row">
                      No bills found. Create a new bill or adjust your search
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Bill Details, Payment Update & Cancel Modal */}
      {showBillModal && (
        <div
          className="billing-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowBillModal(false);
          }}
        >
          <section
            className="billing-details-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="billing-modal-header">
              <div>
                <h2>
                  Bill #{selectedBill?.id ?? ""}{" "}
                  {selectedBill?.status && (
                    <span
                      className={`bill-status-badge ${
                        selectedBill.status === "CANCELLED"
                          ? "cancelled"
                          : "active"
                      }`}
                    >
                      {selectedBill.status}
                    </span>
                  )}
                  {selectedBill?.paymentStatus && (
                    <span
                      className={`bill-pay-badge ${selectedBill.paymentStatus.toLowerCase()}`}
                    >
                      {selectedBill.paymentStatus}
                    </span>
                  )}
                </h2>
                <p>
                  Created on {formatDateTime(selectedBill?.billDate)} • Customer:{" "}
                  <strong>{selectedBill?.customer?.name || "—"}</strong>
                </p>
              </div>

              <button
                type="button"
                className="billing-modal-close"
                onClick={() => setShowBillModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {billDetailsLoading ? (
              <div className="billing-modal-loading">
                Loading invoice, payments, and refund history...
              </div>
            ) : selectedBill ? (
              <>
                {modalFeedback.message && (
                  <div
                    className={`billing-modal-feedback ${modalFeedback.type}`}
                  >
                    {modalFeedback.message}
                  </div>
                )}

                {/* Financial Overview Grid */}
                <div className="bill-overview-grid">
                  <div className="bill-overview-box">
                    <span>Total Bill Amount</span>
                    <strong>{formatCurrency(selectedBill.totalAmount)}</strong>
                  </div>
                  <div className="bill-overview-box">
                    <span>Paid Amount</span>
                    <strong className="text-green">
                      {formatCurrency(selectedBill.paidAmount ?? 0)}
                    </strong>
                  </div>
                  <div className="bill-overview-box">
                    <span>Remaining Balance</span>
                    <strong className="text-amber">
                      {formatCurrency(remainingBalance)}
                    </strong>
                  </div>
                </div>

                {/* Bill Line Items */}
                <div className="bill-section-block">
                  <h3>Purchased Items ({selectedBill.items.length})</h3>
                  <div className="bill-items-modal-table-wrap">
                    <table className="bill-items-modal-table">
                      <thead>
                        <tr>
                          <th>PRODUCT</th>
                          <th>UNIT PRICE</th>
                          <th>QTY</th>
                          <th>ITEM TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.productName}</strong>
                            </td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{item.quantity}</td>
                            <td>
                              <strong>{formatCurrency(item.itemTotal)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Record Payment Box (if ACTIVE and has remaining balance) */}
                {selectedBill.status !== "CANCELLED" &&
                  remainingBalance > 0 && (
                    <div className="bill-payment-action-box">
                      <div className="bill-payment-box-header">
                        <div>
                          <h3>
                            <CreditCard size={16} /> Record Payment
                          </h3>
                          <p>
                            Update full or partial payment for this bill (
                            <code>PATCH /api/bill/bill_id/{selectedBill.id}/payment</code>
                            ).
                          </p>
                        </div>
                        <button
                          type="button"
                          className="pay-full-btn"
                          disabled={paymentSubmitting}
                          onClick={() => handleUpdatePayment(remainingBalance)}
                        >
                          Pay Full Remaining ({formatCurrency(remainingBalance)})
                        </button>
                      </div>

                      <div className="bill-payment-input-row">
                        <input
                          type="number"
                          min="0.01"
                          max={remainingBalance}
                          step="0.01"
                          placeholder={`Enter amount (max ${remainingBalance})`}
                          value={paymentInput}
                          onChange={(e) => setPaymentInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="billing-filter-btn"
                          disabled={paymentSubmitting}
                          onClick={() => handleUpdatePayment()}
                        >
                          {paymentSubmitting
                            ? "Recording..."
                            : "Add Partial Payment"}
                        </button>
                      </div>
                    </div>
                  )}

                {/* Payments & Refunds History */}
                <div className="bill-histories-grid">
                  <div className="bill-section-block">
                    <h3>Payment History ({billPayments.length})</h3>
                    {billPayments.length === 0 ? (
                      <p className="bill-empty-sub">
                        No payments recorded for this bill yet.
                      </p>
                    ) : (
                      <ul className="bill-history-list">
                        {billPayments.map((pay, index) => (
                          <li key={pay.id ?? index}>
                            <span>
                              {formatDateTime(
                                pay.paymentDate ?? pay.createdAt ?? pay.date
                              )}
                            </span>
                            <strong className="text-green">
                              +{formatCurrency(pay.amount)}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bill-section-block">
                    <h3>
                      <RotateCcw size={14} /> Refund History (
                      {billRefunds.length})
                    </h3>
                    {billRefunds.length === 0 ? (
                      <p className="bill-empty-sub">
                        No refunds recorded for this bill.
                      </p>
                    ) : (
                      <ul className="bill-history-list">
                        {billRefunds.map((ref, index) => (
                          <li key={ref.id ?? index}>
                            <span>
                              {formatDateTime(
                                ref.refundDate ?? ref.createdAt ?? ref.date
                              )}
                            </span>
                            <strong className="text-red">
                              Refunded {formatCurrency(ref.amount)}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Cancel Bill Footer Action (PATCH /api/bill/cancell_bill/{id}) */}
                {selectedBill.status !== "CANCELLED" && (
                  <div className="bill-cancel-footer">
                    {!confirmCancel ? (
                      <button
                        type="button"
                        className="cancel-bill-trigger-btn"
                        onClick={() => setConfirmCancel(true)}
                      >
                        <Ban size={15} />
                        Cancel This Bill
                      </button>
                    ) : (
                      <div className="cancel-confirm-bar">
                        <span>
                          Cancel Bill #{selectedBill.id}? This will restore item
                          stock and refund any paid amount.
                        </span>
                        <div className="cancel-confirm-actions">
                          <button
                            type="button"
                            className="billing-reset-btn"
                            onClick={() => setConfirmCancel(false)}
                            disabled={cancelSubmitting}
                          >
                            Keep Bill
                          </button>
                          <button
                            type="button"
                            className="confirm-cancel-btn"
                            onClick={handleCancelBill}
                            disabled={cancelSubmitting}
                          >
                            {cancelSubmitting
                              ? "Cancelling..."
                              : "Yes, Cancel Bill"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}