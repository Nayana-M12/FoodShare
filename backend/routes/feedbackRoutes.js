const express = require('express');
const { addFeedback } = require('../controllers/feedbackController');

const router = express.Router();

router.post('/add', addFeedback);

module.exports = router;
