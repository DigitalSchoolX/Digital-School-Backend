const Schedule = require('../models/schedule.model');
const Class = require('../../classes/models/class.model');
const Subject = require('../../subjects/models/subject.model');
const User = require('../../auth/models/user.model');
const jwt = require('jsonwebtoken');

class ScheduleService {
  // Tạo thời khóa biểu cho khối lớp
  async createScheduleForGrade(scheduleData, token) {
    try {
      // Verify token và kiểm tra quyền
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (!currentUser || !currentUser.role.some(role => ['manager', 'admin'].includes(role))) {
        throw new Error('Only managers and admins can create schedules');
      }

      const { academicYear, gradeLevel, effectiveDate, customSchedule } = scheduleData;

      // Validate dữ liệu đầu vào
      if (!academicYear || !gradeLevel || !effectiveDate) {
        throw new Error('Missing required fields: academicYear, gradeLevel, effectiveDate');
      }

      // Tìm các lớp thuộc khối và năm học
      const classes = await this.getClassesByGradeAndYear(academicYear, gradeLevel);
      
      if (classes.length === 0) {
        throw new Error(`No classes found for grade ${gradeLevel} in academic year ${academicYear}`);
      }

      // Lấy các môn học phù hợp với khối
      const subjects = await Subject.find({
        gradeLevels: gradeLevel,
        isActive: true
      });

      if (subjects.length === 0) {
        throw new Error(`No subjects found for grade ${gradeLevel}`);
      }

      const createdSchedules = [];

      // Tạo thời khóa biểu cho từng lớp
      for (const classInfo of classes) {
        // Kiểm tra xem đã có thời khóa biểu active cho lớp này chưa
        const existingSchedule = await Schedule.findOne({
          academicYear,
          class: classInfo._id,
          status: 'active',
          isActive: true
        });

        if (existingSchedule) {
          console.log(`Schedule already exists for class ${classInfo.className}`);
          continue;
        }

        // Tạo thời khóa biểu mặc định hoặc custom
        const weeklySchedule = customSchedule 
          ? await this.createCustomSchedule(subjects, classInfo, customSchedule)
          : await this.createDefaultSchedule(subjects, classInfo);

        const schedule = new Schedule({
          academicYear,
          gradeLevel,
          class: classInfo._id,
          weeklySchedule,
          createdBy: currentUser._id,
          effectiveDate: new Date(effectiveDate),
          status: 'active'
        });

        const savedSchedule = await schedule.save();
        await savedSchedule.populate([
          { path: 'class', select: 'className homeroomTeacher' },
          { path: 'weeklySchedule.periods.subject', select: 'subjectName subjectCode' },
          { path: 'weeklySchedule.periods.teacher', select: 'name email' }
        ]);

        createdSchedules.push(savedSchedule);
      }

      return {
        message: `Created schedules for ${createdSchedules.length} classes in grade ${gradeLevel}`,
        academicYear,
        gradeLevel,
        totalClasses: classes.length,
        createdSchedules: createdSchedules.length,
        schedules: createdSchedules.map(schedule => ({
          id: schedule._id,
          className: schedule.class.className,
          totalPeriods: schedule.totalPeriodsPerWeek,
          status: schedule.status,
          effectiveDate: schedule.effectiveDate
        }))
      };

    } catch (error) {
      throw error;
    }
  }

