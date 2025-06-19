const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const {
  validateCreateScheduleForGrade,
  validateGetSchedules,
  validateGetScheduleById,
  validateUpdateSchedule,
  validateDeleteSchedule,
  validateGetScheduleStats,
  validateGetClassesByGrade,
  validatePreviewScheduleCreation,
  validateGetStudentSchedule,
  validateGetStudentScheduleByDay,
  validateGetWeekOptions,
  validateGetScheduleByWeek
} = require('../middleware/schedule.validation');
const { protect, authorize } = require('../../auth/middleware/auth.middleware');
const { handleValidationErrors } = require('../../../middleware/errorHandler');

// Routes cho manager và admin
router.post('/preview', 
  protect,
  authorize(['manager', 'admin']),
  validatePreviewScheduleCreation,
  handleValidationErrors,
  scheduleController.previewScheduleCreation
);

router.post('/', 
  protect,
  authorize(['manager', 'admin']),
  validateCreateScheduleForGrade,
  handleValidationErrors,
  scheduleController.createScheduleForGrade
);

router.get('/', 
  protect,
  authorize(['manager', 'admin', 'teacher']),
  validateGetSchedules,
  handleValidationErrors,
  scheduleController.getSchedules
);

router.get('/stats', 
  protect,
  authorize(['manager', 'admin']),
  validateGetScheduleStats,
  handleValidationErrors,
  scheduleController.getScheduleStats
);

router.get('/classes', 
  protect,
  authorize(['manager', 'admin']),
  validateGetClassesByGrade,
  handleValidationErrors,
  scheduleController.getClassesByGrade
);

// Routes cho calendar view
router.get('/academic-years', 
  scheduleController.getAcademicYearOptions
);

// API để kiểm tra danh sách lớp có sẵn
router.get('/classes-list', 
  scheduleController.getClassesList
);

router.get('/weeks', 
  validateGetWeekOptions,
  handleValidationErrors,
  scheduleController.getWeekOptions
);

router.get('/time-slots', 
  scheduleController.getTimeSlots
);

router.get('/week', 
  scheduleController.getScheduleByWeek
);

// Routes cho học sinh và giáo viên chủ nhiệm xem thời khóa biểu
router.get('/student', 
  scheduleController.getStudentSchedule
);

router.get('/student/day/:dayOfWeek', 
  protect,
  authorize(['student', 'teacher', 'admin', 'manager']),
  validateGetStudentScheduleByDay,
  handleValidationErrors,
  scheduleController.getStudentScheduleByDay
);

router.get('/:id', 
  protect,
  authorize(['manager', 'admin', 'teacher']),
  validateGetScheduleById,
  handleValidationErrors,
  scheduleController.getScheduleById
);

router.put('/:id', 
  protect,
  authorize(['manager', 'admin']),
  validateUpdateSchedule,
  handleValidationErrors,
  scheduleController.updateSchedule
);

router.delete('/:id', 
  protect,
  authorize(['manager', 'admin']),
  validateDeleteSchedule,
  handleValidationErrors,
  scheduleController.deleteSchedule
);

module.exports = router; 