const express = require('express');
const {
  createDonation,
  listDonations,
  approveDonation,
  assignVolunteer,
  markDelivered,
} = require('../controllers/donationController');

const router = express.Router();

router.post('/create', createDonation);
router.get('/', listDonations);
router.put('/:id/approve', approveDonation);
router.put('/:id/assign-volunteer', assignVolunteer);
router.put('/:id/delivered', markDelivered);

module.exports = router;
