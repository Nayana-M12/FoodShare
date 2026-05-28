const express = require('express');
const {
  addDonation,
  viewDonations,
  updateDonation,
  deleteDonation,
} = require('../controllers/donorController');

const router = express.Router();

router.post('/add-donation', addDonation);
router.get('/view-donations', viewDonations);
router.put('/update-donation/:id', updateDonation);
router.delete('/delete-donation/:id', deleteDonation);

module.exports = router;
