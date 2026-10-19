import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Edit3, FolderTree, Package, Plus, RefreshCw, Search, ShoppingCart, Trash2, TrendingUp, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../services/api";
import { money } from "../utils/format";
import ImageUploader from "../components/common/ImageUploader";

export function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, customers: 0, revenue: 0, statusBreakdown: {}, categoryBreakdown: {}, lowStock: [], recentOrders: [] });
  const [error, setError] = useState("");
  const load = () => { setError(""); adminApi.stats().then(setStats).catch(err => setError(err.message)); };
  useEffect(() => { adminApi.stats().then(setStats).catch(err => setError(err.message)); }, []);
  if (error) return <div className="state-panel"><AlertTriangle/><h2>Dashboard unavailable</h2><p>{error}</p><button className="admin-btn" onClick={load}>Try again</button></div>;
  const cards = [["Revenue", money(stats.revenue), TrendingUp, "Across non-cancelled orders"], ["Orders", stats.orders, ShoppingCart, "All placed orders"], ["Customers", stats.customers, Users, "Registered shoppers"], ["Products", stats.products, Package, "Active catalogue"]];
  const categories = Object.entries(stats.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return <div className="dashboard-page"><div className="admin-top"><div><div className="eyebrow">Store overview</div><h1>Good morning, Admin</h1><p>Here is what is happening across NIJER MARKET today.</p></div><div className="top-actions"><button className="icon-action" title="Refresh dashboard" onClick={load}><RefreshCw/></button><Link to="/products" className="admin-btn"><Plus/> Add Product</Link></div></div>
    <div className="stats-grid">{cards.map(([name, value, Icon, hint]) => <div className="stat-card" key={name}><div className="stat-icon"><Icon/></div><span>{name}</span><b>{value}</b><small>{hint}</small></div>)}</div>
    <div className="analytics-grid"><section className="admin-panel analytics-panel"><div className="panel-heading"><div><h2>Order pipeline</h2><p>Current fulfilment mix</p></div><Link to="/orders">View orders <ArrowUpRight size={16}/></Link></div>{Object.entries(stats.statusBreakdown || {}).map(([status, count]) => <div className="pipeline-row" key={status}><span>{status}</span><strong>{count}</strong></div>)}</section><section className="admin-panel analytics-panel"><div className="panel-heading"><div><h2>Catalogue mix</h2><p>Products by category</p></div><Link to="/products">Manage <ArrowUpRight size={16}/></Link></div>{categories.map(([category, count]) => <div className="bar-row" key={category}><div><span>{category}</span><b>{count}</b></div><div className="bar-track"><i style={{ width: `${Math.max(12, count / Math.max(...categories.map(item => item[1])) * 100)}%` }}/></div></div>)}</section></div>
    <div className="dashboard-columns"><section className="admin-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>Latest activity from shoppers</p></div><Link to="/orders">See all <ArrowUpRight size={16}/></Link></div>{stats.recentOrders?.map(order => <div className="mini-order" key={order._id}><span>#{String(order._id).slice(-8)}</span><b>{order.customerName || order.customerEmail || "Customer"}</b><strong>{money(order.total)}</strong></div>)}</section><section className="admin-panel"><div className="panel-heading"><div><h2>Stock watch</h2><p>Items that need attention</p></div><Link to="/products">Inventory <ArrowUpRight size={16}/></Link></div>{stats.lowStock?.map(product => <div className="stock-row" key={product._id}><img src={product.image} alt=""/><div><b>{product.name}</b><small>{product.category}</small></div><strong>{product.stock} left</strong></div>)}</section></div>
  </div>;
}

