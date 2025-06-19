# Student Schedule API Guide

## Tổng quan
API này cho phép học sinh và giáo viên chủ nhiệm xem thời khóa biểu của lớp trong năm học. Người dùng có thể xem toàn bộ thời khóa biểu tuần hoặc xem theo ngày cụ thể.

### Quyền truy cập:
- ✅ **Học sinh**: Xem thời khóa biểu của lớp mình
- ✅ **Giáo viên chủ nhiệm**: Xem thời khóa biểu của lớp mình chủ nhiệm  
- ✅ **Admin/Manager**: Có thể xem (chưa implement đầy đủ)

## Endpoints

### 1. Xem Thời Khóa Biểu Tuần (Tất cả các ngày)

**GET** `/api/schedules/student`

Lấy thời khóa biểu đầy đủ của học sinh trong một tuần.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `academicYear` (optional): Năm học (format: YYYY-YYYY, mặc định: 2024-2025)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule_id",
    "academicYear": "2024-2025",
    "gradeLevel": 12,
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
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "dayName": "Thứ Hai",
        "totalPeriods": 7,
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
          },
          {
            "periodNumber": 4,
            "session": "morning",
            "subject": null,
            "teacher": null,
            "room": "",
            "isBreak": true,
            "notes": "Giờ ra chơi"
          }
        ]
      }
    ],
    "scheduleInfo": {
      "status": "active",
      "effectiveDate": "2024-09-01T00:00:00.000Z",
      "endDate": "2025-05-31T23:59:59.999Z",
      "totalPeriodsPerWeek": 39,
      "createdAt": "2024-08-15T10:00:00.000Z",
      "updatedAt": "2024-08-15T10:00:00.000Z"
    }
  }
}
```

### 2. Xem Thời Khóa Biểu Theo Ngày

**GET** `/api/schedules/student/day/:dayOfWeek`

Lấy thời khóa biểu của một ngày cụ thể.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `dayOfWeek` (required): Thứ trong tuần (1-6, 1=Thứ Hai, 6=Thứ Bảy)

**Query Parameters:**
- `academicYear` (optional): Năm học (format: YYYY-YYYY, mặc định: 2024-2025)

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
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
    "daySchedule": {
      "dayOfWeek": 1,
      "dayName": "Thứ Hai",
      "totalPeriods": 7,
      "date": "2024-12-23",
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
        },
        {
          "periodNumber": 2,
          "session": "morning",
          "subject": {
            "id": "subject_id2",
            "name": "Văn",
            "code": "LIT",
            "description": "Ngữ văn"
          },
          "teacher": {
            "id": "teacher_id2",
            "name": "Nguyễn Thị D",
            "email": "lit@school.com"
          },
          "room": "P102",
          "isBreak": false,
          "notes": ""
        },
        {
          "periodNumber": 3,
          "session": "morning",
          "subject": {
            "id": "subject_id3",
            "name": "Anh",
            "code": "ENG",
            "description": "Tiếng Anh"
          },
          "teacher": {
            "id": "teacher_id3",
            "name": "Trần Văn E",
            "email": "eng@school.com"
          },
          "room": "P103",
          "isBreak": false,
          "notes": ""
        },
        {
          "periodNumber": 4,
          "session": "morning",
          "subject": null,
          "teacher": null,
          "room": "",
          "isBreak": true,
          "notes": "Giờ ra chơi"
        },
        {
          "periodNumber": 5,
          "session": "afternoon",
          "subject": {
            "id": "subject_id4",
            "name": "Lý",
            "code": "PHY",
            "description": "Vật lý"
          },
          "teacher": {
            "id": "teacher_id4",
            "name": "Lê Thị F",
            "email": "phy@school.com"
          },
          "room": "P201",
          "isBreak": false,
          "notes": ""
        },
        {
          "periodNumber": 6,
          "session": "afternoon",
          "subject": {
            "id": "subject_id5",
            "name": "Hóa",
            "code": "CHEM",
            "description": "Hóa học"
          },
          "teacher": {
            "id": "teacher_id5",
            "name": "Phạm Văn G",
            "email": "chem@school.com"
          },
          "room": "P202",
          "isBreak": false,
          "notes": ""
        },
        {
          "periodNumber": 7,
          "session": "afternoon",
          "subject": {
            "id": "subject_id6",
            "name": "Sinh",
            "code": "BIO",
            "description": "Sinh học"
          },
          "teacher": {
            "id": "teacher_id6",
            "name": "Hoàng Thị H",
            "email": "bio@school.com"
          },
          "room": "P203",
          "isBreak": false,
          "notes": ""
        }
      ]
    },
    "scheduleInfo": {
      "status": "active",
      "effectiveDate": "2024-09-01T00:00:00.000Z",
      "endDate": "2025-05-31T23:59:59.999Z",
      "totalPeriodsPerWeek": 39,
      "createdAt": "2024-08-15T10:00:00.000Z",
      "updatedAt": "2024-08-15T10:00:00.000Z"
    }
  }
}
```

