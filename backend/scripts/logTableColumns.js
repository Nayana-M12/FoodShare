const { getColumns } = require('../controllers/dbHelpers');

async function main() {
  const tables = ['pickup_requests', 'food_donations', 'ngos', 'users', 'volunteers', 'deliveries'];
  for (const t of tables) {
    try {
      const meta = await getColumns(t);
      console.log(`--- ${t} ---`);
      console.log(JSON.stringify(meta, null, 2));
    } catch (e) {
      console.warn(`Failed to load ${t}:`, e.message);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