const blankProduct = { name: "", nameBn: "", nameBanglish: "", aliases: [], brand: "", tags: [], category: "", price: 0, mrp: 0, discount: 0, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80", unit: "1 piece", stock: 10, badge: "Popular", description: "" };

const listValue = value => Array.isArray(value) ? value.join(", ") : value || "";
const listFromInput = value => value.split(",").map(item => item.trim()).filter(Boolean);
function categoryPath(product, categories) {
 const main = categories.find(category => category._id === product.mainCategoryId);
 const subcategory = main?.subcategories?.find(item => item._id === product.subcategoryId);
 return main && subcategory ? `${main.name} / ${subcategory.name}` : product.category || "Needs category mapping";
}

function ProductModal({ product, onClose, onSaved, categories, onRefreshCategories }) {
  const [form, setForm] = useState(product);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const mainCategories = categories.filter(category => !category.parentId && category.isActive);
  const selectedMain = mainCategories.find(category => category._id === form.mainCategoryId);
  const subcategories = selectedMain?.subcategories?.filter(category => category.isActive) || [];
  const submit = async event => {
   event.preventDefault(); setError(""); setSaving(true);
   try {
    const productData = { ...form, mainCategoryId: form.mainCategoryId, subcategoryId: form.subcategoryId, category: categoryPath({ ...form, category: "" }, categories).split(" / ").pop() };
    if (product._id) await adminApi.updateProduct(product._id, productData); else await adminApi.createProduct(productData);
    onSaved();
   } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };
  const createCategory = async event => {
   event.preventDefault(); setError(""); setCreatingCategory(true);
   try {
    const created = await adminApi.createCategory({ name: newCategoryName, parentId: newCategoryType === "subcategory" ? form.mainCategoryId : null });
    const refreshed = await onRefreshCategories();
    if (newCategoryType === "subcategory") setForm(current => ({ ...current, subcategoryId: created._id }));
    else setForm(current => ({ ...current, mainCategoryId: created._id, subcategoryId: "" }));
    setNewCategoryType(""); setNewCategoryName("");
    if (!refreshed) throw new Error("Category was created, but the category list could not be refreshed. Please retry.");
   } catch (categoryError) { setError(categoryError.message); } finally { setCreatingCategory(false); }
  };
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>{product._id ? "Edit" : "Add"} Product</h2><button type="button" onClick={onClose} aria-label="Close product form"><X/></button></div><form onSubmit={submit} className="product-form">
   <label>Product name<input required value={form.name || ""} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
   {["nameBn", "nameBanglish", "brand", "unit", "badge", "description"].map(key => <label key={key}>{key}<input value={form[key] || ""} onChange={event => setForm({ ...form, [key]: event.target.value })}/></label>)}
   <div className="product-category-fields">
    <label>Main category<select required value={form.mainCategoryId || ""} onChange={event => setForm({ ...form, mainCategoryId: event.target.value, subcategoryId: "" })}><option value="">Select a main category</option>{mainCategories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
    <label>Subcategory<select required disabled={!selectedMain} value={form.subcategoryId || ""} onChange={event => setForm({ ...form, subcategoryId: event.target.value })}><option value="">Select a subcategory</option>{subcategories.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
    <div className="product-category-actions"><button type="button" className="category-inline-button" onClick={() => { setNewCategoryType("main"); setNewCategoryName(""); setError(""); }}>+ Create New Category</button><button type="button" className="category-inline-button" disabled={!selectedMain} onClick={() => { setNewCategoryType("subcategory"); setNewCategoryName(""); setError(""); }}>+ Create New Subcategory</button></div>
    {newCategoryType && <div className="category-inline-form"><label>{newCategoryType === "main" ? "New main category name" : `New subcategory under ${selectedMain?.name}`}<input autoFocus required maxLength={80} value={newCategoryName} onChange={event => setNewCategoryName(event.target.value)}/></label><div><button type="button" className="secondary-btn" onClick={() => setNewCategoryType("")}>Cancel</button><button type="button" className="admin-btn" disabled={creatingCategory || !newCategoryName.trim()} onClick={createCategory}>{creatingCategory ? "Creating..." : "Create and select"}</button></div></div>}
    {product._id && !product.mainCategoryId && <p className="category-mapping-note">Legacy category: {product.category || "not set"}. Choose a main category and subcategory to map this product.</p>}
   </div>
   <label>Aliases<input placeholder="alu, aloo, potato" value={listValue(form.aliases)} onChange={event => setForm({ ...form, aliases: listFromInput(event.target.value) })}/></label>
   <label>Search tags<input placeholder="fresh, vegetable" value={listValue(form.tags)} onChange={event => setForm({ ...form, tags: listFromInput(event.target.value) })}/></label>
   <ImageUploader value={form.image} onChange={image => setForm({ ...form, ...image })}/>
   <div className="two"><label>Price<input type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })}/></label><label>MRP<input type="number" min="0" value={form.mrp} onChange={event => setForm({ ...form, mrp: Number(event.target.value) })}/></label></div>
   <div className="two"><label>Discount<input type="number" min="0" value={form.discount} onChange={event => setForm({ ...form, discount: Number(event.target.value) })}/></label><label>Stock<input type="number" min="0" value={form.stock} onChange={event => setForm({ ...form, stock: Number(event.target.value) })}/></label></div>
   {error && <div className="error" role="alert">{error}</div>}<button className="admin-btn full" disabled={saving}>{saving ? "Saving..." : "Save Product"}</button>
  </form></div></div>;
}