  // Tạo thời khóa biểu mặc định
  async createDefaultSchedule(subjects, classInfo) {
    const weeklySchedule = [];
    const daysOfWeek = [
      { dayOfWeek: 1, dayName: 'Thứ 2' },
      { dayOfWeek: 2, dayName: 'Thứ 3' },
      { dayOfWeek: 3, dayName: 'Thứ 4' },
      { dayOfWeek: 4, dayName: 'Thứ 5' },
      { dayOfWeek: 5, dayName: 'Thứ 6' },
      { dayOfWeek: 6, dayName: 'Thứ 7' }
    ];

    // Tính toán phân bổ môn học theo số tiết/tuần
    const subjectDistribution = this.calculateSubjectDistribution(subjects);

    for (const day of daysOfWeek) {
      const daySchedule = {
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        periods: []
      };

      // Số tiết trong ngày dao động 6-7 tiết
      const totalPeriods = this.getTotalPeriodsForDay(day.dayOfWeek);
      
      for (let period = 1; period <= totalPeriods; period++) {
        // Xác định session dựa trên số tiết và vị trí
        const session = this.getSessionForPeriod(period, totalPeriods);
        
        // Giờ ra chơi: Tiết giữa (thường là tiết 3-4 tùy vào tổng số tiết)
        const breakPeriod = Math.ceil(totalPeriods / 2);
        if (period === breakPeriod) {
          daySchedule.periods.push({
            periodNumber: period,
            session: session,
            isBreak: true,
            notes: 'Giờ ra chơi'
          });
          continue;
        }

        // Phân bổ môn học
        const assignedSubject = this.assignSubjectToPeriod(subjectDistribution, day.dayOfWeek, period);
        
        daySchedule.periods.push({
          periodNumber: period,
          session: session,
          subject: assignedSubject?.subject?._id || null,
          teacher: assignedSubject?.teacher || classInfo.homeroomTeacher, // Giáo viên chủ nhiệm mặc định
          isBreak: false
        });
      }

      weeklySchedule.push(daySchedule);
    }

    return weeklySchedule;
  }

  // Tạo thời khóa biểu tùy chỉnh
  async createCustomSchedule(subjects, classInfo, customSchedule) {
    // Logic tạo thời khóa biểu theo yêu cầu tùy chỉnh
    // Sẽ implement chi tiết hơn sau
    return this.createDefaultSchedule(subjects, classInfo);
  }

  // Tính toán phân bổ môn học
  calculateSubjectDistribution(subjects) {
    const distribution = [];
    
    subjects.forEach(subject => {
      const weeklyHours = subject.weeklyHours || 2;
      distribution.push({
        subject: subject,
        weeklyHours: weeklyHours,
        remainingHours: weeklyHours
      });
    });

    return distribution.sort((a, b) => b.weeklyHours - a.weeklyHours);
  }

  // Phân bổ môn học cho tiết học
  assignSubjectToPeriod(subjectDistribution, dayOfWeek, period) {
    // Logic phân bổ môn học đều đặn trong tuần
    const availableSubjects = subjectDistribution.filter(item => item.remainingHours > 0);
    
    if (availableSubjects.length === 0) {
      return null;
    }

    // Ưu tiên môn học có nhiều tiết hơn
    const selectedSubject = availableSubjects[0];
    selectedSubject.remainingHours--;

    return selectedSubject;
  }

  // Lấy tổng số tiết trong ngày (hệ thống linh hoạt 6-7 tiết)
  getTotalPeriodsForDay(dayOfWeek) {
    // Thứ 2, 4, 6: 7 tiết (4 sáng + 3 chiều)
    // Thứ 3, 5, 7: 6 tiết (3 sáng + 3 chiều)
    const fullDays = [1, 3, 5]; // Thứ 2, 4, 6
    const shortDays = [2, 4, 6]; // Thứ 3, 5, 7
    
    if (fullDays.includes(dayOfWeek)) {
      return 7; // 4 tiết sáng + 3 tiết chiều
    } else {
      return 6; // 3 tiết sáng + 3 tiết chiều
    }
  }

  // Xác định buổi học (sáng/chiều) cho tiết học
  getSessionForPeriod(period, totalPeriods) {
    if (totalPeriods === 7) {
      // Ngày 7 tiết: 4 sáng + 3 chiều
      return period <= 4 ? 'morning' : 'afternoon';
    } else {
      // Ngày 6 tiết: 3 sáng + 3 chiều
      return period <= 3 ? 'morning' : 'afternoon';
    }
  }

