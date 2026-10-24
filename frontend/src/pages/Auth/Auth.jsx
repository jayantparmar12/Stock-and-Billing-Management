import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, User, ShieldCheck, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
          }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const response = await api.post(endpoint, payload);

      if (response.data?.success && response.data.data) {
        const { token, id, name, email, role } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify({ id, name, email, role })
        );

        navigate("/", { replace: true });
      } else {
        setError(response.data?.message || "Authentication failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid credentials or server unreachable."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={24} />
          </div>
          <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
          <p>
            {isRegister
              ? "Register an Admin or Staff account for Inventory & Billing."
              : "Sign in to access your Inventory & Billing dashboard."}
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="auth-field">
              <span>Full Name</span>
              <div className="auth-input-wrap">
                <User size={16} />
                <input
                  type="text"
                  placeholder="e.g. Jayant Parmar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </label>
          )}

          <label className="auth-field">
            <span>Email Address</span>
            <div className="auth-input-wrap">
              <Mail size={16} />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <Lock size={16} />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </label>

          {isRegister && (
            <label className="auth-field">
              <span>Select Role</span>
              <select
                className="auth-role-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="ADMIN">ADMIN (Full Access)</option>
                <option value="STAFF">STAFF (Billing & View Only)</option>
              </select>
            </label>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            {isRegister ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
          >
            {isRegister ? "Sign In" : "Register Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
