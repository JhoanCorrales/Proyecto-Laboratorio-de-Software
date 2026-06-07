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

export async function updateGlobalStock(libroId, clientOrPool) {
  const queryExecutor = clientOrPool || pool;
  try {
    const bookResult = await queryExecutor.query(`SELECT titulo FROM libros WHERE id = $1`, [libroId]);
    if (bookResult.rows.length === 0) return;
    
    const titulo = bookResult.rows[0].titulo;
    const normalizedTitulo = titulo.replace(/\s+/g, '').toLowerCase();

    await queryExecutor.query(`
      WITH matching_books AS (
        SELECT id
        FROM libros
        WHERE REGEXP_REPLACE(LOWER(titulo), '\\s+', '', 'g') = $1
      ),
      total_stock AS (
        SELECT COALESCE(SUM(it.cantidad_disponible), 0) as stock_total
        FROM inventario_tienda it
        WHERE it.libro_id IN (SELECT id FROM matching_books)
      )
      UPDATE libros 
      SET 
        stock_general = (SELECT stock_total FROM total_stock),
        estado = CASE 
                   WHEN (SELECT stock_total FROM total_stock) > 0 THEN 'disponible' 
                   ELSE 'agotado' 
                 END,
        updated_at = NOW()
      WHERE id IN (SELECT id FROM matching_books)
    `, [normalizedTitulo]);
  } catch (error) {
    console.error("Error al actualizar el stock global del libro:", error);
    throw error;
  }
}

export async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE compras ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(50) DEFAULT 'domicilio';
      ALTER TABLE compras ADD COLUMN IF NOT EXISTS tienda_id INTEGER REFERENCES tiendas(id) ON DELETE SET NULL;
      ALTER TABLE compras ADD COLUMN IF NOT EXISTS direccion_envio VARCHAR(500);
      ALTER TABLE compra_items ADD COLUMN IF NOT EXISTS tienda_id INTEGER REFERENCES tiendas(id) ON DELETE SET NULL;
    `);
    console.log("Database migrations applied successfully.");
  } catch (error) {
    console.error("Error applying database migrations:", error);
  }
}

// Named exports: Netlify NFT pone query/getClient en el objeto que las rutas
// reciben como import_db.default, evitando "default.query is not a function".
export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default {
  query,
  getClient,
  updateGlobalStock,
  runMigrations,
};