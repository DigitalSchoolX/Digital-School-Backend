const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validateAuth = require('../middleware/auth.validation');
const { protect } = require('../middleware/auth.middleware');

// POST /api/auth/register - Đăng ký
router.post('/register', validateAuth.register, authController.register);

// POST /api/auth/login - Đăng nhập
router.post('/login', validateAuth.login, authController.login);

// POST /api/auth/set-password - Set password sau khi đăng nhập với OTP
router.post('/set-password', authController.setPassword);

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get('/me', protect, authController.getCurrentUser);

// POST /api/auth/logout - Đăng xuất
router.post('/logout', protect, authController.logout);

module.exports = router; 