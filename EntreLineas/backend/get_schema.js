import db from './db/index.js';
async function main() {
  try {
    const result = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'libros'");
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