export function Products() {
 const [products, setProducts] = useState([]);
 const [categories, setCategories] = useState([]);
 const [error, setError] = useState("");
 const [editing, setEditing] = useState(null);
 const loadProducts = useCallback(() => adminApi.products().then(setProducts).catch(err => setError(err.message)), []);
 const loadCategories = useCallback(() => adminApi.categories().then(result => { setCategories(result.categories || []); setError(""); return result.categories || []; }).catch(err => { setError(err.message); return null; }), []);
 const load = useCallback(() => Promise.all([loadProducts(), loadCategories()]), [loadProducts, loadCategories]);
 useEffect(() => { load(); }, [load]);
 return <div><div className="admin-top"><div><h1>Products</h1><p>Manage your store inventory.</p></div><button className="admin-btn" onClick={() => setEditing(blankProduct)}><Plus/> Add Product</button></div>
  {error && <div className="error" role="alert">{error}</div>}
  <div className="admin-panel"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead><tbody>{products.map(product => <tr key={product._id}><td><div className="table-product"><img src={product.image} alt=""/><span>{product.name}</span></div></td><td>{categoryPath(product, categories)}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><button className="icon" onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}><Edit3/></button><button className="icon danger" onClick={async () => { if (confirm("Delete this product?")) { await adminApi.deleteProduct(product._id); load(); } }} aria-label={`Delete ${product.name}`}><Trash2/></button></td></tr>)}</tbody></table></div>
  {editing && <ProductModal product={editing} categories={categories} onRefreshCategories={loadCategories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}/>}
 </div>;
}

function CategoryEditor({ category, parentId, onClose, onSaved }) {
 const [form, setForm] = useState(category || { name: "", description: "", image: "", displayOrder: 0, isActive: true, showOnHome: !parentId });
 const [error, setError] = useState("");
 const [saving, setSaving] = useState(false);
 const submit = async event => {
  event.preventDefault(); setError(""); setSaving(true);
  try {
   const payload = { ...form, parentId: category ? category.parentId || null : parentId || null };
   if (category) await adminApi.updateCategory(category._id, payload);
   else await adminApi.createCategory(payload);
   await onSaved();
  } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
 };
 return <div className="modal-backdrop"><div className="modal category-editor-modal"><div className="modal-head"><h2>{category ? "Edit Category" : parentId ? "Add Subcategory" : "Add Main Category"}</h2><button type="button" onClick={onClose} aria-label="Close category form"><X/></button></div>
  <form className="product-form" onSubmit={submit}>
   <label>Category name<input required maxLength={80} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
   <label>Description<textarea maxLength={500} rows={3} value={form.description || ""} onChange={event => setForm({ ...form, description: event.target.value })}/></label>
   <label>Image URL<input type="url" value={form.image || ""} onChange={event => setForm({ ...form, image: event.target.value })}/></label>
   <label>Display order<input type="number" min={0} step={1} value={form.displayOrder ?? 0} onChange={event => setForm({ ...form, displayOrder: Number(event.target.value) })}/></label>
   <label className="category-checkbox"><input type="checkbox" checked={form.isActive !== false} onChange={event => setForm({ ...form, isActive: event.target.checked })}/> Active and visible in Shop</label>
   {!parentId && <label className="category-checkbox"><input type="checkbox" checked={form.showOnHome !== false} onChange={event => setForm({ ...form, showOnHome: event.target.checked })}/> Show on Home when products are assigned</label>}
   {error && <div className="error" role="alert">{error}</div>}
   <button className="admin-btn full" disabled={saving}>{saving ? "Saving..." : "Save Category"}</button>
  </form>
 </div></div>;
}

