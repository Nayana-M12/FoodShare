const pool = require('../db');

async function main() {
  const volunteerId = 1;
  const [rows] = await pool.query(
    `SELECT d.*, pr.*, fd.*, n.*
     FROM deliveries d
     LEFT JOIN pickup_requests pr ON d.request_id = pr.request_id
     LEFT JOIN food_donations fd ON pr.donation_id = fd.donation_id
     LEFT JOIN ngos n ON pr.ngo_id = n.ngo_id
     WHERE d.volunteer_id = ?
     LIMIT 10`,
    [volunteerId]
  );
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
