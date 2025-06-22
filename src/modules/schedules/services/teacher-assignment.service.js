const User = require('../../auth/models/user.model');
const Class = require('../../classes/models/class.model');
const Schedule = require('../models/schedule.model');

class TeacherAssignmentService {
  constructor() {
    // Track teacher schedules across all classes to avoid conflicts
    this.teacherSchedules = new Map(); // teacherId -> Map(dayOfWeek -> Set(periods))
    // Track teacher-class-subject assignments to ensure exclusivity
    this.teacherClassAssignments = new Map(); // teacherId -> Set(classId)
    this.classSubjectTeachers = new Map(); // classId -> Map(subjectId -> teacherId)
    // Track teacher workload for fair distribution
    this.teacherWorkload = new Map(); // teacherId -> number of classes assigned
    this.subjectTeacherRotation = new Map(); // subjectId -> next teacher index to assign
  }

  /**
   * Reset teacher schedules for new academic year
   */
  resetTeacherSchedules() {
    this.teacherSchedules.clear();
    this.teacherClassAssignments.clear();
    this.classSubjectTeachers.clear();
    this.teacherWorkload.clear();
    this.subjectTeacherRotation.clear();
  }

  /**
   * Check if teacher is available at specific time
   */
  isTeacherAvailable(teacherId, dayOfWeek, periodNumber) {
    if (!this.teacherSchedules.has(teacherId)) {
      return true;
    }
    
    const teacherDaySchedule = this.teacherSchedules.get(teacherId).get(dayOfWeek);
    if (!teacherDaySchedule) {
      return true;
    }
    
    return !teacherDaySchedule.has(periodNumber);
  }

  /**
   * Book teacher for specific time slot
   */
  bookTeacher(teacherId, dayOfWeek, periodNumber) {
    if (!this.teacherSchedules.has(teacherId)) {
      this.teacherSchedules.set(teacherId, new Map());
    }
    
    const teacherSchedule = this.teacherSchedules.get(teacherId);
    if (!teacherSchedule.has(dayOfWeek)) {
      teacherSchedule.set(dayOfWeek, new Set());
    }
    
    teacherSchedule.get(dayOfWeek).add(periodNumber);
  }

  /**
   * Tạo bản đồ phân công giáo viên cho một lớp
   * Logic: Mỗi môn của một lớp chỉ do 1 giáo viên dạy
   * Ưu tiên giáo viên chủ nhiệm dạy môn chuyên môn của mình
   */
  async createTeacherAssignmentMap(classId, subjects) {
    try {
      // Lấy thông tin lớp và giáo viên chủ nhiệm
      const classInfo = await Class.findById(classId)
        .populate({
          path: 'homeroomTeacher',
          select: 'name email subject',
          populate: {
            path: 'subject',
            select: 'subjectName subjectCode department'
          }
        });

      if (!classInfo) {
        throw new Error('Class not found');
      }

      // Lấy tất cả giáo viên có thể dạy các môn này
      const subjectIds = subjects.map(s => s._id);
      const availableTeachers = await User.find({
        role: 'teacher',
        'subject': { $in: subjectIds },
        active: true
      }).populate('subject', 'subjectName subjectCode department');

      // Tạo bản đồ phân công
      const teacherAssignmentMap = new Map();
      const assignedTeachers = new Set(); // Track giáo viên đã được phân công

      console.log(`\n🎯 Tạo bản đồ phân công cho lớp ${classInfo.className}`);
      console.log(`👨‍🏫 Giáo viên chủ nhiệm: ${classInfo.homeroomTeacher?.name || 'Chưa có'}`);

      // Bước 1: Ưu tiên phân công giáo viên chủ nhiệm dạy môn chuyên môn
      if (classInfo.homeroomTeacher && classInfo.homeroomTeacher.subject) {
        const homeroomTeacher = classInfo.homeroomTeacher;
        const homeroomSubject = homeroomTeacher.subject;

        for (const subject of subjects) {
          // Kiểm tra xem giáo viên chủ nhiệm có dạy được môn này không
          const canTeach = homeroomSubject._id.toString() === subject._id.toString();

          if (canTeach && !teacherAssignmentMap.has(subject._id.toString())) {
            teacherAssignmentMap.set(subject._id.toString(), {
              teacher: homeroomTeacher,
              subject: subject,
              subjectName: subject.subjectName,
              reason: 'homeroom_teacher'
            });
            assignedTeachers.add(homeroomTeacher._id.toString());
            
            // Track teacher-class assignment for homeroom teacher
            this.trackTeacherAssignment(homeroomTeacher._id.toString(), classId, subject._id.toString());
            
            console.log(`✅ Phân công chủ nhiệm: ${homeroomTeacher.name} dạy ${subject.subjectName}`);
          }
        }
      }

      // Bước 2: Phân công các môn còn lại cho giáo viên khác
      for (const subject of subjects) {
        const subjectKey = subject._id.toString();
        
        if (!teacherAssignmentMap.has(subjectKey)) {
          // Tìm giáo viên phù hợp chưa được phân công cho lớp này
          const suitableTeacher = this.findBestTeacherForSubject(
            subject, 
            availableTeachers, 
            assignedTeachers,
            classId
          );

          if (suitableTeacher) {
            teacherAssignmentMap.set(subjectKey, {
              teacher: suitableTeacher,
              subject: subject,
              subjectName: subject.subjectName,
              reason: 'regular_teacher'
            });
            assignedTeachers.add(suitableTeacher._id.toString());
            
            // Track teacher-class assignment
            this.trackTeacherAssignment(suitableTeacher._id.toString(), classId, subject._id.toString());
            
            console.log(`✅ Phân công: ${suitableTeacher.name} dạy ${subject.subjectName}`);
          } else {
            console.log(`⚠️ Không tìm thấy giáo viên cho môn ${subject.subjectName}`);
          }
        }
      }

      console.log(`\n📊 Tổng kết phân công:`);
      console.log(`- Số môn: ${subjects.length}`);
      console.log(`- Số môn đã phân công: ${teacherAssignmentMap.size}`);
      console.log(`- Số giáo viên tham gia: ${assignedTeachers.size}`);

      return teacherAssignmentMap;

    } catch (error) {
      throw new Error(`Failed to create teacher assignment map: ${error.message}`);
    }
  }