export function Categories() {
 const [categories, setCategories] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [editor, setEditor] = useState(null);
 const load = useCallback(async () => {
  try { const result = await adminApi.categories(); setCategories(result.categories || []); setError(""); }
  catch (loadError) { setError(loadError.message); }
  finally { setLoading(false); }
 }, []);
 useEffect(() => {
  let cancelled = false;
  const fetchInitialCategories = async () => {
   try {
    const result = await adminApi.categories();
    if (!cancelled) { setCategories(result.categories || []); setError(""); }
   } catch (loadError) {
    if (!cancelled) setError(loadError.message);
   } finally {
    if (!cancelled) setLoading(false);
   }
  };
  void fetchInitialCategories();
  return () => { cancelled = true; };
 }, []);
 const save = async () => { await load(); setEditor(null); };
 const toggle = async category => {
  try { await adminApi.updateCategory(category._id, { isActive: category.isActive === false }); await load(); }
  catch (updateError) { setError(updateError.message); }
 };
 const remove = async category => {
  if (!confirm(`Delete "${category.name}"? Categories with subcategories or products must be reassigned first.`)) return;
  try { await adminApi.deleteCategory(category._id); await load(); }
  catch (deleteError) { setError(deleteError.message); }
 };
 return <div><div className="admin-top"><div><h1>Categories</h1><p>Organize products into main categories and subcategories.</p></div><button type="button" className="admin-btn" onClick={() => setEditor({ parentId: null })}><Plus/> Add Main Category</button></div>
  {error && <div className="error" role="alert">{error}<button type="button" className="category-inline-button" onClick={load}>Retry</button></div>}
  {loading ? <div className="empty-admin">Loading categories…</div> : !categories.length ? <div className="empty-admin">No categories yet. Add a main category to get started.</div> :
   <div className="category-manager-list">{categories.map(main => <section className="admin-panel category-manager-main" key={main._id}>
    <header className="category-manager-heading"><div className="category-manager-icon"><FolderTree size={20}/></div><div className="category-manager-name"><h2>{main.name}</h2><span>{main.productCount || 0} products · {main.isActive === false ? "Inactive" : "Active"}{main.showOnHome ? " · Home" : ""}</span></div><div className="category-manager-actions"><button type="button" className="icon" onClick={() => setEditor(main)} aria-label={`Edit ${main.name}`}><Edit3/></button><button type="button" className="icon" onClick={() => toggle(main)}>{main.isActive === false ? "Activate" : "Deactivate"}</button><button type="button" className="icon danger" onClick={() => remove(main)} aria-label={`Delete ${main.name}`}><Trash2/></button></div></header>
    <div className="category-manager-children">{(main.subcategories || []).map(subcategory => <div className="category-manager-child" key={subcategory._id}><div><strong>{subcategory.name}</strong><small>{subcategory.productCount || 0} products · {subcategory.isActive === false ? "Inactive" : "Active"}</small></div><div><button type="button" className="icon" onClick={() => setEditor(subcategory)} aria-label={`Edit ${subcategory.name}`}><Edit3/></button><button type="button" className="icon" onClick={() => toggle(subcategory)}>{subcategory.isActive === false ? "Activate" : "Deactivate"}</button><button type="button" className="icon danger" onClick={() => remove(subcategory)} aria-label={`Delete ${subcategory.name}`}><Trash2/></button></div></div>)}
     <button type="button" className="category-inline-button" onClick={() => setEditor({ parentId: main._id })}><Plus size={15}/> Add subcategory</button>
    </div>
   </section>)}</div>}
  {editor && <CategoryEditor category={editor._id ? editor : null} parentId={editor.parentId} onClose={() => setEditor(null)} onSaved={save}/>}
 </div>;
}

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState("");
  const [updating, setUpdating] = useState("");
  const load = () => adminApi.orders().then(setOrders).catch(err => setError(err.message));
  useEffect(() => { load(); }, []);
  const transitions = {
    Placed: ["Confirmed", "Cancelled"],
    Confirmed: ["Picking", "Cancelled"],
    Picking: ["Sorting", "Cancelled"],
    Sorting: ["Packing", "Cancelled"],
    Packing: ["Packed", "Cancelled"],
    Packed: ["Out for Delivery", "Cancelled"],
    "Out for Delivery": ["Delivered", "Failed Delivery"]
  };
  const updateStatus = async (order, status) => {
    if (status === "Cancelled" && !window.confirm(`Cancel order #${order.orderNumber || String(order._id).slice(-8)}?`)) return;
    setError("");
    setUpdating(order._id);
    try {
      await adminApi.updateOrder(order._id, status);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating("");
    }
  };
  const verify = async (id, action) => {
    const confirmation = action === "confirm"
      ? "Confirm that this UPI payment has been received?"
      : "Reject this payment? The customer will be asked to contact the shop.";
    if (!window.confirm(confirmation)) return;
    setError("");
    setVerifying(`${action}:${id}`);
    try {
      await (action === "confirm" ? adminApi.confirmPayment(id) : adminApi.rejectPayment(id));
      await adminApi.orders().then(setOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying("");
    }
  };
  return (
    <div>
      <div className="admin-top">
        <div><h1>Orders</h1><p>Track fulfillment and verify UPI payments.</p></div>
        <button className="icon-action" title="Refresh orders" onClick={load}><RefreshCw /></button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="admin-panel">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Payment</th><th>UTR</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{orders.map(order => {
            const paymentStatus = order.paymentStatus || (order.paymentMethod === "UPI" ? "payment_submitted" : "unpaid");
            const paymentLabel = paymentStatus === "payment_submitted" ? "Awaiting verification" : paymentStatus === "paid" ? "Received" : paymentStatus === "payment_rejected" ? "Rejected" : "Due on delivery";
            const location = order.deliveryAddress;
            const hasCoordinates = Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude) && location.latitude >= -90 && location.latitude <= 90 && location.longitude >= -180 && location.longitude <= 180;
            const mapUrl = hasCoordinates ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}` : "";
            const nextStatuses = transitions[order.status || "Placed"] || [];
            const availableStatuses = nextStatuses.filter(status =>
              (status !== "Confirmed" || order.paymentMethod !== "UPI" || paymentStatus === "paid") &&
              (status !== "Cancelled" || order.paymentMethod !== "UPI" || paymentStatus !== "paid")
            );
            return (
              <tr key={order._id}>
                <td><b>{order.orderNumber || `#${String(order._id).slice(-8)}`}</b><small>{order.items?.map(item => `${item.name} × ${item.quantity}`).join(", ") || "No items"} · {money(order.total)}</small></td>
                <td><b>{order.customerName || "Customer"}</b><br /><small>{order.phone || order.customerEmail || "No contact details"}</small></td>
                <td>
                  <small>{[location?.locality, location?.village, location?.postOffice, location?.district].filter(Boolean).join(", ") || order.address || "No address"}</small>
                  {hasCoordinates && <div className="admin-order-location"><a href={mapUrl} target="_blank" rel="noopener noreferrer">Open map</a></div>}
                </td>
                <td><strong>{order.paymentMethod || "COD"}</strong><small className={`admin-payment-status payment-${paymentStatus}`}>{paymentLabel}</small>
                  {paymentStatus === "payment_submitted" && <div className="payment-actions">
                    <button className="admin-btn" disabled={Boolean(verifying)} onClick={() => verify(order._id, "confirm")}>{verifying === `confirm:${order._id}` ? "Confirming…" : "Confirm received"}</button>
                    <button className="icon danger" disabled={Boolean(verifying)} onClick={() => verify(order._id, "reject")}>{verifying === `reject:${order._id}` ? "Rejecting…" : "Reject payment"}</button>
                  </div>}
                </td>
                <td>{order.utr || "—"}</td>
                <td>
                  <strong>{order.status || "Placed"}</strong>
                  {availableStatuses.length > 0 && (
                    <select
                      aria-label={`Update order ${order.orderNumber || String(order._id).slice(-8)}`}
                      value=""
                      disabled={Boolean(updating)}
                      onChange={event => updateStatus(order, event.target.value)}
                    >
                      <option value="" disabled>{updating === order._id ? "Updating…" : "Next action"}</option>
                      {availableStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  )}
                </td>
                <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td>
              </tr>
            );
          })}</tbody>
        </table>
        {!orders.length && <div className="empty-admin">No orders yet.</div>}
      </div>
    </div>
  );
}

