import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ReceiptText,
  CreditCard,
  RotateCcw,
  History,
  LogOut,
  Store,
  X,
} from "lucide-react";
import "./Sidebar.css";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/billing", label: "Billing", icon: ReceiptText },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/refunds", label: "Refunds", icon: RotateCcw },
  { to: "/stock-history", label: "Stock History", icon: History },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    return () =>
      window.removeEventListener("toggle-mobile-sidebar", handleToggle);
  }, []);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setMobileOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-left">
            <div className="sidebar-logo">
              <Store size={20} />
            </div>
            <div>
              <h2>{user.shopName || "StockBilling"}</h2>
              <span>
                {user.shopCode ? `Code: ${user.shopCode}` : "Inventory ERP"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout Button */}
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-text">
              <strong>{user.name || "Shop User"}</strong>
              <span>{user.role || "ADMIN"}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutModal && (
        <div
          className="sidebar-logout-backdrop"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="sidebar-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sidebar-logout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-logout-top">
              <div className="sidebar-logout-icon">
                <LogOut size={22} />
              </div>
              <button
                type="button"
                className="sidebar-logout-close"
                onClick={() => setShowLogoutModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <h3 id="sidebar-logout-title">Confirm Logout</h3>
            <p>
              Are you sure you want to log out of{" "}
              <strong>{user.shopName || "your shop account"}</strong>? You will
              need to sign in again to access your dashboard.
            </p>

            <div className="sidebar-logout-actions">
              <button
                type="button"
                className="sidebar-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sidebar-confirm-btn"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
