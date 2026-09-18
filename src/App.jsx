import { useEffect, useState } from "react";
import { adminApi } from "./services/api";
import AdminLogin from "./components/auth/AdminLogin";
import AdminLayout from "./components/layout/AdminLayout";
import AdminRoutes from "./routes/AdminRoutes";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nm_admin_user")) || null; } catch { return null; }
  });
  const logout = () => { localStorage.removeItem("nm_admin_token"); localStorage.removeItem("nm_admin_user"); setUser(null); };
  useEffect(() => {
    if (!user || !localStorage.getItem("nm_admin_token")) return;
    adminApi.me().then(result => { if (result.user.role !== "admin") throw new Error("Admin access required"); localStorage.setItem("nm_admin_user", JSON.stringify(result.user)); }).catch(logout);
  }, [user]);
  return user ? <AdminLayout onLogout={logout}><AdminRoutes/></AdminLayout> : <AdminLogin onLogin={setUser}/>;
}
