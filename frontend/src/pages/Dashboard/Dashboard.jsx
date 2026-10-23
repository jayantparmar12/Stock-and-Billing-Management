import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./Dashboard.css";
import api from "../../services/api";

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
    quantity: Number(raw.quantity ?? 0),
  };
}

function StatCard({
  title,
  value,
  badgeText,
  positive = true,
  icon: Icon,
  iconVariant = "blue",
  note,
  onClick,
}) {
  return (
    <article
      className={`stat-card ${onClick ? "clickable" : ""}`}
      onClick={onClick}
    >
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon ${iconVariant}`}>
          <Icon size={20} />
        </div>
      </div>

      <h2>{value}</h2>

      <div className="stat-bottom">
        {badgeText && (
          <span
            className={
              positive ? "stat-change positive" : "stat-change negative"
            }
          >
            {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {badgeText}
          </span>
        )}
        <span className="stat-note">{note}</span>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Dashboard Summary State from GET /api/dashboard
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    pendingPayments: 0,
    lowStockProducts: 0,
  });

  // Live Products & Bills for Charts, Recent Bills & Top Products
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeDays, setRangeDays] = useState(7); // 7 or 30 days
  const [rightListMode, setRightListMode] = useState("top"); // "top" | "low-stock"

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, productsRes, billsRes] = await Promise.allSettled([
        api.get("/api/dashboard"),
        api.get("/api/products"),
        api.get("/api/bill"),
      ]);

      let loadedProducts = [];
      if (
        productsRes.status === "fulfilled" &&
        productsRes.value.data?.success &&
        Array.isArray(productsRes.value.data.data)
      ) {
        loadedProducts = productsRes.value.data.data.map(normalizeProduct);
        setProducts(loadedProducts);
      }

      let loadedBills = [];
      if (
        billsRes.status === "fulfilled" &&
        billsRes.value.data?.success &&
        Array.isArray(billsRes.value.data.data)
      ) {
        loadedBills = billsRes.value.data.data;
        setBills(loadedBills);
      }

      if (
        dashboardRes.status === "fulfilled" &&
        dashboardRes.value.data?.success &&
        dashboardRes.value.data.data
      ) {
        const d = dashboardRes.value.data.data;
        setSummary({
          totalProducts: Number(d.totalProducts ?? loadedProducts.length),
          totalCustomers: Number(d.totalCustomers ?? 0),
          totalSales: Number(d.totalSales ?? 0),
          pendingPayments: Number(d.pendingPayments ?? 0),
          lowStockProducts: Number(d.lowStockProducts ?? 0),
        });
      } else {
        // Fallback computation if /api/dashboard fails (e.g. when DB has 0 bills and sum returns null)
        const fallbackSales = loadedBills.reduce(
          (sum, b) =>
            b.status === "CANCELLED" ? sum : sum + Number(b.totalAmount ?? 0),
          0
        );
        const fallbackLowStock = loadedProducts.filter(
          (p) => p.quantity < 11
        ).length;

        setSummary((prev) => ({
          ...prev,
          totalProducts: loadedProducts.length,
          totalSales: fallbackSales,
          lowStockProducts: fallbackLowStock,
        }));

        if (dashboardRes.status === "rejected") {
          const msg =
            dashboardRes.reason?.response?.data?.message ||
            "Dashboard endpoint returned an error; showing calculated metrics from products and bills.";
          setError(msg);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Build daily sales chart data for the last N days (7 or 30)
  const salesChartData = useMemo(() => {
    const today = new Date();
    const buckets = [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label =
        rangeDays <= 7
          ? d.toLocaleDateString("en-IN", { weekday: "short" })
          : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      buckets.push({ key, day: label, sales: 0 });
    }

    const bucketMap = new Map(buckets.map((b) => [b.key, b]));

    bills.forEach((bill) => {
      if (bill.status === "CANCELLED" || !bill.billDate) return;
      const d = new Date(bill.billDate);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      if (bucketMap.has(key)) {
        bucketMap.get(key).sales += Number(bill.totalAmount ?? 0);
      }
    });

    return buckets;
  }, [bills, rangeDays]);

  const periodSalesTotal = useMemo(
    () => salesChartData.reduce((sum, item) => sum + item.sales, 0),
    [salesChartData]
  );

  // Stock Breakdown Donut Data (In Stock > 10, Low Stock 1..10, Out of Stock 0)
  const stockBreakdown = useMemo(() => {
    const total = products.length;
    const inStockCount = products.filter((p) => p.quantity >= 11).length;
    const lowStockCount = products.filter(
      (p) => p.quantity > 0 && p.quantity < 11
    ).length;
    const outOfStockCount = products.filter((p) => p.quantity <= 0).length;

    const toPercent = (count) =>
      total > 0 ? Math.round((count / total) * 100) : 0;

    return [
      {
        name: "In Stock",
        count: inStockCount,
        percent: toPercent(inStockCount),
        value: inStockCount || (total === 0 ? 1 : 0),
        color: "#4169e1",
      },
      {
        name: "Low Stock",
        count: lowStockCount,
        percent: toPercent(lowStockCount),
        value: lowStockCount,
        color: "#f5a623",
      },
      {
        name: "Out of Stock",
        count: outOfStockCount,
        percent: toPercent(outOfStockCount),
        value: outOfStockCount,
        color: "#ef6461",
      },
    ];
  }, [products]);

  // Recent Bills (latest 6 sorted by ID descending)
  const recentBills = useMemo(() => {
    return [...bills]
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      .slice(0, 6);
  }, [bills]);

  // Top Selling Products (computed from bill items) + Low Stock Products
  const topSellingProducts = useMemo(() => {
    const soldMap = new Map();

    bills.forEach((bill) => {
      if (bill.status === "CANCELLED" || !Array.isArray(bill.items)) return;
      bill.items.forEach((item) => {
        const name = item.productName;
        if (!name) return;
        soldMap.set(name, (soldMap.get(name) || 0) + Number(item.quantity ?? 0));
      });
    });

    const enriched = products.map((p) => ({
      ...p,
      sold: soldMap.get(p.name) || 0,
    }));

    return enriched.sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [bills, products]);

  const lowStockItemsList = useMemo(() => {
    return products
      .filter((p) => p.quantity < 11)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [products]);

  const collectedAmount = Math.max(
    0,
    summary.totalSales - summary.pendingPayments
  );

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Live store performance, inventory alerts, and billing overview.</p>
        </div>

        <div className="dashboard-heading-controls">
          <button
            className="dashboard-date-button"
            type="button"
            onClick={() => setRangeDays((prev) => (prev === 7 ? 30 : 7))}
            title="Toggle chart period between 7 and 30 days"
          >
            <span>Last {rangeDays} days</span>
            <span>⌄</span>
          </button>

          <button
            className="dashboard-refresh-button"
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-error-banner" role="alert">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}

      {/* 5 Live Stat Cards from DashboardResponse */}
      <section className="stats-grid">
        <StatCard
          title="Total Sales"
          value={formatCurrency(summary.totalSales)}
          badgeText={`Collected: ${formatCurrency(collectedAmount)}`}
          positive
          icon={IndianRupee}
          iconVariant="blue"
          note="Active bills revenue"
          onClick={() => navigate("/billing")}
        />

        <StatCard
          title="Pending Payments"
          value={formatCurrency(summary.pendingPayments)}
          badgeText={summary.pendingPayments > 0 ? "Action needed" : "All clear"}
          positive={summary.pendingPayments === 0}
          icon={Clock}
          iconVariant="amber"
          note="Unpaid bill balance"
          onClick={() => navigate("/billing")}
        />

        <StatCard
          title="Total Products"
          value={summary.totalProducts.toLocaleString("en-IN")}
          badgeText={`${products.filter((p) => p.quantity > 0).length} in stock`}
          positive
          icon={Package}
          iconVariant="green"
          note="Catalogue items"
          onClick={() => navigate("/products")}
        />

        <StatCard
          title="Low Stock Products"
          value={summary.lowStockProducts.toLocaleString("en-IN")}
          badgeText={
            summary.lowStockProducts > 0 ? "Restock soon" : "Healthy stock"
          }
          positive={summary.lowStockProducts === 0}
          icon={AlertTriangle}
          iconVariant="red"
          note="Quantity < 11 units"
          onClick={() => navigate("/products")}
        />

        <StatCard
          title="Total Customers"
          value={summary.totalCustomers.toLocaleString("en-IN")}
          badgeText={`${bills.length} total bills`}
          positive
          icon={Users}
          iconVariant="purple"
          note="Registered customers"
          onClick={() => navigate("/customers")}
        />
      </section>

      <section className="dashboard-charts">
        <article className="panel sales-panel">
          <div className="panel-heading">
            <div>
              <h3>Sales Overview</h3>
              <p>Revenue generated over the last {rangeDays} days</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => navigate("/billing")}
            >
              Create Bill →
            </button>
          </div>

          <div className="sales-summary">
            <h2>{formatCurrency(periodSalesTotal)}</h2>
            <span className="summary-positive">
              <ArrowUpRight size={15} /> Last {rangeDays} days
            </span>
          </div>

          <div className="sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesChartData}
                margin={{ top: 12, right: 8, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4169e1" stopOpacity={0.22} />
                    <stop
                      offset="100%"
                      stopColor="#4169e1"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b95a7", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8b95a7", fontSize: 11 }}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#4169e1"
                  strokeWidth={2.5}
                  fill="url(#salesFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h3>Stock Status</h3>
              <p>Current live inventory breakdown</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => navigate("/products")}
            >
              Manage
            </button>
          </div>

          <div className="stock-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  stroke="none"
                >
                  {stockBreakdown.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, props) => [
                    `${props.payload.count} products (${props.payload.percent}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="stock-chart-center">
              <strong>{summary.totalProducts}</strong>
              <span>Products</span>
            </div>
          </div>

          <div className="stock-legend">
            {stockBreakdown.map((item) => (
              <div className="legend-item" key={item.name}>
                <span className="legend-label">
                  <span
                    className="legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.name}
                </span>
                <strong>
                  {item.count} ({item.percent}%)
                </strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-bottom">
        <article className="panel table-panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Bills</h3>
              <p>Latest transactions from your store</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => navigate("/billing")}
            >
              View all
            </button>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="dashboard-empty-cell">
                      Loading recent bills...
                    </td>
                  </tr>
                ) : recentBills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="dashboard-empty-cell">
                      No bills created yet.
                    </td>
                  </tr>
                ) : (
                  recentBills.map((bill) => (
                    <tr
                      key={bill.id}
                      className="dashboard-bill-row"
                      onClick={() => navigate("/billing")}
                    >
                      <td className="bill-id">#{bill.id}</td>
                      <td>{bill.customer?.name || "Customer"}</td>
                      <td>{formatShortDate(bill.billDate)}</td>
                      <td>{bill.items?.length || 0} items</td>
                      <td className="amount-cell">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel products-panel">
          <div className="panel-heading">
            <div>
              <h3>
                {rightListMode === "top"
                  ? "Top Selling Products"
                  : "Low Stock Alerts (< 11)"}
              </h3>
              <p>
                {rightListMode === "top"
                  ? "Most sold items across bills"
                  : "Products needing restock"}
              </p>
            </div>

            <div className="panel-mode-tabs">
              <button
                type="button"
                className={`mode-tab ${
                  rightListMode === "top" ? "active" : ""
                }`}
                onClick={() => setRightListMode("top")}
              >
                Top Sold
              </button>
              <button
                type="button"
                className={`mode-tab ${
                  rightListMode === "low-stock" ? "active" : ""
                }`}
                onClick={() => setRightListMode("low-stock")}
              >
                Low Stock ({summary.lowStockProducts})
              </button>
            </div>
          </div>

          <div className="top-products-list">
            {(rightListMode === "top"
              ? topSellingProducts
              : lowStockItemsList
            ).map((product, index) => (
              <div className="top-product" key={product.id ?? product.name}>
                <div className="product-rank">{index + 1}</div>
                <div className="top-product-info">
                  <strong>{product.name}</strong>
                  <span>
                    {product.category || "Uncategorized"} •{" "}
                    {rightListMode === "top"
                      ? `${product.sold} sold`
                      : formatCurrency(product.price)}
                  </span>
                </div>
                <span
                  className={`product-stock ${
                    product.quantity === 0
                      ? "out"
                      : product.quantity < 11
                      ? "low"
                      : ""
                  }`}
                >
                  {product.quantity === 0
                    ? "Out of stock"
                    : `${product.quantity} left`}
                </span>
              </div>
            ))}

            {!loading &&
              (rightListMode === "top"
                ? topSellingProducts.length === 0
                : lowStockItemsList.length === 0) && (
                <p className="dashboard-empty-cell">
                  {rightListMode === "top"
                    ? "No products available yet."
                    : "All products have healthy stock levels!"}
                </p>
              )}
          </div>
        </article>
      </section>
    </div>
  );
}