  /**
   * Tìm giáo viên tốt nhất cho một môn học với phân bổ công bằng
   * Ưu tiên chia đều giáo viên cùng môn cho các lớp khác nhau
   */
  findBestTeacherForSubject(subject, availableTeachers, assignedTeachers, classId) {
    // Tìm tất cả giáo viên có thể dạy môn này
    const qualifiedTeachers = availableTeachers.filter(teacher =>
      teacher.subject && teacher.subject._id.toString() === subject._id.toString()
    );

    if (qualifiedTeachers.length === 0) {
      return null;
    }

    // Lọc giáo viên chưa được phân công cho lớp này
    const availableForThisClass = qualifiedTeachers.filter(teacher => 
      !assignedTeachers.has(teacher._id.toString())
    );

    if (availableForThisClass.length === 0) {
      return null;
    }

    // Sắp xếp theo workload (ít việc nhất lên đầu) để phân bổ đều
    const sortedByWorkload = availableForThisClass.sort((a, b) => {
      const workloadA = this.teacherWorkload.get(a._id.toString()) || 0;
      const workloadB = this.teacherWorkload.get(b._id.toString()) || 0;
      
      // Ưu tiên giáo viên có ít việc hơn
      if (workloadA !== workloadB) {
        return workloadA - workloadB;
      }
      
      // Nếu workload bằng nhau, ưu tiên theo tên để có tính nhất quán
      return a.name.localeCompare(b.name);
    });

    // Sử dụng rotation để đảm bảo phân bổ đều
    const subjectKey = subject._id.toString();
    if (!this.subjectTeacherRotation.has(subjectKey)) {
      this.subjectTeacherRotation.set(subjectKey, 0);
    }

    // Lấy index hiện tại và tăng lên cho lần sau
    let currentIndex = this.subjectTeacherRotation.get(subjectKey);
    if (currentIndex >= sortedByWorkload.length) {
      currentIndex = 0; // Reset về đầu nếu vượt quá
    }
    
    // Cập nhật index cho lần phân công tiếp theo
    this.subjectTeacherRotation.set(subjectKey, (currentIndex + 1) % sortedByWorkload.length);

    // Trả về giáo viên theo rotation
    return sortedByWorkload[currentIndex];
  }

