
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import "./MainLayout.css";

export default function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        {/* <Navbar /> */}

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