export function Customers() { const [customers, setCustomers] = useState([]); const [query, setQuery] = useState(""); const load = () => adminApi.customers().then(setCustomers).catch(console.error); useEffect(() => { load(); }, []); const filtered = customers.filter(customer => [customer.name, customer.email].some(value => String(value || "").toLowerCase().includes(query.toLowerCase()))); return <div className="customers-page"><div className="admin-top"><div><div className="eyebrow">Relationship desk</div><h1>Customers</h1><p>Understand who shops with you and how often they return.</p></div><button className="icon-action" title="Refresh customers" onClick={load}><RefreshCw/></button></div><div className="admin-panel customer-directory"><div className="directory-toolbar"><div className="directory-title"><h2>Customer directory</h2><span>{filtered.length} visible</span></div><label className="admin-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or email"/></label></div><table className="customer-table"><thead><tr><th>Customer</th><th>Joined</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead><tbody>{filtered.map(customer => <tr key={customer._id}><td><b>{customer.name}</b><small>{customer.email}</small></td><td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "-"}</td><td>{customer.orders}</td><td>{money(customer.spent)}</td><td>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "No orders yet"}</td></tr>)}</tbody></table></div></div>; }

export function Announcements() { const [items, setItems] = useState([]); const [form, setForm] = useState({ title: "", message: "", type: "offer" }); const [error, setError] = useState(""); const load = () => adminApi.announcements().then(setItems).catch(err => setError(err.message)); useEffect(() => { load(); }, []); const submit = async event => { event.preventDefault(); try { await adminApi.createAnnouncement(form); setForm({ title: "", message: "", type: "offer" }); load(); } catch (err) { setError(err.message); } }; const remove = async id => { await adminApi.deleteAnnouncement(id); load(); }; return <div className="announcements-page"><div className="admin-top"><div><div className="eyebrow">Marketing</div><h1>Announcements</h1><p>Share offers, alerts and updates with your customers.</p></div></div><div className="admin-panel announcement-layout"><form className="announcement-form" onSubmit={submit}><h2>Create announcement</h2><label>Title<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/></label><label>Message<textarea required value={form.message} onChange={event => setForm({ ...form, message: event.target.value })}/></label><label>Type<select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="offer">Offer</option><option value="alert">Alert</option><option value="info">Info</option></select></label>{error && <div className="error">{error}</div>}<button className="admin-btn full">Publish announcement</button></form><div className="announcement-list-wrap"><h2>Published announcements</h2>{items.map(item => <article className={`announcement-card ${item.type || "info"}`} key={item._id}><div className="announcement-top"><span>{item.type}</span><button className="icon danger" onClick={() => remove(item._id)}><Trash2/></button></div><h3>{item.title}</h3><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</div></div></div>; }
