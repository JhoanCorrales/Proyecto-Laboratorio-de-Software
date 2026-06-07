import serverless from "serverless-http";
import app from "../../backend/app.js";
import db from "../../backend/db/index.js";

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