## Thông tin về Days of Week

| Số | Tên ngày |
|----|----------|
| 1  | Thứ Hai  |
| 2  | Thứ Ba   |
| 3  | Thứ Tư   |
| 4  | Thứ Năm  |
| 5  | Thứ Sáu  |
| 6  | Thứ Bảy  |

## Cấu trúc Periods (Tiết học)

Hệ thống sử dụng lịch linh hoạt với số tiết khác nhau mỗi ngày:

### Phân bố tiết trong tuần:
- **Thứ Hai**: 7 tiết (4 buổi sáng + 3 buổi chiều)
- **Thứ Ba**: 6 tiết (3 buổi sáng + 3 buổi chiều)
- **Thứ Tư**: 7 tiết (4 buổi sáng + 3 buổi chiều)
- **Thứ Năm**: 6 tiết (3 buổi sáng + 3 buổi chiều)
- **Thứ Sáu**: 7 tiết (4 buổi sáng + 3 buổi chiều)
- **Thứ Bảy**: 6 tiết (3 buổi sáng + 3 buổi chiều)

**Tổng:** 39 tiết/tuần

### Sessions (Buổi học):
- `morning`: Buổi sáng
- `afternoon`: Buổi chiều
- `full_day`: Cả ngày (hiếm khi sử dụng)

### Break Periods (Giờ ra chơi):
- Tự động được đặt ở tiết giữa của mỗi buổi
- `isBreak: true` - Không có môn học và giáo viên
- Thường có `notes` giải thích

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Only students, homeroom teachers, admin, and managers can view schedule"
}
```

### 404 Not Found (Student)
```json
{
  "success": false,
  "message": "Student is not assigned to any class. Please contact administrator."
}
```

### 404 Not Found (Teacher)
```json
{
  "success": false,
  "message": "Teacher is not a homeroom teacher of any class in this academic year. Only homeroom teachers can view class schedule."
}
```

### 404 No Schedule
```json
{
  "success": false,
  "message": "No schedule found for your class in academic year 2024-2025. Please contact your teacher."
}
```

### 400 Invalid Day
```json
{
  "success": false,
  "message": "Day of week must be between 1 (Monday) and 6 (Saturday)"
}
```

### 400 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "2024-2023",
      "msg": "Academic year must be consecutive years (e.g., 2024-2025)",
      "path": "academicYear",
      "location": "query"
    }
  ]
}
```

## Lưu ý quan trọng

1. **Authentication**: Tất cả endpoints đều yêu cầu JWT token hợp lệ
2. **Authorization**: Chỉ học sinh (role=student) hoặc admin/manager mới có thể truy cập
3. **Class Assignment**: Học sinh phải được assign vào một lớp (có class_id)
4. **Academic Year**: Mặc định là 2024-2025, có thể thay đổi qua query parameter
5. **Schedule Status**: Chỉ lấy thời khóa biểu có status='active'
6. **Data Structure**: API trả về đầy đủ thông tin về môn học, giáo viên, phòng học

## Cách sử dụng

### Cho ứng dụng Mobile/Web:
1. Học sinh đăng nhập và lấy JWT token
2. Gọi API `/api/schedules/student` để lấy toàn bộ thời khóa biểu tuần
3. Hiển thị dưới dạng bảng hoặc calendar view
4. Có thể gọi API `/api/schedules/student/day/:dayOfWeek` để lấy thông tin chi tiết một ngày

### Cho notification system:
1. Sử dụng API theo ngày để lấy lịch học hôm nay/ngày mai
2. Gửi thông báo nhắc nhở về môn học, giáo viên, phòng học

### Cho báo cáo:
1. Sử dụng `scheduleInfo` để biết tổng số tiết/tuần
2. Thống kê số môn học, số giáo viên dạy 