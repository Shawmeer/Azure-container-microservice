const express = require("express");
const path = require("path");

const app = express();

const port = Number(process.env.PORT || process.env.WEBSITES_PORT || 3000);
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8080";

// Runtime env injection for Vite SPA.
// React code reads `window.__ENV__.API_BASE_URL` to build API URLs.
app.get("/env.js", (req, res) => {
  res.type("application/javascript");
  res.send(`window.__ENV__ = ${JSON.stringify({ API_BASE_URL: apiBaseUrl })};`);
});

const distDir = path.join(__dirname, "dist");
app.use(express.static(distDir));

// SPA fallback (Express 5 doesn't like `app.get("*", ...)`)
app.use((req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`frontend listening on 0.0.0.0:${port}`);
});

