
import { Bell, Search } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="top-navbar">
      <div className="navbar-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search anything..."
          aria-label="Search"
        />
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="notification-button"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="notification-dot"></span>
        </button>

        <div className="navbar-divider"></div>

        <div className="navbar-user">
          <div className="user-avatar">A</div>
          <div className="user-details">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
