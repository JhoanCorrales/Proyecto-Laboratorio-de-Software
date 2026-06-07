import serverless from "serverless-http";
import appModule from "../../backend/app.js";
import dbModule from "../../backend/db/index.js";

// Netlify NFT envuelve los default exports al transpilar ESM → CJS.
const unwrap = (mod) => mod?.default?.default ?? mod?.default ?? mod;

const app = unwrap(appModule);
const db = unwrap(dbModule);

let migrationsRun = false;

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Execute database migrations on the first request to ensure DB schema is up-to-date.
  if (!migrationsRun) {
    try {
      await db.runMigrations();
      migrationsRun = true;
    } catch (err) {
      console.error("Failed to run migrations in serverless function:", err);
    }
  }

  // Rewrite Netlify path format (e.g. /.netlify/functions/api/auth/login -> /api/auth/login)
  // to match the paths defined in our Express app.
  if (event.path && event.path.startsWith("/.netlify/functions/api")) {
    event.path = event.path.replace("/.netlify/functions/api", "/api");
  }

  return await serverlessHandler(event, context);
};
