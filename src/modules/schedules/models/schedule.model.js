const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  // Thông tin cơ bản
  academicYear: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{4}$/.test(v);
      },
      message: 'Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'
    }
  },
  gradeLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  
  // Thời khóa biểu theo tuần
  weeklySchedule: [{
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1, // Thứ 2
      max: 6  // Thứ 7
    },
    dayName: {
      type: String,
      required: true,
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    },
    periods: [{
      periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 7 // Tối đa 7 tiết trong ngày
      },
              session: {
        type: String,
        required: true,
        enum: ['morning', 'afternoon', 'full_day'] // buổi sáng, buổi chiều, cả ngày
      },
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        default: null // null = tiết trống
      },
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null = chưa phân công giáo viên
      },
      room: {
        type: String,
        default: null
      },
      isBreak: {
        type: Boolean,
        default: false // true = giờ ra chơi
      },
      notes: {
        type: String,
        default: ''
      }
    }]
  }],
  
  // Thông tin tạo và cập nhật
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Index để tối ưu hóa tìm kiếm
scheduleSchema.index({ academicYear: 1, gradeLevel: 1 });
scheduleSchema.index({ class: 1, academicYear: 1 });
scheduleSchema.index({ status: 1, isActive: 1 });

// Compound index cho unique constraint
scheduleSchema.index(
  { academicYear: 1, class: 1, status: 'active' },
  { 
    unique: true,
    partialFilterExpression: { status: 'active', isActive: true }
  }
);

// Virtual để lấy tổng số tiết trong tuần
scheduleSchema.virtual('totalPeriodsPerWeek').get(function() {
  let total = 0;
  this.weeklySchedule.forEach(day => {
    total += day.periods.filter(period => !period.isBreak && period.subject).length;
  });
  return total;
});

// Method để lấy thời khóa biểu theo ngày
scheduleSchema.methods.getScheduleByDay = function(dayOfWeek) {
  return this.weeklySchedule.find(day => day.dayOfWeek === dayOfWeek);
};

// Method để kiểm tra xung đột giáo viên
scheduleSchema.methods.checkTeacherConflict = function(teacherId, dayOfWeek, periodNumber) {
  // Logic kiểm tra xung đột sẽ được implement trong service
  return false;
};

// Static method để lấy thời khóa biểu theo grade level
scheduleSchema.statics.getSchedulesByGrade = function(academicYear, gradeLevel) {
  return this.find({ 
    academicYear, 
    gradeLevel, 
    status: 'active',
    isActive: true 
  }).populate('class').populate('createdBy', 'name email');
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule; 