import express from "express";
import dotenv from "dotenv";
import db from "./db/index.js";
import authRouter from "./routes/auth.js";
import cartRouter from "./routes/cart.js";
import walletRouter from "./routes/wallet.js";
import storesRouter from "./routes/stores.js";
import booksRouter from "./routes/books.js";
import checkoutRouter from "./routes/checkout.js";
import purchasesRouter from "./routes/purchases.js";
import noticiasRouter from "./routes/noticias.js";
import recommendationsRouter from "./routes/recommendations.js";

dotenv.config();

// Netlify NFT transpila ESM a CJS y envuelve los default exports; esto los normaliza.
const asRouter = (mod) => mod?.default?.default ?? mod?.default ?? mod;

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing environment variables: ${missingEnvVars.join(", ")}`);
  console.error("Please create a .env file with DATABASE_URL and JWT_SECRET.");
  process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check route with database connection test
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.status(200).json({
      message: "✅ Backend is running",
      timestamp: result.rows[0].now,
      status: "connected"
    });
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(500).json({
      error: "Database connection failed",
      message: err.message,
      status: "disconnected"
    });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.status(200).json({ status: "healthy", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", database: "disconnected", error: err.message });
  }
});

// Auth routes
app.use("/api/auth", asRouter(authRouter));

// Cart routes
app.use("/api/cart", asRouter(cartRouter));

// Wallet routes
app.use("/api/wallet", asRouter(walletRouter));

// Stores routes
app.use("/api/stores", asRouter(storesRouter));

// Books routes
app.use("/api/books", asRouter(booksRouter));

// Checkout routes
app.use("/api/checkout", asRouter(checkoutRouter));

// Purchases routes
app.use("/api/purchases", asRouter(purchasesRouter));

// Noticias routes
app.use("/api/noticias", asRouter(noticiasRouter));

// Recommendations routes
app.use("/api/recommendations", asRouter(recommendationsRouter));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;
