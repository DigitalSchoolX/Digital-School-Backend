const { body, param, query } = require('express-validator');

// Validation cho tạo thời khóa biểu cho khối
const validateCreateScheduleForGrade = [
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        throw new Error('Academic year must be consecutive years (e.g., 2023-2024)');
      }
      const currentYear = new Date().getFullYear();
      if (startYear < currentYear - 5 || startYear > currentYear + 5) {
        throw new Error('Academic year must be within reasonable range');
      }
      return true;
    }),

  body('gradeLevel')
    .notEmpty()
    .withMessage('Grade level is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12'),

  body('effectiveDate')
    .notEmpty()
    .withMessage('Effective date is required')
    .isISO8601()
    .withMessage('Effective date must be a valid date')
    .custom((value) => {
      const effectiveDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (effectiveDate < today) {
        throw new Error('Effective date cannot be in the past');
      }
      return true;
    }),

  body('customSchedule')
    .optional()
    .isObject()
    .withMessage('Custom schedule must be an object'),

  body('customSchedule.daysOfWeek')
    .optional()
    .isArray({ min: 1, max: 6 })
    .withMessage('Days of week must be an array with 1-6 elements'),

  body('customSchedule.daysOfWeek.*')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Day of week must be between 1 (Monday) and 6 (Saturday)'),

  body('customSchedule.periodsPerDay')
    .optional()
    .isObject()
    .withMessage('Periods per day must be an object'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && req.body.effectiveDate) {
        const endDate = new Date(value);
        const effectiveDate = new Date(req.body.effectiveDate);
        if (endDate <= effectiveDate) {
          throw new Error('End date must be after effective date');
        }
      }
      return true;
    })
];

// Validation cho lấy danh sách thời khóa biểu
const validateGetSchedules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'),

  query('gradeLevel')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12'),

  query('status')
    .optional()
    .isIn(['draft', 'active', 'archived'])
    .withMessage('Status must be one of: draft, active, archived')
];

// Validation cho lấy chi tiết thời khóa biểu
const validateGetScheduleById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid schedule ID format')
];

// Validation cho cập nhật thời khóa biểu
const validateUpdateSchedule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid schedule ID format'),

  body('weeklySchedule')
    .optional()
    .isArray()
    .withMessage('Weekly schedule must be an array'),

  body('weeklySchedule.*.dayOfWeek')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Day of week must be between 1 and 6'),

  body('weeklySchedule.*.periods')
    .optional()
    .isArray()
    .withMessage('Periods must be an array'),

  body('weeklySchedule.*.periods.*.periodNumber')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Period number must be between 1 and 7'),

  body('weeklySchedule.*.periods.*.session')
    .optional()
    .isIn(['morning', 'afternoon', 'full_day'])
    .withMessage('Session must be morning, afternoon, or full_day'),

  body('weeklySchedule.*.periods.*.subject')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Subject ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),

  body('weeklySchedule.*.periods.*.teacher')
    .optional()
    .custom((value) => {
      if (value && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Teacher ID must be a valid MongoDB ObjectId');
      }
      return true;
    }),

  body('weeklySchedule.*.periods.*.isBreak')
    .optional()
    .isBoolean()
    .withMessage('Is break must be a boolean value'),

  body('status')
    .optional()
    .isIn(['draft', 'active', 'archived'])
    .withMessage('Status must be one of: draft, active, archived'),

  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Effective date must be a valid date'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

// Validation cho xóa thời khóa biểu
const validateDeleteSchedule = [
  param('id')
    .isMongoId()
    .withMessage('Invalid schedule ID format')
];

// Validation cho thống kê thời khóa biểu
const validateGetScheduleStats = [
  query('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)')
];

// Validation cho lấy danh sách lớp theo khối
const validateGetClassesByGrade = [
  query('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'),

  query('gradeLevel')
    .notEmpty()
    .withMessage('Grade level is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12')
];

// Validation cho preview tạo thời khóa biểu
const validatePreviewScheduleCreation = [
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'),

  body('gradeLevel')
    .notEmpty()
    .withMessage('Grade level is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Grade level must be between 1 and 12')
];

// Validation cho học sinh xem thời khóa biểu
const validateGetStudentSchedule = [
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)')
    .custom((value) => {
      if (value) {
        const [startYear, endYear] = value.split('-').map(Number);
        if (endYear !== startYear + 1) {
          throw new Error('Academic year must be consecutive years (e.g., 2024-2025)');
        }
      }
      return true;
    }),

  query('className')
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Class name must be between 2 and 10 characters')
    .matches(/^[0-9]{1,2}[A-Za-z][0-9]{1,2}$/)
    .withMessage('Class name must be in format like 12A1, 10B2, etc.')
];

// Validation cho học sinh xem thời khóa biểu theo ngày
const validateGetStudentScheduleByDay = [
  param('dayOfWeek')
    .notEmpty()
    .withMessage('Day of week is required')
    .isInt({ min: 1, max: 6 })
    .withMessage('Day of week must be between 1 (Monday) and 6 (Saturday)'),

  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)')
    .custom((value) => {
      if (value) {
        const [startYear, endYear] = value.split('-').map(Number);
        if (endYear !== startYear + 1) {
          throw new Error('Academic year must be consecutive years (e.g., 2024-2025)');
        }
      }
      return true;
    })
];

// Validation cho lấy tuần học
const validateGetWeekOptions = [
  query('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)')
    .custom((value) => {
      const [startYear, endYear] = value.split('-').map(Number);
      if (endYear !== startYear + 1) {
        throw new Error('Academic year must be consecutive years (e.g., 2024-2025)');
      }
      return true;
    })
];

// Validation cho lấy thời khóa biểu theo tuần
const validateGetScheduleByWeek = [
  query('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'),

  query('weekStartDate')
    .notEmpty()
    .withMessage('Week start date is required')
    .isISO8601()
    .withMessage('Week start date must be a valid date (YYYY-MM-DD)'),

  query('weekEndDate')
    .notEmpty()
    .withMessage('Week end date is required')
    .isISO8601()
    .withMessage('Week end date must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.query.weekStartDate) {
        const startDate = new Date(req.query.weekStartDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('Week end date must be after week start date');
        }
        // Kiểm tra khoảng cách không quá 7 ngày
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          throw new Error('Week duration cannot exceed 7 days');
        }
      }
      return true;
    }),

  query('className')
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Class name must be between 2 and 10 characters')
    .matches(/^[0-9]{1,2}[A-Za-z][0-9]{1,2}$/)
    .withMessage('Class name must be in format like 12A1, 10B2, etc.')
];

module.exports = {
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
}; 