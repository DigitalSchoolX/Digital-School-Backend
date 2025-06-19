# Calendar View API Guide

## Tổng quan
API này cung cấp các endpoints để hỗ trợ giao diện calendar view tương tự như hình ảnh bạn đã chia sẻ. Bao gồm:
- Dropdown năm học (Academic Year)
- Dropdown tuần học (Week options)
- Time slots (khung giờ học)
- Thời khóa biểu theo tuần cụ thể

## Endpoints

### 1. Lấy Danh Sách Năm Học (Academic Year Options)

**GET** `/api/schedules/academic-years`

Lấy danh sách tất cả năm học có sẵn để hiển thị trong dropdown.

**Headers:** Không cần authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYears": [
      "2022-2023",
      "2023-2024", 
      "2024-2025",
      "2025-2026",
      "2026-2027"
    ],
    "currentAcademicYear": "2024-2025",
    "totalYears": 5
  }
}
```

### 2. Lấy Danh Sách Tuần Học (Week Options)

**GET** `/api/schedules/weeks?academicYear=2024-2025`

Lấy tất cả tuần học trong năm học để hiển thị trong dropdown tuần.

**Query Parameters:**
- `academicYear` (required): Năm học (format: YYYY-YYYY)

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
    "totalWeeks": 38,
    "currentWeek": {
      "weekNumber": 12,
      "weekLabel": "16/06 to 21/06",
      "startDate": "2024-06-16",
      "endDate": "2024-06-21",
      "days": [
        {
          "dayOfWeek": 1,
          "dayName": "MON",
          "date": "16/06",
          "fullDate": "2024-06-16"
        },
        {
          "dayOfWeek": 2,
          "dayName": "TUE", 
          "date": "17/06",
          "fullDate": "2024-06-17"
        },
        {
          "dayOfWeek": 3,
          "dayName": "WED",
          "date": "18/06", 
          "fullDate": "2024-06-18"
        },
        {
          "dayOfWeek": 4,
          "dayName": "THU",
          "date": "19/06",
          "fullDate": "2024-06-19"
        },
        {
          "dayOfWeek": 5,
          "dayName": "FRI",
          "date": "20/06",
          "fullDate": "2024-06-20"
        },
        {
          "dayOfWeek": 6,
          "dayName": "SAT",
          "date": "21/06",
          "fullDate": "2024-06-21"
        }
      ]
    },
    "weeks": [
      {
        "weekNumber": 1,
        "weekLabel": "02/09 to 07/09",
        "startDate": "2024-09-02",
        "endDate": "2024-09-07",
        "days": [...]
      },
      // ... 37 tuần khác
    ],
    "schoolYearStart": "2024-09-01",
    "schoolYearEnd": "2025-06-30"
  }
}
```

### 3. Lấy Time Slots (Khung Giờ Học)

**GET** `/api/schedules/time-slots`

Lấy danh sách các khung giờ học (tương ứng với Slot 1-6 trong hình).

**Headers:** Không cần authentication

**Response:**
```json
{
  "success": true,
  "data": {
    "timeSlots": [
      {
        "slot": 1,
        "timeRange": "7:30-9:00",
        "session": "morning",
        "duration": 90
      },
      {
        "slot": 2,
        "timeRange": "9:10-10:40", 
        "session": "morning",
        "duration": 90
      },
      {
        "slot": 3,
        "timeRange": "10:50-12:20",
        "session": "morning", 
        "duration": 90
      },
      {
        "slot": 4,
        "timeRange": "12:50-14:20",
        "session": "afternoon",
        "duration": 90
      },
      {
        "slot": 5,
        "timeRange": "14:30-16:00",
        "session": "afternoon",
        "duration": 90
      },
      {
        "slot": 6,
        "timeRange": "16:10-17:40",
        "session": "afternoon", 
        "duration": 90
      }
    ],
    "totalSlots": 6
  }
}
```

### 4. Lấy Thời Khóa Biểu Theo Tuần

**GET** `/api/schedules/week?academicYear=2024-2025&weekStartDate=2024-06-16&weekEndDate=2024-06-21`

Lấy thời khóa biểu chi tiết cho tuần được chọn.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `academicYear` (required): Năm học
- `weekStartDate` (required): Ngày bắt đầu tuần (YYYY-MM-DD)
- `weekEndDate` (required): Ngày kết thúc tuần (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
    "weekInfo": {
      "weekNumber": 12,
      "weekLabel": "16/06 to 21/06",
      "startDate": "2024-06-16",
      "endDate": "2024-06-21",
      "days": [
        {
          "dayOfWeek": 1,
          "dayName": "MON",
          "date": "16/06",
          "fullDate": "2024-06-16"
        }
        // ... các ngày khác
      ]
    },
    "class": {
      "id": "class_id",
      "className": "12A1",
      "homeroomTeacher": {
        "id": "teacher_id",
        "name": "Nguyễn Văn A",
        "email": "teacher@school.com"
      }
    },
    "currentUser": {
      "id": "user_id",
      "name": "Trần Thị B",
      "email": "user@school.com",
      "role": ["student"],
      "studentId": "2024001",
      "isHomeroomTeacher": false
    },
    "timeSlots": [
      {
        "slot": 1,
        "timeRange": "7:30-9:00",
        "session": "morning",
        "duration": 90
      }
      // ... các slot khác
    ],
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "dayName": "Thứ Hai",
        "periods": [
          {
            "periodNumber": 1,
            "session": "morning",
            "subject": {
              "id": "subject_id",
              "name": "Toán",
              "code": "MATH",
              "description": "Môn Toán học"
            },
            "teacher": {
              "id": "teacher_id",
              "name": "Nguyễn Văn C",
              "email": "math@school.com"
            },
            "room": "P101",
            "isBreak": false,
            "notes": ""
          }
          // ... các period khác
        ]
      }
      // ... các ngày khác
    ],
    "scheduleInfo": {
      "status": "active",
      "effectiveDate": "2024-09-01T00:00:00.000Z",
      "endDate": "2025-06-30T23:59:59.999Z",
      "totalPeriodsPerWeek": 39
    }
  }
}
```

## Cách Tích Hợp với Frontend

### 1. Khởi tạo Calendar View

```javascript
// 1. Lấy danh sách năm học
const academicYears = await fetch('/api/schedules/academic-years');
const { academicYears, currentAcademicYear } = academicYears.data;

