
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  Receipt,
  CreditCard,
  RotateCcw,
  History,
  Boxes,
} from "lucide-react";
import "./Sidebar.css";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Products", path: "/products", icon: Package },
  { name: "Categories", path: "/categories", icon: Tags },
  { name: "Customers", path: "/customers", icon: Users },
  { name: "Billing", path: "/billing", icon: Receipt },
  { name: "Payments", path: "/payments", icon: CreditCard },
  { name: "Refunds", path: "/refunds", icon: RotateCcw },
  { name: "Stock History", path: "/stock-history", icon: History },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Boxes size={22} />
        </div>

        <div className="brand-text">
          <h2>StockFlow</h2>
          <span>Inventory & Billing</span>
        </div>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-icon">S</div>
        <div>
          <strong>Inventory System</strong>
          <span>Management Portal</span>
        </div>
      </div>
    </aside>
  );
}
