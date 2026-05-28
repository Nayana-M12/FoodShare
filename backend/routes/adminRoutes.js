const express = require('express');
const {
  users,
  donations,
  approveDonation,
  assignVolunteer,
  dashboard,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', users);
router.get('/donations', donations);
router.put('/approve-donation/:id', approveDonation);
router.post('/assign-volunteer', assignVolunteer);
router.get('/dashboard', dashboard);

module.exports = router;
