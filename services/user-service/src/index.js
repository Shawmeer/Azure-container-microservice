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
    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      )
    `);

    // Check if table is empty and seed data
    const result = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(result.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO users (id, name, email) VALUES
        ('u1', 'Alice Johnson', 'alice@example.com'),
        ('u2', 'Bob Smith', 'bob@example.com'),
        ('u3', 'Carol White', 'carol@example.com')
      `);
      console.log("Seeded users data");
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

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    // Generate a simple ID
    const id = "u" + Date.now();
    const result = await pool.query(
      "INSERT INTO users (id, name, email) VALUES ($1, $2, $3) RETURNING *",
      [id, name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted", user: result.rows[0] });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 3001);

app.listen(port, "0.0.0.0", async () => {
  console.log(`user-service listening on 0.0.0.0:${port}`);
  await initDatabase();
});
