const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "appdb",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppassword",
});

// Initialize database table and seed data
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create products table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL
      )
    `);

    // Check if table is empty and seed data
    const result = await client.query("SELECT COUNT(*) FROM products");
    if (parseInt(result.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO products (id, name, price, currency) VALUES
        ('p1', 'Wireless Keyboard', 49.99, 'USD'),
        ('p2', 'Noise-Canceling Headphones', 129.99, 'USD'),
        ('p3', 'USB-C Hub (7-in-1)', 39.50, 'USD')
      `);
      console.log("Seeded products data");
    }
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err.message);
  } finally {
    client.release();
  }
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.json({ status: "ok", database: "disconnected" });
  }
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching product:", err.message);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/products", async (req, res) => {
  try {
    const { name, price, currency } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: "Name and price are required" });
    }
    const id = "p" + Date.now();
    const result = await pool.query(
      "INSERT INTO products (id, name, price, currency) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, name, price, currency || "USD"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating product:", err.message);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.delete("/products/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted", product: result.rows[0] });
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 3002);

app.listen(port, "0.0.0.0", async () => {
  console.log(`product-service listening on 0.0.0.0:${port}`);
  await initDatabase();
});
