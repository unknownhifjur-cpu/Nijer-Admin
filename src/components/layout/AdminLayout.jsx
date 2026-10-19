import { useState } from "react";
import { Bell, FolderTree, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Users, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminLayout({ children, onLogout }) {
  const [menu, setMenu] = useState(false);
  return <div className="admin-shell"><aside className={menu ? "open" : ""}><div className="admin-brand-wrap"><img src="/logo.png" alt="NIJER MARKET logo" className="admin-brand-logo" /></div><nav><Link to="/"><LayoutDashboard/> Dashboard</Link><Link to="/products"><Package/> Products</Link><Link to="/categories"><FolderTree/> Categories</Link><Link to="/orders"><ShoppingCart/> Orders</Link><Link to="/customers"><Users/> Customers</Link><Link to="/announcements"><Bell/> Announcements</Link></nav><button className="logout" onClick={onLogout}><LogOut/> Logout</button></aside><button className="admin-mobile-menu" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button><main className="admin-main">{children}</main></div>;
}