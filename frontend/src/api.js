function getApiBaseUrl() {
  if (typeof window === "undefined") return "";
  const env = window.__ENV__;
  const base = env && env.API_BASE_URL ? env.API_BASE_URL : "";
  // Avoid double slashes when composing URLs
  return base.replace(/\/$/, "");
}

async function apiFetchJson(path, options = {}) {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path; // fallback: same-origin (/api/...)

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }

  return data;
}

export function fetchUsers() {
  return apiFetchJson("/api/users");
}

export function fetchProducts() {
  return apiFetchJson("/api/products");
}

export function createUser(name, email) {
  return apiFetchJson("/api/users", {
    method: "POST",
    body: { name, email }
  });
}

export function deleteUser(id) {
  return apiFetchJson(`/api/users/${id}`, {
    method: "DELETE"
  });
}

export function createProduct(name, price, currency = "USD") {
  return apiFetchJson("/api/products", {
    method: "POST",
    body: { name, price, currency }
  });
}

export function deleteProduct(id) {
  return apiFetchJson(`/api/products/${id}`, {
    method: "DELETE"
  });
}
