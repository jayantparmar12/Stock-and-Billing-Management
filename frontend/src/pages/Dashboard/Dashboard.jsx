
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
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

const salesData = [
  { day: "Mon", sales: 4200 },
  { day: "Tue", sales: 5800 },
  { day: "Wed", sales: 4600 },
  { day: "Thu", sales: 7200 },
  { day: "Fri", sales: 6100 },
  { day: "Sat", sales: 8500 },
  { day: "Sun", sales: 7600 },
];

const stockData = [
  { name: "In Stock", value: 65, color: "#4169e1" },
  { name: "Low Stock", value: 25, color: "#f5a623" },
  { name: "Out of Stock", value: 10, color: "#ef6461" },
];

const recentBills = [
  { id: "INV-1024", customer: "Rahul Sharma", date: "19 Oct 2026", amount: 4250, status: "Paid" },
  { id: "INV-1023", customer: "Priya Verma", date: "19 Oct 2026", amount: 1850, status: "Paid" },
  { id: "INV-1022", customer: "Aman Gupta", date: "18 Oct 2026", amount: 3200, status: "Pending" },
  { id: "INV-1021", customer: "Neha Singh", date: "18 Oct 2026", amount: 950, status: "Paid" },
];

const topProducts = [
  { name: "Wireless Mouse", category: "Accessories", sold: 124, stock: 18 },
  { name: "Mechanical Keyboard", category: "Accessories", sold: 98, stock: 7 },
  { name: "USB-C Hub", category: "Electronics", sold: 76, stock: 32 },
  { name: "Laptop Stand", category: "Accessories", sold: 64, stock: 0 },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({ title, value, change, positive, icon: Icon, note }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>
        <div className="stat-icon">
          <Icon size={20} />
        </div>
      </div>

      <h2>{value}</h2>

      <div className="stat-bottom">
        <span className={positive ? "stat-change positive" : "stat-change negative"}>
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </span>
        <span className="stat-note">{note}</span>
      </div>
    </article>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Here's what's happening with your store today.</p>
        </div>

        <button className="dashboard-date-button" type="button">
          <span>Last 7 days</span>
          <span>⌄</span>
        </button>
      </div>

      <section className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(124580)}
          change="+12.8%"
          positive
          icon={IndianRupee}
          note="vs. last week"
        />
        <StatCard
          title="Total Orders"
          value="1,248"
          change="+8.2%"
          positive
          icon={ShoppingCart}
          note="vs. last week"
        />
        <StatCard
          title="Total Products"
          value="356"
          change="+4.5%"
          positive
          icon={Package}
          note="vs. last week"
        />
        <StatCard
          title="Total Customers"
          value="892"
          change="-2.4%"
          positive={false}
          icon={Users}
          note="vs. last week"
        />
      </section>

      <section className="dashboard-charts">
        <article className="panel sales-panel">
          <div className="panel-heading">
            <div>
              <h3>Sales Overview</h3>
              <p>Revenue generated over the last 7 days</p>
            </div>
            <button className="icon-button" type="button" aria-label="More options">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="sales-summary">
            <h2>{formatCurrency(44000)}</h2>
            <span className="summary-positive">
              <ArrowUpRight size={15} /> 12.8%
            </span>
          </div>

          <div className="sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 12, right: 8, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4169e1" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#4169e1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf0f5" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8b95a7", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8b95a7", fontSize: 11 }} />
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
              <p>Current inventory breakdown</p>
            </div>
            <button className="icon-button" type="button" aria-label="More options">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="stock-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  stroke="none"
                >
                  {stockData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="stock-chart-center">
              <strong>356</strong>
              <span>Products</span>
            </div>
          </div>

          <div className="stock-legend">
            {stockData.map((item) => (
              <div className="legend-item" key={item.name}>
                <span className="legend-label">
                  <span className="legend-dot" style={{ background: item.color }} />
                  {item.name}
                </span>
                <strong>{item.value}%</strong>
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
            <button className="text-button" type="button">View all</button>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="bill-id">{bill.id}</td>
                    <td>{bill.customer}</td>
                    <td>{bill.date}</td>
                    <td className="amount-cell">{formatCurrency(bill.amount)}</td>
                    <td>
                      <span className={`status-badge ${bill.status.toLowerCase()}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel products-panel">
          <div className="panel-heading">
            <div>
              <h3>Top Selling Products</h3>
              <p>Popular items this week</p>
            </div>
            <button className="icon-button" type="button" aria-label="More options">
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="top-products-list">
            {topProducts.map((product, index) => (
              <div className="top-product" key={product.name}>
                <div className="product-rank">{index + 1}</div>
                <div className="top-product-info">
                  <strong>{product.name}</strong>
                  <span>{product.category} · {product.sold} sold</span>
                </div>
                <span className={`product-stock ${product.stock === 0 ? "out" : product.stock < 10 ? "low" : ""}`}>
                  {product.stock === 0 ? "Out" : `${product.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <p className="dashboard-disclaimer">
        Demo dashboard data — connect your backend to display live store information.
      </p>
    </div>
  );
}
