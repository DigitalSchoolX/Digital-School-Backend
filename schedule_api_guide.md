# Thời Khóa Biểu API - Hướng Dẫn Sử Dụng

## Tổng Quan
API này cho phép Manager tạo và quản lý thời khóa biểu cho các khối lớp trong năm học. Hệ thống sẽ tự động phân bổ môn học và giáo viên dựa trên cấu trúc dữ liệu có sẵn.

## Cấu Trúc Thời Khóa Biểu
- **Số tiết mỗi ngày**: 6-7 tiết (linh hoạt theo ngày)
- **Chia thành 2 buổi**: Sáng và Chiều
- **Giờ ra chơi**: Tiết giữa (thường là tiết 3-4 tùy theo tổng số tiết)
- **Ngày trong tuần**: Thứ 2 - Thứ 7
- **Phân bổ tiết theo ngày**:
  - Thứ 2: 7 tiết
  - Thứ 3: 6 tiết
  - Thứ 4: 7 tiết
  - Thứ 5: 6 tiết
  - Thứ 6: 7 tiết
  - Thứ 7: 6 tiết

## Authentication
Tất cả API endpoints yêu cầu Bearer token trong header:
```
Authorization: Bearer <your_jwt_token>
```

**Quyền truy cập:**
- **Manager/Admin**: Tạo, xóa thời khóa biểu
- **Teacher**: Xem và cập nhật thời khóa biểu
- **Student**: Chỉ xem thời khóa biểu của lớp mình

---

## API Endpoints

### 1. Preview Tạo Thời Khóa Biểu
**Endpoint**: `POST /api/schedules/preview`  
**Quyền**: Manager, Admin  
**Mô tả**: Kiểm tra trước khi tạo thời khóa biểu, xem lớp nào đã có/chưa có thời khóa biểu

**Request Body:**
```json
{
  "academicYear": "2024-2025",
  "gradeLevel": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "totalClasses": 5,
    "classesWithSchedule": 2,
    "classesWithoutSchedule": 3,
    "classesList": [
      {
        "id": "64f1b2a3c4d5e6f7g8h9i0j1",
        "className": "12A1",
        "homeroomTeacher": "Nguyễn Văn A",
        "hasSchedule": true
      },
      {
        "id": "64f1b2a3c4d5e6f7g8h9i0j2",
        "className": "12A2",
        "homeroomTeacher": "Trần Thị B",
        "hasSchedule": false
      }
    ]
  }
}
```

---

### 2. Tạo Thời Khóa Biểu Cho Khối
**Endpoint**: `POST /api/schedules`  
**Quyền**: Manager, Admin  
**Mô tả**: Tạo thời khóa biểu cho tất cả lớp trong khối và năm học được chỉ định

**Request Body:**
```json
{
  "academicYear": "2024-2025",
  "gradeLevel": 12,
  "effectiveDate": "2024-09-01T00:00:00.000Z",
  "endDate": "2025-06-30T00:00:00.000Z",
  "customSchedule": {
    "daysOfWeek": [1, 2, 3, 4, 5, 6],
    "periodsPerDay": {
      "1": 10,  // Thứ 2: 10 tiết
      "2": 10,  // Thứ 3: 10 tiết
      "3": 10,  // Thứ 4: 10 tiết
      "4": 10,  // Thứ 5: 10 tiết
      "5": 9,   // Thứ 6: 9 tiết
      "6": 8    // Thứ 7: 8 tiết
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedules created successfully",
  "data": {
    "message": "Created schedules for 3 classes in grade 12",
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "totalClasses": 5,
    "createdSchedules": 3,
    "schedules": [
      {
        "id": "64f1b2a3c4d5e6f7g8h9i0j3",
        "className": "12A3",
        "totalPeriods": 39,
        "status": "active",
        "effectiveDate": "2024-09-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Lấy Danh Sách Thời Khóa Biểu
**Endpoint**: `GET /api/schedules`  
**Quyền**: Tất cả user đã đăng nhập  

**Query Parameters:**
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số lượng item per page (default: 10, max: 100)
- `academicYear` (optional): Năm học (format: YYYY-YYYY)
- `gradeLevel` (optional): Khối lớp (1-12)
- `status` (optional): Trạng thái (draft, active, archived)

**Example**: `GET /api/schedules?academicYear=2024-2025&gradeLevel=12&status=active&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "id": "64f1b2a3c4d5e6f7g8h9i0j1",
        "academicYear": "2024-2025",
        "gradeLevel": 12,
        "className": "12A1",
        "status": "active",
        "totalPeriods": 39,
        "effectiveDate": "2024-09-01T00:00:00.000Z",
        "createdAt": "2024-08-15T10:30:00.000Z",
        "createdBy": "Nguyễn Văn Manager"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

---

