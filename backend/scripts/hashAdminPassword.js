const pool = require('../db');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const [admins] = await pool.query(`SELECT user_id, email, password FROM users WHERE role = 'admin'`);
    if (admins.length === 0) {
      console.log('No admin users found.');
      return;
    }

    for (const a of admins) {
      const pwd = a.password || '';
      // detect if already a bcrypt hash (starts with $2a$ or $2b$ or $2y$)
      if (pwd.startsWith('$2')) {
        console.log(`Skipping ${a.email} (already hashed).`);
        continue;
      }

      const hashed = await bcrypt.hash(pwd, 10);
      await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, a.user_id]);
      console.log(`Updated password for ${a.email}`);
    }

    console.log('Done.');
  } catch (e) {
    console.error('Failed:', e.message);
    process.exit(1);
  }
}

main();
