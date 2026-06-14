const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Standard email/password auth
router.post('/signup', authController.signup);
router.post('/register', authController.signup);
router.post('/login', authController.login);

// Forgot / Reset password
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