// 2. Lấy danh sách tuần cho năm học hiện tại
const weeks = await fetch(`/api/schedules/weeks?academicYear=${currentAcademicYear}`);
const { weeks, currentWeek } = weeks.data;

// 3. Lấy time slots
const timeSlots = await fetch('/api/schedules/time-slots');
const { timeSlots } = timeSlots.data;

// 4. Hiển thị calendar với tuần hiện tại
const schedule = await fetch(
  `/api/schedules/week?academicYear=${currentAcademicYear}&weekStartDate=${currentWeek.startDate}&weekEndDate=${currentWeek.endDate}`,
  { headers: { Authorization: `Bearer ${token}` }}
);
```

### 2. Xử lý Dropdown Changes

```javascript
// Khi user thay đổi năm học
function onAcademicYearChange(selectedYear) {
  // Lấy lại danh sách tuần cho năm mới
  const weeks = await fetch(`/api/schedules/weeks?academicYear=${selectedYear}`);
  updateWeekDropdown(weeks.data.weeks);
  
  // Load tuần đầu tiên của năm học mới
  const firstWeek = weeks.data.weeks[0];
  loadScheduleForWeek(selectedYear, firstWeek);
}

// Khi user thay đổi tuần
function onWeekChange(selectedWeek) {
  const currentYear = getCurrentAcademicYear();
  loadScheduleForWeek(currentYear, selectedWeek);
}

async function loadScheduleForWeek(academicYear, week) {
  const schedule = await fetch(
    `/api/schedules/week?academicYear=${academicYear}&weekStartDate=${week.startDate}&weekEndDate=${week.endDate}`,
    { headers: { Authorization: `Bearer ${token}` }}
  );
  
  renderCalendarGrid(schedule.data);
}
```

### 3. Render Calendar Grid

```javascript
function renderCalendarGrid(scheduleData) {
  const { weekInfo, timeSlots, weeklySchedule } = scheduleData;
  
  // Render header với ngày
  renderWeekHeader(weekInfo.days);
  
  // Render time slots ở cột bên trái
  renderTimeSlots(timeSlots);
  
  // Render schedule data vào grid
  timeSlots.forEach(slot => {
    weekInfo.days.forEach(day => {
      const daySchedule = weeklySchedule.find(d => d.dayOfWeek === day.dayOfWeek);
      const period = daySchedule?.periods.find(p => p.periodNumber === slot.slot);
      
      renderScheduleCell(slot.slot, day.dayOfWeek, period);
    });
  });
}

function renderScheduleCell(slot, dayOfWeek, period) {
  if (period?.isBreak) {
    // Render break period
    return `<div class="break-cell">Giờ ra chơi</div>`;
  } else if (period?.subject) {
    // Render subject period
    return `
      <div class="subject-cell">
        <div class="subject-name">${period.subject.name}</div>
        <div class="teacher-name">${period.teacher.name}</div>
        <div class="room">${period.room}</div>
      </div>
    `;
  } else {
    // Empty cell
    return `<div class="empty-cell"></div>`;
  }
}
```

## CSS Grid Layout Example

```css
.calendar-grid {
  display: grid;
  grid-template-columns: 150px repeat(6, 1fr); /* Time slot column + 6 days */
  grid-template-rows: 50px repeat(6, 80px); /* Header row + 6 time slots */
  gap: 1px;
  background-color: #ddd;
}

.header-cell {
  background-color: #4a90e2;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.time-slot-cell {
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.subject-cell {
  background-color: white;
  padding: 5px;
  border: 1px solid #ddd;
}

.break-cell {
  background-color: #ffeb3b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
}

.empty-cell {
  background-color: #f9f9f9;
}
```

## Error Handling

### Common Errors

```json
// Năm học không hợp lệ
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)",
      "param": "academicYear"
    }
  ]
}

// Tuần không hợp lệ
{
  "success": false, 
  "message": "Week end date must be after week start date"
}

// Không tìm thấy thời khóa biểu
{
  "success": false,
  "message": "No schedule found for class in academic year 2024-2025"
}
```

## Curl Examples

```bash
# Lấy danh sách năm học
curl -X GET "http://localhost:3000/api/schedules/academic-years"

# Lấy danh sách tuần
curl -X GET "http://localhost:3000/api/schedules/weeks?academicYear=2024-2025"

# Lấy time slots
curl -X GET "http://localhost:3000/api/schedules/time-slots"

# Lấy thời khóa biểu theo tuần
curl -X GET "http://localhost:3000/api/schedules/week?academicYear=2024-2025&weekStartDate=2024-06-16&weekEndDate=2024-06-21" \
  -H "Authorization: Bearer <token>"
```

## Lưu ý Implementation

1. **Caching**: Nên cache danh sách năm học và time slots vì ít thay đổi
2. **Performance**: Tuần học có thể cache theo academic year
3. **Responsive**: Calendar grid nên responsive cho mobile
4. **Loading States**: Hiển thị loading khi đang fetch data
5. **Error Boundaries**: Xử lý errors gracefully
6. **Accessibility**: Thêm ARIA labels cho screen readers 