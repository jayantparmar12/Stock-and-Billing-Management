
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Copy, Check, LogOut, UserCheck } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}") || {};
  } catch {
    user = {};
  }

  const handleCopyShopCode = async () => {
    if (!user.shopCode) return;

    try {
      await navigator.clipboard.writeText(user.shopCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy shop code:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      {/* Left: Shop Name and Shop Code */}
      <div className="navbar-left">
        <div className="navbar-shop">
          <Store size={16} />
          <span>{user.shopName || "My Shop Workspace"}</span>
        </div>

        {user.shopCode && (
          <button
            type="button"
            className="navbar-shop-code"
            onClick={handleCopyShopCode}
            title="Copy Shop Code to share with your Staff"
          >
            <span>Shop Code: {user.shopCode}</span>
            {copied ? (
              <Check size={13} color="#16a34a" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        )}
      </div>

      {/* Right: User, Role and Logout */}
      <div className="navbar-right">
        <div className="navbar-user">
          <UserCheck size={16} color="#475569" />

          <strong>{user.name || "User"}</strong>

          <span
            className={`navbar-role ${
              user.role === "ADMIN" ? "admin" : "staff"
            }`}
          >
            {user.role || "STAFF"}
          </span>
        </div>

        <button
          type="button"
          className="navbar-logout"
          onClick={handleLogout}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
}
