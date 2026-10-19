import { Routes, Route } from "react-router-dom";
import { Announcements, Categories, Customers, Dashboard, Orders, Products } from "../pages/AdminPages";

export default function AdminRoutes() {
  return <Routes><Route path="/" element={<Dashboard/>}/><Route path="/products" element={<Products/>}/><Route path="/categories" element={<Categories/>}/><Route path="/orders" element={<Orders/>}/><Route path="/customers" element={<Customers/>}/><Route path="/announcements" element={<Announcements/>}/></Routes>;
}
