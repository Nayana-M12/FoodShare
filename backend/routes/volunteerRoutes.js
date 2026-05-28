const express = require('express');
const {
  deliveriesByVolunteer,
  updateStatus,
} = require('../controllers/volunteerController');

const router = express.Router();

router.get('/deliveries', deliveriesByVolunteer);
router.put('/update-status/:id', updateStatus);

module.exports = router;