  /**
   * Track teacher assignment to class and subject
   */
  trackTeacherAssignment(teacherId, classId, subjectId) {
    // Track teacher-class assignments
    if (!this.teacherClassAssignments.has(teacherId)) {
      this.teacherClassAssignments.set(teacherId, new Set());
    }
    this.teacherClassAssignments.get(teacherId).add(classId.toString());
    
    // Track class-subject-teacher mapping
    if (!this.classSubjectTeachers.has(classId.toString())) {
      this.classSubjectTeachers.set(classId.toString(), new Map());
    }
    this.classSubjectTeachers.get(classId.toString()).set(subjectId.toString(), teacherId);
    
    // Update teacher workload
    const currentWorkload = this.teacherWorkload.get(teacherId) || 0;
    this.teacherWorkload.set(teacherId, currentWorkload + 1);
  }

  /**
   * Lấy giáo viên được phân công cho một môn học cụ thể
   */
  getAssignedTeacher(teacherAssignmentMap, subjectId) {
    const assignment = teacherAssignmentMap.get(subjectId.toString());
    return assignment ? assignment.teacher : null;
  }

  /**
   * Kiểm tra tính hợp lệ của bản đồ phân công
   */
  validateAssignment(teacherAssignmentMap, subjects) {
    const issues = [];

    // Kiểm tra tất cả môn đều có giáo viên
    for (const subject of subjects) {
      if (!teacherAssignmentMap.has(subject._id.toString())) {
        issues.push(`Môn ${subject.subjectName} chưa có giáo viên`);
      }
    }

    // Kiểm tra không có môn nào có nhiều hơn 1 giáo viên
    const subjectTeacherCount = new Map();
    for (const [subjectId, assignment] of teacherAssignmentMap) {
      const count = subjectTeacherCount.get(subjectId) || 0;
      subjectTeacherCount.set(subjectId, count + 1);
      
      if (count > 0) {
        issues.push(`Môn ${assignment.subject.subjectName} có nhiều hơn 1 giáo viên`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * In báo cáo phân công giáo viên
   */
  printAssignmentReport(teacherAssignmentMap, className) {
    console.log(`\n📋 BÁO CÁO PHÂN CÔNG GIÁO VIÊN - LỚP ${className}`);
    console.log('='.repeat(60));

    const teacherSubjects = new Map();
    
    // Nhóm theo giáo viên
    for (const [subjectId, assignment] of teacherAssignmentMap) {
      const teacherName = assignment.teacher.name;
      const teacherId = assignment.teacher._id.toString();
      if (!teacherSubjects.has(teacherName)) {
        teacherSubjects.set(teacherName, {
          subjects: [],
          workload: this.teacherWorkload.get(teacherId) || 0
        });
      }
      teacherSubjects.get(teacherName).subjects.push({
        subject: assignment.subject.subjectName,
        reason: assignment.reason
      });
    }

    // In báo cáo
    for (const [teacherName, data] of teacherSubjects) {
      const homeroomIndicator = data.subjects.some(s => s.reason === 'homeroom_teacher') ? ' (Chủ nhiệm)' : '';
      console.log(`👨‍🏫 ${teacherName}${homeroomIndicator} [${data.workload} lớp]:`);
      data.subjects.forEach(s => {
        const priorityIcon = s.reason === 'homeroom_teacher' ? '⭐' : '📚';
        console.log(`   ${priorityIcon} ${s.subject}`);
      });
      console.log('');
    }
  }

  /**
   * In báo cáo tổng thể workload của giáo viên
   */
  printWorkloadSummary() {
    console.log(`\n📊 BÁO CÁO PHÂN BỔ WORKLOAD GIÁO VIÊN`);
    console.log('='.repeat(60));
    
    // Sắp xếp theo workload
    const sortedWorkload = Array.from(this.teacherWorkload.entries())
      .sort((a, b) => b[1] - a[1]); // Cao nhất trước

    sortedWorkload.forEach(([teacherId, workload]) => {
      // Tìm tên giáo viên (cần cải thiện - có thể cache tên giáo viên)
      console.log(`👨‍🏫 Teacher ${teacherId}: ${workload} lớp`);
    });
  }

  /**
   * Create optimized schedule with conflict checking and subject grouping
   */
  async createOptimizedScheduleWithConflictCheck(classId, subjects, teacherAssignmentMap, className) {
    const Schedule = require('../models/schedule.model');
    const Class = require('../../classes/models/class.model');
    
    // Get homeroom teacher ID
    const classInfo = await Class.findById(classId).populate('homeroomTeacher');
    const homeroomTeacherId = classInfo.homeroomTeacher._id;
    
    // Create schedule template
    const schedule = {
      class: classId,
      academicYear: '2024-2025',
      semester: 1,
      status: 'active',
      createdBy: homeroomTeacherId, // Add required createdBy field
      schedule: []
    };

    // Tạo template sử dụng method mới
    const templateSchedule = await Schedule.createTemplate(classId, '2024-2025', homeroomTeacherId);
    schedule.weeks = templateSchedule.weeks;
    schedule.academicStartDate = templateSchedule.academicStartDate;
    schedule.totalWeeks = templateSchedule.totalWeeks;

    // Create subject periods list with better distribution
    const subjectPeriods = this.createBalancedSubjectDistribution(subjects);
    
    console.log(`📊 Tổng số tiết cần xếp: ${subjectPeriods.length}`);

    let placedPeriods = 0;
    let conflictCount = 0;

         // Try to place subjects with better distribution strategy
     // Chỉ xếp cho tuần đầu tiên, các tuần khác sẽ copy
     const firstWeek = schedule.weeks[0];
     if (!firstWeek) {
       throw new Error('No weeks found in schedule template');
     }

     let currentPeriodIndex = 0;
     const dailySubjectCount = {}; // Track subjects per day to avoid overloading
     
     for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
       const daySchedule = firstWeek.days[dayIndex];
       const dayOfWeek = dayIndex + 2;
       dailySubjectCount[dayIndex] = {};
       
       // Skip flag ceremony (Monday period 1) and class meeting (Saturday period 7)
       const skipPeriods = [];
       if (dayIndex === 0) skipPeriods.push(1); // Monday period 1: Flag ceremony
       if (dayIndex === 5) skipPeriods.push(7); // Saturday period 7: Class meeting

       // Try to place periods for this day
       for (let period = 1; period <= 10 && currentPeriodIndex < subjectPeriods.length; period++) {
         if (skipPeriods.includes(period)) continue;

         // Tìm tiết regular tương ứng
         const existingPeriod = daySchedule.periods.find(p => p.periodNumber === period && p.periodType === 'regular');
         if (!existingPeriod) continue; // Skip nếu không tìm thấy period regular

         // Find best subject for this time slot
         let bestSubjectIndex = -1;
         let bestSubject = null;
         let bestTeacher = null;

         // Look for a subject that can be placed here
         for (let i = currentPeriodIndex; i < Math.min(currentPeriodIndex + 10, subjectPeriods.length); i++) {
           const subject = subjectPeriods[i];
           const assignedTeacher = this.getAssignedTeacher(teacherAssignmentMap, subject._id);
           
           if (assignedTeacher && this.isTeacherAvailable(assignedTeacher._id, dayOfWeek, period)) {
             // Check if we haven't placed too many of this subject today
             const subjectCountToday = dailySubjectCount[dayIndex][subject.subjectName] || 0;
             if (subjectCountToday < 2) { // Max 2 periods per subject per day
               bestSubjectIndex = i;
               bestSubject = subject;
               bestTeacher = assignedTeacher;
               break;
             }
           }
         }

         if (bestSubject && bestTeacher) {
           // Book the teacher
           this.bookTeacher(bestTeacher._id, dayOfWeek, period);
           
           // Track subject count for this day
           dailySubjectCount[dayIndex][bestSubject.subjectName] = (dailySubjectCount[dayIndex][bestSubject.subjectName] || 0) + 1;
           
           // Cập nhật tiết regular với thông tin môn học và giáo viên
           existingPeriod.subject = bestSubject._id;
           existingPeriod.teacher = bestTeacher._id;

           console.log(`✅ Tiết ${period} - ${this.getDayName(dayIndex)}: ${bestSubject.subjectName} (${bestTeacher.name})`);
           
           // Remove the placed subject from the list
           subjectPeriods.splice(bestSubjectIndex, 1);
           placedPeriods++;
         } else {
           // Try to find any available subject/teacher combination
           let foundAlternative = false;
           for (let i = currentPeriodIndex; i < subjectPeriods.length; i++) {
             const subject = subjectPeriods[i];
             const assignedTeacher = this.getAssignedTeacher(teacherAssignmentMap, subject._id);
             
             if (assignedTeacher) {
               const alternativeTeacher = await this.findAlternativeTeacher(subject, assignedTeacher._id, dayOfWeek, period);
               if (alternativeTeacher) {
                 this.bookTeacher(alternativeTeacher._id, dayOfWeek, period);
                 
                 // Cập nhật tiết regular với thông tin môn học và giáo viên
                 existingPeriod.subject = subject._id;
                 existingPeriod.teacher = alternativeTeacher._id;

                 console.log(`✅ Thay thế: Tiết ${period} - ${this.getDayName(dayIndex)}: ${subject.subjectName} (${alternativeTeacher.name})`);
                 subjectPeriods.splice(i, 1);
                 placedPeriods++;
                 foundAlternative = true;
                 break;
               }
             }
           }
           
           if (!foundAlternative) {
             console.log(`⚠️ Không thể xếp tiết ${period} - ${this.getDayName(dayIndex)}`);
             conflictCount++;
           }
         }
       }
     }

     // Copy lịch từ tuần đầu tiên sang các tuần khác
     this.copyScheduleToAllWeeks(schedule);

    // Add fixed periods
    this.addFixedPeriods(schedule, homeroomTeacherId);
    
    console.log(`📈 Đã xếp ${placedPeriods}/${subjectPeriods.length} tiết học`);
    console.log(`⚠️ Số xung đột: ${conflictCount}`);

    return new Schedule(schedule);
  }

  /**
   * Create balanced subject distribution with better spreading
   * Based on the schedule.js pattern for more natural distribution
   */
  createBalancedSubjectDistribution(subjects) {
    // Create a more natural distribution pattern
    const subjectPeriods = [];
    const subjectCounts = {};
    
    // Count periods per subject
    subjects.forEach(subject => {
      const periodsPerWeek = subject.periodsPerWeek || 3;
      subjectCounts[subject._id.toString()] = {
        subject: subject,
        remaining: periodsPerWeek,
        total: periodsPerWeek
      };
    });

    // Create weekly schedule template (6 days, varying periods per day)
    const weeklyTemplate = [
      { day: 'Monday', periods: 5 },    // 5 periods (skip flag ceremony)
      { day: 'Tuesday', periods: 6 },   // 6 periods
      { day: 'Wednesday', periods: 6 }, // 6 periods  
      { day: 'Thursday', periods: 6 },  // 6 periods
      { day: 'Friday', periods: 6 },    // 6 periods
      { day: 'Saturday', periods: 4 }   // 4 periods (skip class meeting)
    ];

    // Distribute subjects across days more naturally
    const dailySchedules = [];
    let totalPeriodsNeeded = Object.values(subjectCounts).reduce((sum, s) => sum + s.total, 0);
    
    for (const dayTemplate of weeklyTemplate) {
      const daySchedule = [];
      const availableSubjects = Object.values(subjectCounts)
        .filter(s => s.remaining > 0)
        .sort((a, b) => {
          // Prioritize subjects with more remaining periods
          if (b.remaining !== a.remaining) {
            return b.remaining - a.remaining;
          }
          // Then by subject name for consistency
          return a.subject.subjectName.localeCompare(b.subject.subjectName);
        });

      // Fill this day's periods
      for (let period = 0; period < Math.min(dayTemplate.periods, availableSubjects.length); period++) {
        if (availableSubjects[period] && availableSubjects[period].remaining > 0) {
          daySchedule.push(availableSubjects[period].subject);
          availableSubjects[period].remaining--;
        }
      }
      
      dailySchedules.push(daySchedule);
    }

    // Flatten the daily schedules
    const distributedPeriods = [];
    dailySchedules.forEach(day => {
      distributedPeriods.push(...day);
    });

    // Add any remaining periods
    Object.values(subjectCounts).forEach(subjectCount => {
      while (subjectCount.remaining > 0) {
        distributedPeriods.push(subjectCount.subject);
        subjectCount.remaining--;
      }
    });
    
    return distributedPeriods;
  }

  /**
   * Find alternative teacher for subject when primary teacher has conflict
   */
  async findAlternativeTeacher(subject, excludeTeacherId, dayOfWeek, period) {
    const alternativeTeachers = await User.find({
      role: 'teacher',
      'subject': subject._id,
      active: true,
      _id: { $ne: excludeTeacherId }
    }).populate('subject', 'subjectName subjectCode department');

    for (const teacher of alternativeTeachers) {
      if (this.isTeacherAvailable(teacher._id, dayOfWeek, period)) {
        return teacher;
      }
    }

    return null;
  }

  /**
   * Add fixed periods (flag ceremony, class meeting)
   */
  addFixedPeriods(schedule, homeroomTeacherId) {
    // Thêm tiết chào cờ (Thứ 2, tiết 1) và sinh hoạt lớp (Thứ 7, tiết 7) cho tất cả các tuần
    schedule.weeks.forEach(week => {
      // Tiết chào cờ - Thứ 2, tiết 1
      const mondayPeriod1 = week.days[0].periods.find(p => p.periodNumber === 1);
      if (mondayPeriod1) {
        mondayPeriod1.subject = null;
        mondayPeriod1.teacher = homeroomTeacherId;
        mondayPeriod1.periodType = 'fixed';
        mondayPeriod1.specialType = 'flag_ceremony';
        mondayPeriod1.fixed = true;
      }

      // Sinh hoạt lớp - Thứ 7, tiết 7
      const saturdayPeriod7 = week.days[5].periods.find(p => p.periodNumber === 7);
      if (saturdayPeriod7) {
        saturdayPeriod7.subject = null;
        saturdayPeriod7.teacher = homeroomTeacherId;
        saturdayPeriod7.periodType = 'fixed';
        saturdayPeriod7.specialType = 'class_meeting';
        saturdayPeriod7.fixed = true;
      }
    });
  }

  /**
   * Copy schedule from first week to all other weeks
   */
  copyScheduleToAllWeeks(schedule) {
    const firstWeek = schedule.weeks[0];
    if (!firstWeek) return;

    // Copy lịch từ tuần đầu tiên sang các tuần khác
    for (let weekIndex = 1; weekIndex < schedule.weeks.length; weekIndex++) {
      const currentWeek = schedule.weeks[weekIndex];
      
      // Copy từng ngày
      for (let dayIndex = 0; dayIndex < firstWeek.days.length; dayIndex++) {
        const firstWeekDay = firstWeek.days[dayIndex];
        const currentWeekDay = currentWeek.days[dayIndex];
        
        // Copy từng tiết (chỉ copy subject và teacher cho regular periods)
        for (let periodIndex = 0; periodIndex < firstWeekDay.periods.length; periodIndex++) {
          const firstWeekPeriod = firstWeekDay.periods[periodIndex];
          const currentWeekPeriod = currentWeekDay.periods[periodIndex];
          
          if (currentWeekPeriod && firstWeekPeriod) {
            // Chỉ copy cho regular periods
            if (firstWeekPeriod.periodType === 'regular' && firstWeekPeriod.subject && firstWeekPeriod.teacher) {
              currentWeekPeriod.subject = firstWeekPeriod.subject;
              currentWeekPeriod.teacher = firstWeekPeriod.teacher;
              currentWeekPeriod.periodType = 'regular';
            }
            // Copy fixed periods (chào cờ, sinh hoạt lớp)
            else if (firstWeekPeriod.periodType === 'fixed' || firstWeekPeriod.fixed) {
              currentWeekPeriod.teacher = firstWeekPeriod.teacher;
              currentWeekPeriod.periodType = 'fixed';
              currentWeekPeriod.specialType = firstWeekPeriod.specialType;
              currentWeekPeriod.fixed = firstWeekPeriod.fixed;
              // Empty periods giữ nguyên là empty, không copy subject/teacher
            }
            // Empty periods giữ nguyên
            // Không cần làm gì cho empty periods vì chúng đã được tạo đúng
          }
        }
      }
    }
  }

  /**
   * Get time slot for period number
   */
  getTimeSlot(periodNumber) {
    const timeSlots = [
      { start: '07:00', end: '07:45', session: 'morning' },
      { start: '07:50', end: '08:35', session: 'morning' },
      { start: '08:40', end: '09:25', session: 'morning' },
      { start: '09:45', end: '10:30', session: 'morning' },
      { start: '10:35', end: '11:20', session: 'morning' },
      { start: '13:30', end: '14:15', session: 'afternoon' },
      { start: '14:20', end: '15:05', session: 'afternoon' }
    ];
    return timeSlots[periodNumber - 1] || timeSlots[0];
  }

  /**
   * Get day name for index
   */
  getDayName(dayIndex) {
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return dayNames[dayIndex] || `Day ${dayIndex + 1}`;
  }
}

module.exports = TeacherAssignmentService; 