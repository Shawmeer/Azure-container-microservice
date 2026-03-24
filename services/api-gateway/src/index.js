const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN || "*";
const corsOptions =
  corsOrigin === "*"
    ? { origin: "*" }
    : { origin: corsOrigin.split(",").map((s) => s.trim()).filter(Boolean) };

app.use(cors(corsOptions));

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

if (!USER_SERVICE_URL) {
  throw new Error("Missing USER_SERVICE_URL env var");
}
if (!PRODUCT_SERVICE_URL) {
  throw new Error("Missing PRODUCT_SERVICE_URL env var");
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", gateway: true });
});

app.get("/", (req, res) => {
  res.json({
    name: "api-gateway",
    endpoints: ["/api/users", "/api/products"]
  });
});

async function proxyRequest(req, res, upstreamBaseUrl, upstreamPath) {
  const url = `${upstreamBaseUrl}${upstreamPath}`;

  const upstreamRes = await fetch(url, {
    method: req.method,
    headers: {
      "accept": "application/json",
      "content-type": "application/json"
    },
    body: req.method !== "GET" && req.method !== "DELETE" ? JSON.stringify(req.body) : undefined
  });

  const contentType = upstreamRes.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  }

  const text = await upstreamRes.text();
  return res.status(upstreamRes.status).json({ data: text });
}

// User endpoints
app.get("/api/users", async (req, res) => {
  try {
    await proxyRequest(req, res, USER_SERVICE_URL, "/users");
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch users", details: String(err) });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    await proxyRequest(req, res, USER_SERVICE_URL, "/users");
  } catch (err) {
    res.status(502).json({ error: "Failed to create user", details: String(err) });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await proxyRequest(req, res, USER_SERVICE_URL, `/users/${req.params.id}`);
  } catch (err) {
    res.status(502).json({ error: "Failed to delete user", details: String(err) });
  }
});

// Product endpoints
app.get("/api/products", async (req, res) => {
  try {
    await proxyRequest(req, res, PRODUCT_SERVICE_URL, "/products");
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch products", details: String(err) });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    await proxyRequest(req, res, PRODUCT_SERVICE_URL, "/products");
  } catch (err) {
    res.status(502).json({ error: "Failed to create product", details: String(err) });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await proxyRequest(req, res, PRODUCT_SERVICE_URL, `/products/${req.params.id}`);
  } catch (err) {
    res.status(502).json({ error: "Failed to delete product", details: String(err) });
  }
});

const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 8080);

app.listen(port, "0.0.0.0", () => {
  console.log(`api-gateway listening on 0.0.0.0:${port}`);
});
