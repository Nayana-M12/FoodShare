const pool = require('../db');

async function main() {
  try {
    const [rows] = await pool.query(
      `SELECT u.* FROM users u
       LEFT JOIN admin a ON a.user_id = u.user_id
       WHERE u.role = 'admin' OR a.user_id IS NOT NULL`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Query failed:', e.message);
    process.exit(1);
  }
}

main();
