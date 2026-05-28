const express = require('express');
const {
  availableFood,
  requestPickup,
  myRequests,
  listNgos,
} = require('../controllers/ngoController');

const router = express.Router();

router.get('/available-food', availableFood);
router.get('/list', listNgos);
router.post('/request-pickup', requestPickup);
router.get('/my-requests', myRequests);

module.exports = router;
