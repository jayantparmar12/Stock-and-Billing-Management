import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Copy, Check, LogOut, UserCheck, X, Menu } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const handleCopyShopCode = () => {
    if (!user.shopCode) return;
    navigator.clipboard?.writeText(user.shopCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"));
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="top-navbar">
        {/* Left: Mobile Hamburger Button + Shop Name & Copyable Shop Code */}
        <div className="top-navbar-left">
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={toggleMobileSidebar}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="shop-badge">
            <Store size={16} />
            <span>{user.shopName || "My Shop Workspace"}</span>
          </div>

          {user.shopCode && (
            <button
              type="button"
              className="shop-code-btn"
              onClick={handleCopyShopCode}
              title="Click to copy Shop Code for your Staff"
            >
              <span>Shop Code: {user.shopCode}</span>
              {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
            </button>
          )}
        </div>

        {/* Right: Logged-in User Name, Role Badge (ADMIN / STAFF) & Logout Button */}
        <div className="top-navbar-right">
          <div className="navbar-user-chip">
            <UserCheck size={15} />
            <strong className="navbar-user-name">
              {user.name || user.email || "Shop User"}
            </strong>
            <span
              className={`role-pill ${
                user.role === "ADMIN" ? "admin" : "staff"
              }`}
            >
              {user.role || "ADMIN"}
            </span>
          </div>

          <button
            type="button"
            className="navbar-logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={15} />
            <span className="logout-btn-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutModal && (
        <div
          className="logout-modal-backdrop"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="logout-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="navbar-logout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-top">
              <div className="logout-modal-icon">
                <LogOut size={22} />
              </div>
              <button
                type="button"
                className="logout-modal-close"
                onClick={() => setShowLogoutModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <h3 id="navbar-logout-title">Confirm Logout</h3>
            <p>
              Are you sure you want to log out of{" "}
              <strong>{user.shopName || "your shop account"}</strong>? You will
              need to sign in again to access your dashboard.
            </p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-confirm-btn"
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
