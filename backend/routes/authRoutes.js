const express = require('express');
const { login, register } = require('../controllers/authController');
const { requireBodyFields } = require('../middleware/validateRequest');

const router = express.Router();

router.post('/register', requireBodyFields(['email', 'password', 'role']), register);
router.post('/login', requireBodyFields(['password']), login);

module.exports = router;
