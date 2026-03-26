import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Pool configuration using DATABASE_URL from Neon
// idleTimeoutMillis: close idle connections after 30s (avoids keeping Neon alive)
// connectionTimeoutMillis: fail fast if can't connect within 5s
// max: limit concurrent connections to avoid exhausting Neon's free tier
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;