  // Lấy các lớp theo khối và năm học
  async getClassesByGradeAndYear(academicYear, gradeLevel) {
    return await Class.find({
      academicYear,
      gradeLevel,
      isActive: true
    }).populate('homeroomTeacher', 'name email');
  }

  // Lấy danh sách thời khóa biểu với phân trang và lọc
  async getSchedules({ page = 1, limit = 10, academicYear, gradeLevel, status }) {
    try {
      const query = { isActive: true };
      
      if (academicYear) query.academicYear = academicYear;
      if (gradeLevel) query.gradeLevel = gradeLevel;
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      
      const [schedules, total] = await Promise.all([
        Schedule.find(query)
          .populate('class', 'className gradeLevel homeroomTeacher')
          .populate('createdBy', 'name email')
          .populate('lastModifiedBy', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Schedule.countDocuments(query)
      ]);

      return {
        schedules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy chi tiết thời khóa biểu theo ID
  async getScheduleById(id) {
    try {
      const schedule = await Schedule.findById(id)
        .populate('class', 'className gradeLevel academicYear homeroomTeacher')
        .populate({
          path: 'class',
          populate: {
            path: 'homeroomTeacher',
            select: 'name email role'
          }
        })
        .populate('createdBy', 'name email role')
        .populate('lastModifiedBy', 'name email role')
        .populate({
          path: 'weeklySchedule.periods.subject',
          select: 'subjectName subjectCode description weeklyHours'
        })
        .populate({
          path: 'weeklySchedule.periods.teacher',
          select: 'name email role'
        });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      return schedule;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thời khóa biểu
  async updateSchedule(id, updateData, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (!currentUser || !currentUser.role.some(role => ['manager', 'admin', 'teacher'].includes(role))) {
        throw new Error('Insufficient permissions');
      }

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Cập nhật dữ liệu
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'createdBy' && key !== 'createdAt') {
          schedule[key] = updateData[key];
        }
      });

      schedule.lastModifiedBy = currentUser._id;
      
      const updatedSchedule = await schedule.save();
      return await this.getScheduleById(updatedSchedule._id);

    } catch (error) {
      throw error;
    }
  }

  // Xóa thời khóa biểu (soft delete)
  async deleteSchedule(id, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (!currentUser || !currentUser.role.some(role => ['manager', 'admin'].includes(role))) {
        throw new Error('Only managers and admins can delete schedules');
      }

      const schedule = await Schedule.findById(id);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      schedule.isActive = false;
      schedule.status = 'archived';
      schedule.lastModifiedBy = currentUser._id;
      
      await schedule.save();

      return { message: 'Schedule deleted successfully' };

    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê thời khóa biểu
  async getScheduleStats(academicYear) {
    try {
      const stats = await Schedule.aggregate([
        {
          $match: {
            academicYear,
            isActive: true
          }
        },
        {
          $group: {
            _id: '$gradeLevel',
            totalClasses: { $sum: 1 },
            activeSchedules: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            draftSchedules: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return {
        academicYear,
        gradeStats: stats.map(stat => ({
          gradeLevel: stat._id,
          totalClasses: stat.totalClasses,
          activeSchedules: stat.activeSchedules,
          draftSchedules: stat.draftSchedules
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thời khóa biểu của học sinh theo className
  async getStudentScheduleByClassName(className, academicYear = '2024-2025') {
    try {
      // Tìm lớp học theo className và năm học
      const classInfo = await Class.findOne({
        className: className,
        academicYear,
        isActive: true
      }).populate('homeroomTeacher', 'name email role');

      if (!classInfo) {
        throw new Error(`Class ${className} not found in academic year ${academicYear}`);
      }
      
      // Tìm thời khóa biểu của lớp trong năm học
      const schedule = await Schedule.findOne({
        class: classInfo._id,
        academicYear,
        status: 'active',
        isActive: true
      })
        .populate('class', 'className academicYear homeroomTeacher')
        .populate({
          path: 'class',
          populate: {
            path: 'homeroomTeacher',
            select: 'name email role'
          }
        })
        .populate({
          path: 'weeklySchedule.periods.subject',
          select: 'subjectName subjectCode description'
        })
        .populate({
          path: 'weeklySchedule.periods.teacher',
          select: 'name email role'
        });

      if (!schedule) {
        throw new Error(`No schedule found for class ${className} in academic year ${academicYear}`);
      }

      // Format dữ liệu trả về
      const formattedSchedule = {
        id: schedule._id,
        academicYear: schedule.academicYear,
        gradeLevel: schedule.gradeLevel,
        class: {
          id: schedule.class._id,
          className: schedule.class.className,
          homeroomTeacher: schedule.class.homeroomTeacher
        },
        weeklySchedule: schedule.weeklySchedule.map(day => ({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          totalPeriods: day.periods.length,
          periods: day.periods.map(period => ({
            periodNumber: period.periodNumber,
            session: period.session,
            subject: period.subject ? {
              id: period.subject._id,
              name: period.subject.subjectName,
              code: period.subject.subjectCode,
              description: period.subject.description
            } : null,
            teacher: period.teacher ? {
              id: period.teacher._id,
              name: period.teacher.name,
              email: period.teacher.email
            } : null,
            room: period.room,
            isBreak: period.isBreak,
            notes: period.notes
          }))
        })),
        scheduleInfo: {
          status: schedule.status,
          effectiveDate: schedule.effectiveDate,
          endDate: schedule.endDate,
          totalPeriodsPerWeek: schedule.totalPeriodsPerWeek,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        }
      };

      return formattedSchedule;

    } catch (error) {
      throw error;
    }
  }

  // Lấy thời khóa biểu của học sinh (theo class_id và năm học) - method cũ giữ lại để không breaking changes
  async getStudentSchedule(token, academicYear = '2024-2025') {
    try {
      // Verify token và lấy thông tin user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Kiểm tra quyền truy cập
      if (!currentUser.role.includes('student') && !currentUser.role.includes('admin') && !currentUser.role.includes('manager') && !currentUser.role.includes('teacher')) {
        throw new Error('Access denied. Only students, homeroom teachers, admin, and managers can view schedule');
      }

      let classId = null;

      // Xác định class_id dựa trên role
      if (currentUser.role.includes('student')) {
        // Học sinh: lấy class_id từ profile
        if (!currentUser.class_id) {
          throw new Error('Student is not assigned to any class. Please contact administrator.');
        }
        classId = currentUser.class_id;
      } else if (currentUser.role.includes('teacher')) {
        // Giáo viên: kiểm tra có phải chủ nhiệm không
        const homeroomClass = await Class.findOne({ 
          homeroomTeacher: currentUser._id,
          academicYear 
        });
        
        if (!homeroomClass) {
          throw new Error('Teacher is not a homeroom teacher of any class in this academic year. Only homeroom teachers can view class schedule.');
        }
        classId = homeroomClass._id;
      } else {
        // Admin/Manager: cần class_id từ query parameter (sẽ implement sau nếu cần)
        throw new Error('Admin/Manager access to specific class schedule not implemented yet');
      }
      
      // Tìm thời khóa biểu của lớp trong năm học
      const schedule = await Schedule.findOne({
        class: classId,
        academicYear,
        status: 'active',
        isActive: true
      })
        .populate('class', 'className academicYear homeroomTeacher')
        .populate({
          path: 'class',
          populate: {
            path: 'homeroomTeacher',
            select: 'name email role'
          }
        })
        .populate({
          path: 'weeklySchedule.periods.subject',
          select: 'subjectName subjectCode description'
        })
        .populate({
          path: 'weeklySchedule.periods.teacher',
          select: 'name email role'
        });

      if (!schedule) {
        throw new Error(`No schedule found for your class in academic year ${academicYear}. Please contact your teacher.`);
      }

      // Format dữ liệu trả về
      const formattedSchedule = {
        id: schedule._id,
        academicYear: schedule.academicYear,
        gradeLevel: schedule.gradeLevel,
        class: {
          id: schedule.class._id,
          className: schedule.class.className,
          homeroomTeacher: schedule.class.homeroomTeacher
        },
        currentUser: {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          studentId: currentUser.studentId || null,
          isHomeroomTeacher: currentUser.role.includes('teacher')
        },
        weeklySchedule: schedule.weeklySchedule.map(day => ({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          totalPeriods: day.periods.length,
          periods: day.periods.map(period => ({
            periodNumber: period.periodNumber,
            session: period.session,
            subject: period.subject ? {
              id: period.subject._id,
              name: period.subject.subjectName,
              code: period.subject.subjectCode,
              description: period.subject.description
            } : null,
            teacher: period.teacher ? {
              id: period.teacher._id,
              name: period.teacher.name,
              email: period.teacher.email
            } : null,
            room: period.room,
            isBreak: period.isBreak,
            notes: period.notes
          }))
        })),
        scheduleInfo: {
          status: schedule.status,
          effectiveDate: schedule.effectiveDate,
          endDate: schedule.endDate,
          totalPeriodsPerWeek: schedule.totalPeriodsPerWeek,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        }
      };

      return formattedSchedule;

    } catch (error) {
      throw error;
    }
  }

  // Lấy thời khóa biểu theo ngày cụ thể
  async getStudentScheduleByDay(token, dayOfWeek, academicYear = '2024-2025') {
    try {
      const fullSchedule = await this.getStudentSchedule(token, academicYear);
      
      // Lọc thời khóa biểu theo ngày
      const daySchedule = fullSchedule.weeklySchedule.find(day => day.dayOfWeek === parseInt(dayOfWeek));
      
      if (!daySchedule) {
        throw new Error(`No schedule found for day ${dayOfWeek}`);
      }

      return {
        ...fullSchedule,
        daySchedule: daySchedule,
        selectedDay: {
          dayOfWeek: daySchedule.dayOfWeek,
          dayName: daySchedule.dayName,
          date: this.getDateForDayOfWeek(dayOfWeek)
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Helper: Lấy ngày trong tuần hiện tại
  getDateForDayOfWeek(dayOfWeek) {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const targetDay = parseInt(dayOfWeek); // 1 = Monday, 2 = Tuesday, ...
    
    // Chuyển đổi để Monday = 1
    const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;
    const daysToAdd = targetDay - adjustedCurrentDay;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    
    return targetDate.toISOString().split('T')[0];
  }

  // Lấy danh sách năm học có sẵn (options cho dropdown)
  async getAcademicYearOptions() {
    try {
      const academicYears = await Schedule.distinct('academicYear', {
        isActive: true
      }).sort();

      // Nếu không có dữ liệu, tạo danh sách mặc định
      if (academicYears.length === 0) {
        const currentYear = new Date().getFullYear();
        const defaultYears = [];
        
        // Tạo 5 năm học: 2 năm trước, năm hiện tại, 2 năm sau
        for (let i = -2; i <= 2; i++) {
          const startYear = currentYear + i;
          const endYear = startYear + 1;
          defaultYears.push(`${startYear}-${endYear}`);
        }
        
        return {
          academicYears: defaultYears,
          currentAcademicYear: `${currentYear}-${currentYear + 1}`,
          totalYears: defaultYears.length
        };
      }

      // Xác định năm học hiện tại dựa trên ngày
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();
      
      let currentAcademicYear;
      if (currentMonth >= 9) {
        // Tháng 9-12: năm học hiện tại
        currentAcademicYear = `${currentYear}-${currentYear + 1}`;
      } else {
        // Tháng 1-8: năm học trước
        currentAcademicYear = `${currentYear - 1}-${currentYear}`;
      }

      return {
        academicYears: academicYears,
        currentAcademicYear: academicYears.includes(currentAcademicYear) 
          ? currentAcademicYear 
          : academicYears[academicYears.length - 1], // Lấy năm học mới nhất nếu không tìm thấy
        totalYears: academicYears.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách tất cả lớp học có sẵn
  async getAllClasses() {
    try {
      const classes = await Class.find({ isActive: true })
        .populate('homeroomTeacher', 'name email')
        .sort({ academicYear: -1, gradeLevel: 1, className: 1 });

      const groupedByYear = {};
      classes.forEach(cls => {
        if (!groupedByYear[cls.academicYear]) {
          groupedByYear[cls.academicYear] = [];
        }
        groupedByYear[cls.academicYear].push({
          id: cls._id,
          className: cls.className,
          gradeLevel: cls.gradeLevel,
          academicYear: cls.academicYear,
          homeroomTeacher: cls.homeroomTeacher ? {
            id: cls.homeroomTeacher._id,
            name: cls.homeroomTeacher.name,
            email: cls.homeroomTeacher.email
          } : null
        });
      });

      return {
        totalClasses: classes.length,
        academicYears: Object.keys(groupedByYear).sort().reverse(),
        classesByYear: groupedByYear
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin tuần học (weeks) cho năm học
  async getWeekOptions(academicYear) {
    try {
      // Xác định khoảng thời gian của năm học
      const [startYear, endYear] = academicYear.split('-').map(Number);
      
      // Năm học thường bắt đầu từ tháng 9 và kết thúc tháng 6 năm sau
      const schoolYearStart = new Date(startYear, 8, 1); // 1/9
      const schoolYearEnd = new Date(endYear, 5, 30); // 30/6
      
      // Tìm thứ hai đầu tiên của năm học
      const firstMonday = new Date(schoolYearStart);
      const dayOfWeek = firstMonday.getDay();
      const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
      if (daysToMonday > 0) {
        firstMonday.setDate(firstMonday.getDate() + daysToMonday);
      }

      const weeks = [];
      let currentWeekStart = new Date(firstMonday);
      let weekNumber = 1;

      while (currentWeekStart <= schoolYearEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 5); // Thứ bảy (6 ngày học)

        // Format ngày theo dd/mm
        const formatDate = (date) => {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          return `${day}/${month}`;
        };

        weeks.push({
          weekNumber: weekNumber,
          weekLabel: `${formatDate(currentWeekStart)} to ${formatDate(weekEnd)}`,
          startDate: currentWeekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          days: [
            {
              dayOfWeek: 1,
              dayName: 'MON',
              date: formatDate(new Date(currentWeekStart)),
              fullDate: new Date(currentWeekStart).toISOString().split('T')[0]
            },
            {
              dayOfWeek: 2,
              dayName: 'TUE',
              date: formatDate(new Date(currentWeekStart.getTime() + 24 * 60 * 60 * 1000)),
              fullDate: new Date(currentWeekStart.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              dayOfWeek: 3,
              dayName: 'WED',
              date: formatDate(new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000)),
              fullDate: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              dayOfWeek: 4,
              dayName: 'THU',
              date: formatDate(new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000)),
              fullDate: new Date(currentWeekStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              dayOfWeek: 5,
              dayName: 'FRI',
              date: formatDate(new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000)),
              fullDate: new Date(currentWeekStart.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              dayOfWeek: 6,
              dayName: 'SAT',
              date: formatDate(new Date(currentWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000)),
              fullDate: new Date(currentWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          ]
        });

        // Chuyển sang tuần tiếp theo
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNumber++;
      }

      // Xác định tuần hiện tại
      const now = new Date();
      const currentWeek = weeks.find(week => {
        const start = new Date(week.startDate);
        const end = new Date(week.endDate);
        return now >= start && now <= end;
      });

      return {
        academicYear,
        totalWeeks: weeks.length,
        weeks: weeks,
        currentWeek: currentWeek || weeks[0], // Nếu không tìm thấy tuần hiện tại, lấy tuần đầu
        schoolYearStart: schoolYearStart.toISOString().split('T')[0],
        schoolYearEnd: schoolYearEnd.toISOString().split('T')[0]
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thông tin time slots (khung giờ học)
  getTimeSlots() {
    return [
      {
        slot: 1,
        timeRange: '7:30-9:00',
        session: 'morning',
        duration: 90 // phút
      },
      {
        slot: 2,
        timeRange: '9:10-10:40',
        session: 'morning',
        duration: 90
      },
      {
        slot: 3,
        timeRange: '10:50-12:20',
        session: 'morning',
        duration: 90
      },
      {
        slot: 4,
        timeRange: '12:50-14:20',
        session: 'afternoon',
        duration: 90
      },
      {
        slot: 5,
        timeRange: '14:30-16:00',
        session: 'afternoon',
        duration: 90
      },
      {
        slot: 6,
        timeRange: '16:10-17:40',
        session: 'afternoon',
        duration: 90
      }
    ];
  }

  // Lấy thời khóa biểu theo tuần cụ thể và className
  async getScheduleByWeekAndClass(className, academicYear, weekStartDate, weekEndDate) {
    try {
      // Tìm lớp học theo className và năm học
      const classInfo = await Class.findOne({
        className: className,
        academicYear,
        isActive: true
      }).populate('homeroomTeacher', 'name email role');

      if (!classInfo) {
        throw new Error(`Class ${className} not found in academic year ${academicYear}`);
      }

      // Lấy thời khóa biểu của lớp
      const schedule = await Schedule.findOne({
        class: classInfo._id,
        academicYear,
        status: 'active',
        isActive: true
      })
        .populate('class', 'className academicYear homeroomTeacher')
        .populate({
          path: 'class',
          populate: {
            path: 'homeroomTeacher',
            select: 'name email role'
          }
        })
        .populate({
          path: 'weeklySchedule.periods.subject',
          select: 'subjectName subjectCode description'
        })
        .populate({
          path: 'weeklySchedule.periods.teacher',
          select: 'name email role'
        });

      if (!schedule) {
        throw new Error(`No schedule found for class ${className} in academic year ${academicYear}`);
      }

      // Lấy thông tin tuần được chọn
      const weekInfo = await this.getWeekOptions(academicYear);
      const selectedWeek = weekInfo.weeks.find(week => 
        week.startDate === weekStartDate && week.endDate === weekEndDate
      );

      if (!selectedWeek) {
        throw new Error(`Invalid week range: ${weekStartDate} to ${weekEndDate} for academic year ${academicYear}`);
      }

      return {
        academicYear,
        weekInfo: selectedWeek,
        class: {
          id: schedule.class._id,
          className: schedule.class.className,
          homeroomTeacher: schedule.class.homeroomTeacher
        },
        timeSlots: this.getTimeSlots(),
        weeklySchedule: schedule.weeklySchedule.map(day => ({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          totalPeriods: day.periods.length,
          periods: day.periods.map(period => ({
            periodNumber: period.periodNumber,
            session: period.session,
            subject: period.subject ? {
              id: period.subject._id,
              name: period.subject.subjectName,
              code: period.subject.subjectCode,
              description: period.subject.description
            } : null,
            teacher: period.teacher ? {
              id: period.teacher._id,
              name: period.teacher.name,
              email: period.teacher.email
            } : null,
            room: period.room,
            isBreak: period.isBreak,
            notes: period.notes
          }))
        })),
        scheduleInfo: {
          status: schedule.status,
          effectiveDate: schedule.effectiveDate,
          endDate: schedule.endDate,
          totalPeriodsPerWeek: schedule.totalPeriodsPerWeek,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thời khóa biểu theo tuần cụ thể (cho học sinh và giáo viên chủ nhiệm) - method cũ giữ lại để không breaking changes
  async getScheduleByWeek(token, academicYear, weekStartDate, weekEndDate) {
    try {
      // Verify token và lấy thông tin user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Kiểm tra quyền truy cập (tương tự getStudentSchedule)
      if (!currentUser.role.includes('student') && !currentUser.role.includes('admin') && !currentUser.role.includes('manager') && !currentUser.role.includes('teacher')) {
        throw new Error('Access denied. Only students, homeroom teachers, admin, and managers can view schedule');
      }

      let classId = null;

      // Xác định class_id dựa trên role (logic giống getStudentSchedule)
      if (currentUser.role.includes('student')) {
        // Học sinh: lấy class_id từ profile
        if (!currentUser.class_id) {
          throw new Error('Student is not assigned to any class. Please contact administrator.');
        }
        classId = currentUser.class_id;
      } else if (currentUser.role.includes('teacher')) {
        // Giáo viên: kiểm tra có phải chủ nhiệm không
        const homeroomClass = await Class.findOne({ 
          homeroomTeacher: currentUser._id,
          academicYear 
        });
        
        if (!homeroomClass) {
          throw new Error('Teacher is not a homeroom teacher of any class in this academic year. Only homeroom teachers can view class schedule.');
        }
        classId = homeroomClass._id;
      } else {
        // Admin/Manager: cần class_id từ query parameter (sẽ implement sau nếu cần)
        throw new Error('Admin/Manager access to specific class schedule not implemented yet');
      }

      // Lấy thời khóa biểu của lớp
      const schedule = await Schedule.findOne({
        class: classId,
        academicYear,
        status: 'active',
        isActive: true
      })
        .populate('class', 'className academicYear homeroomTeacher')
        .populate({
          path: 'class',
          populate: {
            path: 'homeroomTeacher',
            select: 'name email role'
          }
        })
        .populate({
          path: 'weeklySchedule.periods.subject',
          select: 'subjectName subjectCode description'
        })
        .populate({
          path: 'weeklySchedule.periods.teacher',
          select: 'name email role'
        });

      if (!schedule) {
        throw new Error(`No schedule found for your class in academic year ${academicYear}. Please contact your teacher.`);
      }

      // Lấy thông tin tuần được chọn
      const weekInfo = await this.getWeekOptions(academicYear);
      const selectedWeek = weekInfo.weeks.find(week => 
        week.startDate === weekStartDate && week.endDate === weekEndDate
      );

      if (!selectedWeek) {
        throw new Error(`Invalid week range: ${weekStartDate} to ${weekEndDate} for academic year ${academicYear}`);
      }

      return {
        academicYear,
        weekInfo: selectedWeek,
        class: {
          id: schedule.class._id,
          className: schedule.class.className,
          homeroomTeacher: schedule.class.homeroomTeacher
        },
        currentUser: {
          id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          studentId: currentUser.studentId || null,
          isHomeroomTeacher: currentUser.role.includes('teacher')
        },
        timeSlots: this.getTimeSlots(),
        weeklySchedule: schedule.weeklySchedule.map(day => ({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          totalPeriods: day.periods.length,
          periods: day.periods.map(period => ({
            periodNumber: period.periodNumber,
            session: period.session,
            subject: period.subject ? {
              id: period.subject._id,
              name: period.subject.subjectName,
              code: period.subject.subjectCode,
              description: period.subject.description
            } : null,
            teacher: period.teacher ? {
              id: period.teacher._id,
              name: period.teacher.name,
              email: period.teacher.email
            } : null,
            room: period.room,
            isBreak: period.isBreak,
            notes: period.notes
          }))
        })),
        scheduleInfo: {
          status: schedule.status,
          effectiveDate: schedule.effectiveDate,
          endDate: schedule.endDate,
          totalPeriodsPerWeek: schedule.totalPeriodsPerWeek,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ScheduleService(); 