const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api")).replace(/\/$/, "");

async function request(path, options = {}) {
  const token = localStorage.getItem("nm_admin_token");
  const isFormData = options.body instanceof FormData;
  const headers = { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const adminApi = {
  login: body => request("/auth/admin-login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request("/auth/me"), stats: () => request("/admin/stats"), customers: () => request("/admin/customers"), orders: () => request("/admin/orders"),
  announcements: () => request("/admin/announcements"), createAnnouncement: body => request("/admin/announcements", { method: "POST", body: JSON.stringify(body) }),
  deleteAnnouncement: id => request(`/admin/announcements/${id}`, { method: "DELETE" }), updateOrder: (id, status) => request(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  confirmPayment: id => request(`/admin/orders/${id}/payment/confirm`, { method: "PATCH" }), rejectPayment: id => request(`/admin/orders/${id}/payment/reject`, { method: "PATCH" }),
  products: () => request("/products"), uploadImage: file => { const body = new FormData(); body.append("image", file); return request("/uploads/image", { method: "POST", body }); },
  createProduct: body => request("/admin/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) }), deleteProduct: id => request(`/admin/products/${id}`, { method: "DELETE" })
};
