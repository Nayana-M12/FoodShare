const pool = require('../db');
const { getColumns, findFirstMatchingColumn } = require('../controllers/dbHelpers');

async function cleanupDuplicates() {
  const foodMeta = await getColumns('food_donations');
  const primaryKey = foodMeta.primaryKey;
  const foodNameColumn = findFirstMatchingColumn(foodMeta.columns, [
    'food_name',
    'item_name',
    'food_item',
    'title',
    'foodName',
  ]);
  const donorColumn = findFirstMatchingColumn(foodMeta.columns, ['donor_id']);
  const pickupColumn = findFirstMatchingColumn(foodMeta.columns, [
    'pickup_address',
    'pickupAddress',
    'address',
  ]);

  if (!foodNameColumn || !donorColumn || !pickupColumn) {
    console.error('Missing required columns for duplicate cleanup.');
    console.error({ foodNameColumn, donorColumn, pickupColumn });
    process.exit(1);
  }

  const deleteQuery = `DELETE fd1 FROM food_donations fd1
    JOIN food_donations fd2
      ON fd1.\`${foodNameColumn}\` = fd2.\`${foodNameColumn}\`
      AND fd1.\`${donorColumn}\` = fd2.\`${donorColumn}\`
      AND fd1.\`${pickupColumn}\` = fd2.\`${pickupColumn}\`
      AND fd1.\`${primaryKey}\` < fd2.\`${primaryKey}\``;

  const [result] = await pool.query(deleteQuery);
  console.log(`Deleted ${result.affectedRows} duplicate donation(s).`);
  process.exit(0);
}

cleanupDuplicates().catch((error) => {
  console.error('Duplicate cleanup failed:', error.message);
  process.exit(1);
});
