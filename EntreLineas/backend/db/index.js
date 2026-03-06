import pkg from "pg";
const { Pool } = pkg;

// Pool configuration will rely on environment variables
// exported by a .env file or the host environment.
const pool = new Pool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;