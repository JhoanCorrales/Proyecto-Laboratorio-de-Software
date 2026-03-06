# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Backend & PostgreSQL Setup ⚙️

Although this repository started as a frontend React/Vite app, a minimal Node backend has been added to establish a connection with a PostgreSQL database. You can find the server code under the `backend/` folder.

### 1. Install PostgreSQL

On **Windows** the easiest option is the official installer available at [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/).

Alternatively, if you use **Chocolatey**:
```powershell
choco install postgresql
```

Make sure the service is running and take note of the `postgres` superuser credentials (or create a dedicated user).

### 2. Configure environment variables

- Copy the provided `.env.example` to `.env` at the project root.
- Fill in your database host, port, username, password and database name.

Example `.env`:
```
PGHOST=localhost
PGPORT=5432
PGUSER=mi_usuario
PGPASSWORD=mi_contraseña
PGDATABASE=entrelineas_db
PORT=4000
```

> **Note:** `.env` is ignored by git thanks to the updated `.gitignore`.

### 3. Backend files

- `backend/package.json` contains the dependencies (`express`, `pg`, `dotenv`) and scripts:
  - `npm run start` &ndash; run the server
  - `npm run dev` &ndash; run with `nodemon` (auto‑restart on changes)
- `backend/index.js` boots an Express server and performs a simple `SELECT NOW()` query to verify the database connection.
- `backend/db/index.js` exports a `pg.Pool` instance configured from environment variables.

### 4. Create database schema

Before running the backend, you need to create the database and load the schema:

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE entrelineas_db;

# Exit psql
\q

# Load the schema
psql -U your_username -d entrelineas_db -f backend/db/schema.sql
```

Or using a PostgreSQL client GUI (PgAdmin, DBeaver), connect to your database and execute the contents of `backend/db/schema.sql`.

### 5. Running the backend

Open a terminal in `EntreLineas/backend`:
```bash
npm install
npm run dev
```

The server listens on the port specified by `PORT` (defaults to 4000) and will respond with the current timestamp if the database connection succeeds.

### 6. Database Schema

The complete database schema is located in `backend/db/schema.sql` and includes:

- **Users & Authentication**: Usuarios, roles, usuario_roles
- **Catalog**: Libros, categorías
- **Physical Stores**: Tiendas, inventario_tienda
- **Purchases**: Compras, compra_items
- **Reservations**: Reservas, reserva_items
- **Shopping Cart**: Carrito, carrito_items
- **Payments**: Pagos, tarjetas_credito
- **Content & Recommendations**: Noticias, suscripciones_noticias, recomendaciones
- **Audit**: Auditoria_cambios

All tables have proper PRIMARY KEYS, FOREIGN KEYS, indexes, and CHECK constraints.

