import app from "./app.js";
import db from "./db/index.js";

const port = process.env.PORT || 4003;

// Run database migrations and then start the server
db.runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error("Critical error starting backend:", err);
});