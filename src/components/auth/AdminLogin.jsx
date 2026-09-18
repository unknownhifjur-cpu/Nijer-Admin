import { useState } from "react";
import { adminApi } from "../../services/api";

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async event => { event.preventDefault(); setError(""); try { const result = await adminApi.login(form); localStorage.setItem("nm_admin_token", result.token); localStorage.setItem("nm_admin_user", JSON.stringify(result.user)); onLogin(result.user); } catch (err) { setError(err.message); } };
  return <div className="admin-login"><form onSubmit={submit} className="admin-auth-card"><div className="admin-brand-wrap"><img src="/logo.png" alt="NIJER MARKET logo" className="admin-brand-logo" /></div><h1>Admin Login</h1><p>Manage products, orders and customers.</p><label>Email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/></label><label>Password<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })}/></label>{error && <div className="error">{error}</div>}<button>Sign in</button></form></div>;
}