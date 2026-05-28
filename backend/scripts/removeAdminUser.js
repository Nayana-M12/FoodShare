const pool = require('../db');

async function main() {
  try {
    // Delete rows from admin table linked to admin users
    const [admins] = await pool.query(`SELECT user_id, email FROM users WHERE role = 'admin'`);
    if (admins.length === 0) {
      console.log('No admin users found.');
      return;
    }

    for (const a of admins) {
      console.log(`Removing admin user ${a.email} (id=${a.user_id})`);
      try {
        await pool.query('DELETE FROM admin WHERE user_id = ?', [a.user_id]);
      } catch (e) {
        // ignore if table missing
      }
      await pool.query('DELETE FROM users WHERE user_id = ?', [a.user_id]);
    }

    console.log('Admin user(s) removed successfully.');
  } catch (e) {
    console.error('Failed to remove admin user:', e.message);
    process.exit(1);
  }
}

main();