### 4. Lấy Chi Tiết Thời Khóa Biểu
**Endpoint**: `GET /api/schedules/:id`  
**Quyền**: Tất cả user đã đăng nhập  

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f1b2a3c4d5e6f7g8h9i0j1",
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "class": {
      "_id": "64f1b2a3c4d5e6f7g8h9i0j2",
      "className": "12A1",
      "homeroomTeacher": {
        "_id": "64f1b2a3c4d5e6f7g8h9i0j3",
        "name": "Nguyễn Văn A",
        "email": "teacher.a@school.edu.vn"
      }
    },
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "dayName": "Thứ 2",
        "periods": [
          {
            "periodNumber": 1,
            "session": "morning",
            "subject": {
              "_id": "64f1b2a3c4d5e6f7g8h9i0j4",
              "subjectName": "Toán học",
              "subjectCode": "MATH"
            },
            "teacher": {
              "_id": "64f1b2a3c4d5e6f7g8h9i0j3",
              "name": "Nguyễn Văn A",
              "email": "teacher.a@school.edu.vn"
            },
            "room": null,
            "isBreak": false,
            "notes": ""
          },
          {
            "periodNumber": 4,
            "session": "morning",
            "isBreak": true,
            "notes": "Giờ ra chơi"
          }
        ]
      }
    ],
    "status": "active",
    "effectiveDate": "2024-09-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z",
    "totalPeriods": 39,
    "createdBy": {
      "name": "Nguyễn Văn Manager",
      "email": "manager@school.edu.vn"
    },
    "createdAt": "2024-08-15T10:30:00.000Z",
    "updatedAt": "2024-08-15T10:30:00.000Z"
  }
}
```

---

### 5. Cập Nhật Thời Khóa Biểu
**Endpoint**: `PUT /api/schedules/:id`  
**Quyền**: Manager, Admin, Teacher  

**Request Body:** (Tất cả fields đều optional)
```json
{
  "weeklySchedule": [
    {
      "dayOfWeek": 1,
      "dayName": "Thứ 2",
      "periods": [
        {
          "periodNumber": 1,
          "session": "morning",
          "subject": "64f1b2a3c4d5e6f7g8h9i0j4",
          "teacher": "64f1b2a3c4d5e6f7g8h9i0j3",
          "room": "A101",
          "isBreak": false,
          "notes": "Ôn tập kiểm tra"
        }
      ]
    }
  ],
  "status": "active",
  "effectiveDate": "2024-09-01T00:00:00.000Z",
  "endDate": "2025-06-30T00:00:00.000Z"
}
```

**Response:** (Giống GET chi tiết)

---

### 6. Xóa Thời Khóa Biểu
**Endpoint**: `DELETE /api/schedules/:id`  
**Quyền**: Manager, Admin  

**Response:**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

### 7. Thống kê Thời Khóa Biểu
**Endpoint**: `GET /api/schedules/stats?academicYear=2024-2025`  
**Quyền**: Manager, Admin, Teacher  

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
    "gradeStats": [
      {
        "gradeLevel": 10,
        "totalClasses": 8,
        "activeSchedules": 7,
        "draftSchedules": 1
      },
      {
        "gradeLevel": 11,
        "totalClasses": 7,
        "activeSchedules": 7,
        "draftSchedules": 0
      },
      {
        "gradeLevel": 12,
        "totalClasses": 6,
        "activeSchedules": 5,
        "draftSchedules": 1
      }
    ]
  }
}
```

---

### 8. Lấy Danh Sách Lớp Theo Khối
**Endpoint**: `GET /api/schedules/classes?academicYear=2024-2025&gradeLevel=12`  
**Quyền**: Manager, Admin, Teacher  

**Response:**
```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "totalClasses": 5,
    "classes": [
      {
        "id": "64f1b2a3c4d5e6f7g8h9i0j1",
        "className": "12A1",
        "homeroomTeacher": {
          "id": "64f1b2a3c4d5e6f7g8h9i0j2",
          "name": "Nguyễn Văn A",
          "email": "teacher.a@school.edu.vn"
        }
      }
    ]
  }
}
```

---

## Lưu Ý Quan Trọng

### 1. Logic Phân Bổ Môn Học
- Hệ thống tự động phân bổ môn học dựa trên `gradeLevels` trong Subject model
- Môn học có `weeklyHours` cao hơn sẽ được ưu tiên phân bổ trước
- Giáo viên chủ nhiệm sẽ được gán mặc định cho các tiết học

### 2. Quy Tắc Tạo Thời Khóa Biểu
- Chỉ tạo được 1 thời khóa biểu **active** cho mỗi lớp trong 1 năm học
- Tên lớp phải bắt đầu bằng số khối (VD: 12A1, 12B2 cho khối 12)
- Ngày hiệu lực không được là quá khứ

### 3. Cấu Trúc Dữ Liệu
```javascript
// Mối quan hệ database
Schedule -> Class (1:1, mỗi lớp 1 thời khóa biểu active)
Schedule -> Subject (N:M, qua periods)
Schedule -> User/Teacher (N:M, qua periods)
```

### 4. Error Handling
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "academicYear",
      "message": "Academic year must be in format YYYY-YYYY"
    }
  ]
}
```

### 5. Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized (No token)
- `403`: Forbidden (Insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Ví Dụ Sử Dụng Complete Flow

### 1. Preview trước khi tạo
```bash
curl -X POST http://localhost:3000/api/schedules/preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12
  }'
```

### 2. Tạo thời khóa biểu
```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }'
```

### 3. Xem thời khóa biểu đã tạo
```bash
curl -X GET "http://localhost:3000/api/schedules?academicYear=2024-2025&gradeLevel=12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Xem chi tiết thời khóa biểu
```bash
curl -X GET http://localhost:3000/api/schedules/SCHEDULE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
``` 