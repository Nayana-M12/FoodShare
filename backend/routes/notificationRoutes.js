const express = require('express');
const {
  addNotification,
  getNotifications,
  markRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.post('/add', addNotification);
router.get('/:userId', getNotifications);
router.put('/read/:id', markRead);

module.exports = router;
