# Schedule Week API Update Guide

## Tổng quan thay đổi

API `/api/schedules/week` đã được cập nhật để hoạt động tương tự như API `/api/schedules/student` - tự động xác định lớp học của người dùng thay vì yêu cầu tham số class_id.

## Thay đổi chính

### 1. Logic xác định lớp học tự động

**Trước đây:** API yêu cầu truyền class_id
**Bây giờ:** API tự động xác định lớp dựa trên role của user:

- **Học sinh:** Lấy class_id từ profile user
- **Giáo viên chủ nhiệm:** Tìm lớp mà giáo viên đang làm chủ nhiệm trong năm học
- **Admin/Manager:** Chưa implement (sẽ bổ sung sau)

### 2. Kiểm tra quyền truy cập

```javascript
// Chỉ cho phép các role sau xem thời khóa biểu:
- student: Xem thời khóa biểu lớp mình
- teacher: Xem thời khóa biểu lớp mình làm chủ nhiệm  
- admin/manager: Có thể xem (chưa implement)
```

### 3. Thông báo lỗi chi tiết

- Học sinh chưa được phân lớp
- Giáo viên không phải chủ nhiệm của lớp nào
- Không tìm thấy thời khóa biểu cho lớp
- Tuần học không hợp lệ

## API Endpoint

```
GET /api/schedules/week?academicYear=2024-2025&weekStartDate=2024-06-16&weekEndDate=2024-06-21
Authorization: Bearer <token>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| academicYear | string | Yes | Năm học (format: YYYY-YYYY) |
| weekStartDate | string | Yes | Ngày bắt đầu tuần (YYYY-MM-DD) |
| weekEndDate | string | Yes | Ngày kết thúc tuần (YYYY-MM-DD) |

### Response Format

```json
{
  "success": true,
  "data": {
    "academicYear": "2024-2025",
    "weekInfo": {
      "weekNumber": 1,
      "weekLabel": "16/06 to 21/06",
      "startDate": "2024-06-16",
      "endDate": "2024-06-21",
      "days": [...]
    },
    "class": {
      "id": "class_id",
      "className": "10A1",
      "homeroomTeacher": {
        "id": "teacher_id",
        "name": "Nguyễn Văn A",
        "email": "teacher@school.com"
      }
    },
    "currentUser": {
      "id": "user_id",
      "name": "Học sinh/Giáo viên",
      "email": "user@school.com",
      "role": ["student"] | ["teacher"],
      "studentId": "HS001",
      "isHomeroomTeacher": false | true
    },
    "timeSlots": [
      {
        "slot": 1,
        "timeRange": "7:30-9:00",
        "session": "morning",
        "duration": 90
      },
      ...
    ],
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "dayName": "Thứ 2",
        "totalPeriods": 7,
        "periods": [
          {
            "periodNumber": 1,
            "session": "morning",
            "subject": {
              "id": "subject_id",
              "name": "Toán học",
              "code": "MATH",
              "description": "Môn Toán"
            },
            "teacher": {
              "id": "teacher_id",
              "name": "Cô Lan",
              "email": "teacher@school.com"
            },
            "room": "A101",
            "isBreak": false,
            "notes": null
          },
          ...
        ]
      },
      ...
    ],
    "scheduleInfo": {
      "status": "active",
      "effectiveDate": "2024-09-01",
      "endDate": "2025-06-30",
      "totalPeriodsPerWeek": 39,
      "createdAt": "2024-08-15",
      "updatedAt": "2024-08-15"
    }
  }
}
```

## Test Cases

### 1. Học sinh xem thời khóa biểu

```bash
curl --location 'http://localhost:3000/api/schedules/week?academicYear=2024-2025&weekStartDate=2024-06-16&weekEndDate=2024-06-21' \
--header 'Authorization: Bearer <student_token>'
```

**Kết quả mong đợi:** Trả về thời khóa biểu của lớp học sinh đó

### 2. Giáo viên chủ nhiệm xem thời khóa biểu

```bash
curl --location 'http://localhost:3000/api/schedules/week?academicYear=2024-2025&weekStartDate=2024-06-16&weekEndDate=2024-06-21' \
--header 'Authorization: Bearer <homeroom_teacher_token>'
```

**Kết quả mong đợi:** Trả về thời khóa biểu của lớp giáo viên làm chủ nhiệm

### 3. Giáo viên không phải chủ nhiệm

```bash
curl --location 'http://localhost:3000/api/schedules/week?academicYear=2024-2025&weekStartDate=2024-06-16&weekEndDate=2024-06-21' \
--header 'Authorization: Bearer <regular_teacher_token>'
```

**Kết quả mong đợi:** Lỗi 400 - "Teacher is not a homeroom teacher"

### 4. Học sinh chưa được phân lớp

**Kết quả mong đợi:** Lỗi 400 - "Student is not assigned to any class"

### 5. Tuần không hợp lệ

```bash
curl --location 'http://localhost:3000/api/schedules/week?academicYear=2024-2025&weekStartDate=2024-13-01&weekEndDate=2024-13-07' \
--header 'Authorization: Bearer <token>'
```

**Kết quả mong đợi:** Lỗi 400 - "Invalid week range"

## Lợi ích của thay đổi

1. **Đơn giản hóa:** Không cần truyền class_id
2. **Bảo mật:** Chỉ xem được thời khóa biểu của lớp mình
3. **Tự động:** Hệ thống tự xác định lớp dựa trên user
4. **Nhất quán:** Logic giống với API `/api/schedules/student`

## Tương thích ngược

API này **không tương thích ngược** với version cũ vì đã thay đổi logic xác định lớp học. Các ứng dụng client cần cập nhật để sử dụng API mới.

## Ghi chú

- Admin/Manager access sẽ được implement trong phiên bản tiếp theo
- API hỗ trợ hệ thống linh hoạt 6-7 tiết/ngày
- Tổng cộng 39 tiết/tuần (thay vì 54 tiết cũ) 