import React, { useEffect, useState } from "react";
import { fetchProducts, fetchUsers, createUser, deleteUser, createProduct, deleteProduct } from "./api.js";

// Icons as SVG components
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const BoxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      className={`tab-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="tab-icon">{icon}</span>
      <span className="tab-label">{label}</span>
      {count !== undefined && <span className="tab-count">{count}</span>}
    </button>
  );
}

function AddForm({ fields, onSubmit, onCancel, submitLabel }) {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <input
          key={field.name}
          type={field.type || "text"}
          placeholder={field.placeholder}
          value={formData[field.name] || ""}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          required={field.required !== false}
        />
      ))}
      <div className="form-actions">
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Adding..." : submitLabel}
        </button>
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function UserCard({ user, onDelete }) {
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase();
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
  const colorIndex = user.id.charCodeAt(1) % colors.length;
  
  return (
    <div className="user-card">
      <div className="user-avatar" style={{ backgroundColor: colors[colorIndex] }}>
        {initials}
      </div>
      <div className="user-info">
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
      </div>
      <div className="card-actions">
        <span className="user-id">ID: {user.id}</span>
        <button className="delete-btn" onClick={() => onDelete(user.id)} title="Delete user">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product, onDelete }) {
  return (
    <div className="product-card">
      <div className="product-image">
        <BoxIcon />
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">
          <span className="price-amount">${parseFloat(product.price).toFixed(2)}</span>
          <span className="price-currency">{product.currency}</span>
        </div>
      </div>
      <div className="card-actions">
        <span className="product-id">SKU: {product.id}</span>
        <button className="delete-btn" onClick={() => onDelete(product.id)} title="Delete product">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading data...</p>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          <RefreshIcon /> Try Again
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function loadData(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    setLoading(true);
    setError("");
    try {
      const [u, p] = await Promise.all([fetchUsers(), fetchProducts()]);
      setUsers(u || []);
      setProducts(p || []);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const refresh = () => loadData(true);

  const handleAddUser = async (formData) => {
    await createUser(formData.name, formData.email);
    setShowAddForm(false);
    await loadData();
  };

  const handleAddProduct = async (formData) => {
    await createProduct(formData.name, parseFloat(formData.price), formData.currency || "USD");
    setShowAddForm(false);
    await loadData();
  };

  const handleDeleteUser = async (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteUser(id);
      await loadData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      await loadData();
    }
  };

  const userFields = [
    { name: "name", placeholder: "Full Name", required: true },
    { name: "email", placeholder: "Email Address", type: "email", required: true }
  ];

  const productFields = [
    { name: "name", placeholder: "Product Name", required: true },
    { name: "price", placeholder: "Price", type: "number", step: "0.01", required: true },
    { name: "currency", placeholder: "Currency (e.g. USD)", defaultValue: "USD" }
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <DatabaseIcon />
            <h1>Microservices Dashboard</h1>
          </div>
          <div className="header-actions">
            <button 
              className={`refresh-button ${refreshing ? "refreshing" : ""}`} 
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
        <div className="status-bar">
          <span className="status-indicator connected"></span>
          <span>Database Connected</span>
          <span className="status-divider">|</span>
          <span>PostgreSQL</span>
        </div>
      </header>

      <main className="main">
        <div className="tabs">
          <TabButton
            active={activeTab === "users"}
            onClick={() => { setActiveTab("users"); setShowAddForm(false); }}
            icon={<UserIcon />}
            label="Users"
            count={users.length}
          />
          <TabButton
            active={activeTab === "products"}
            onClick={() => { setActiveTab("products"); setShowAddForm(false); }}
            icon={<BoxIcon />}
            label="Products"
            count={products.length}
          />
        </div>

        {error && <ErrorMessage message={error} onRetry={refresh} />}
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="content">
            {!showAddForm && (
              <button className="add-button" onClick={() => setShowAddForm(true)}>
                <PlusIcon />
                Add {activeTab === "users" ? "User" : "Product"}
              </button>
            )}

            {showAddForm && (
              <div className="form-card">
                <div className="form-header">
                  <h3>Add New {activeTab === "users" ? "User" : "Product"}</h3>
                  <button className="close-btn" onClick={() => setShowAddForm(false)}>
                    <CloseIcon />
                  </button>
                </div>
                <AddForm
                  fields={activeTab === "users" ? userFields : productFields}
                  onSubmit={activeTab === "users" ? handleAddUser : handleAddProduct}
                  onCancel={() => setShowAddForm(false)}
                  submitLabel={`Add ${activeTab === "users" ? "User" : "Product"}`}
                />
              </div>
            )}

            {activeTab === "users" && (
              <div className="grid users-grid">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} onDelete={handleDeleteUser} />
                ))}
                {users.length === 0 && (
                  <div className="empty-state">No users found</div>
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="grid products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} />
                ))}
                {products.length === 0 && (
                  <div className="empty-state">No products found</div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Full-Stack Microservices Demo • React + Express + PostgreSQL</p>
      </footer>
    </div>
  );
}
