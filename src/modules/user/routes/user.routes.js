const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateUser } = require('../middleware/user.validation');
const { protect, authorize } = require('../../auth/middleware/auth.middleware');
const upload = require('../middleware/user.upload');

// Tạo user mới (chỉ admin và manager)
router.post(
  '/',
  validateUser.createUser,
  userController.createUser
);

// Lấy danh sách users (chỉ admin và manager)
router.get(
  '/',
  protect,
  authorize('admin', 'manager'),
  userController.getUsers
);

// Lấy thông tin user theo ID (chỉ admin và manager)
router.get(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  userController.getUserById
);

// Cập nhật thông tin user (chỉ admin và manager)
router.put(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  validateUser.updateUser,
  userController.updateUser
);

// Xóa user (chỉ admin)
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  userController.deleteUser
);

// Cập nhật trạng thái active của user (chỉ admin và manager)
router.patch(
  '/:id/status',
  validateUser.updateUserStatus,
  userController.updateUserStatus
);

// Tạo user mới với OTP (chỉ manager)
router.post('/create', validateUser.createUserWithOTP, userController.createUser);

// Đăng nhập với email và 1password
router.post('/login-otp', userController.loginWithOTP);

// Xác thực OTP
router.post('/verify-otp', userController.verifyOTP);

// Set password mới
router.post('/set-password', 
  validateUser.setPassword,
  userController.setPassword
);

// Import teachers từ file Excel (chỉ manager)
router.post('/import-teachers', 
  protect,
  authorize('manager'),
  upload.single('file'),
  userController.importTeachers
);

// Import teachers từ base64 (chỉ manager)
router.post('/import-teachers-base64', 
  protect,
  authorize('manager'),
  userController.importTeachersBase64
);

// Import students từ file Excel (chỉ manager)
router.post('/import-students', 
  protect,
  authorize('manager'),
  upload.single('file'),
  userController.importStudents
);

// Import students từ base64 (chỉ manager)
router.post('/import-students-base64', 
  protect,
  authorize('manager'),
  userController.importStudentsBase64
);

// Tạo student mới (chỉ manager)
router.post('/create-student', 
  validateUser.createStudent,
  userController.createStudent
);

// Tạo teacher mới (chỉ manager)
router.post('/create-teacher', 
  validateUser.createTeacher,
  userController.createTeacher
);

module.exports = router; 