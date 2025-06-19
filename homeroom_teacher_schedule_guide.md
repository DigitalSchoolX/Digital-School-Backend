# Hướng Dẫn API Xem Thời Khóa Biểu Cho Giáo Viên Chủ Nhiệm

## Tổng quan
Giáo viên chủ nhiệm có thể sử dụng cùng API với học sinh để xem thời khóa biểu của lớp mình chủ nhiệm. Hệ thống sẽ tự động xác định lớp mà giáo viên đang chủ nhiệm và trả về thời khóa biểu tương ứng.

## Quyền truy cập
- ✅ **Giáo viên chủ nhiệm**: Chỉ xem được thời khóa biểu của lớp mình chủ nhiệm
- ✅ **Học sinh**: Xem thời khóa biểu của lớp mình
- ✅ **Admin/Manager**: Có thể xem (sẽ implement sau)

## Logic xác định lớp

### Đối với Giáo viên (role=teacher):
1. Hệ thống tìm lớp có `homeroomTeacher = teacher_id` trong năm học được chỉ định
2. Nếu không tìm thấy → Error: "Teacher is not a homeroom teacher"
3. Nếu tìm thấy → Trả về thời khóa biểu của lớp đó

### Đối với Học sinh (role=student):
1. Lấy `class_id` từ profile của học sinh
2. Nếu không có → Error: "Student is not assigned to any class"
3. Nếu có → Trả về thời khóa biểu của lớp đó

## API Endpoints (giống với học sinh)

### 1. Xem Thời Khóa Biểu Tuần
**GET** `/api/schedules/student`

### 2. Xem Thời Khóa Biểu Theo Ngày
**GET** `/api/schedules/student/day/:dayOfWeek`

## Response Structure

Response sẽ có cấu trúc tương tự như học sinh, nhưng với thông tin `currentUser` thay vì `student`:

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
      "id": "teacher_id",
      "name": "Nguyễn Văn A",
      "email": "teacher@school.com",
      "role": ["teacher"],
      "studentId": null,
      "isHomeroomTeacher": true
    },
    "weeklySchedule": [...],
    "scheduleInfo": {...}
  }
}
```

## Ví dụ Curl Commands

### Giáo viên xem thời khóa biểu tuần của lớp mình
```bash
curl -X GET \
  "http://localhost:3000/api/schedules/student" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json"
```

### Giáo viên xem thời khóa biểu Thứ Hai của lớp mình
```bash
curl -X GET \
  "http://localhost:3000/api/schedules/student/day/1" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json"
```

### Giáo viên xem thời khóa biểu năm học cụ thể
```bash
curl -X GET \
  "http://localhost:3000/api/schedules/student?academicYear=2024-2025" \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json"
```

## Error Cases

### 1. Giáo viên không phải chủ nhiệm
```json
{
  "success": false,
  "message": "Teacher is not a homeroom teacher of any class in this academic year. Only homeroom teachers can view class schedule."
}
```

### 2. Không tìm thấy thời khóa biểu
```json
{
  "success": false,
  "message": "No schedule found for your class in academic year 2024-2025. Please contact your teacher."
}
```

### 3. Token không hợp lệ
```json
{
  "success": false,
  "message": "No token provided"
}
```

## Use Cases cho Giáo Viên Chủ Nhiệm

### 1. Kiểm tra lịch dạy của lớp
- Xem môn học nào, tiết nào
- Kiểm tra giáo viên dạy từng môn
- Xác nhận phòng học

### 2. Hỗ trợ học sinh
- Trả lời câu hỏi về thời khóa biểu
- Thông báo thay đổi lịch học
- Điều phối với giáo viên bộ môn

### 3. Quản lý lớp học
- Lên kế hoạch hoạt động lớp
- Sắp xếp thời gian họp phụ huynh
- Theo dõi tình hình học tập

## So sánh với Học sinh

| Tiêu chí | Học sinh | Giáo viên chủ nhiệm |
|----------|----------|---------------------|
| **Xác định lớp** | Từ `class_id` trong profile | Từ `homeroomTeacher` trong Class |
| **Số lớp** | 1 lớp (lớp học của mình) | 1 lớp (lớp chủ nhiệm) |
| **Quyền truy cập** | Chỉ lớp của mình | Chỉ lớp chủ nhiệm |
| **Response** | `student` object | `currentUser` object |
| **isHomeroomTeacher** | false | true |

## Lưu ý quan trọng

1. **Một giáo viên chỉ có thể chủ nhiệm một lớp** trong một năm học
2. **API endpoint giống nhau** - hệ thống tự động phân biệt dựa trên role
3. **Giáo viên không chủ nhiệm** sẽ không thể truy cập API này
4. **Năm học** phải khớp với năm học mà giáo viên đang chủ nhiệm

## Testing

### Test với token giáo viên chủ nhiệm
```bash
# Lấy token giáo viên chủ nhiệm
export TEACHER_TOKEN="jwt_token_of_homeroom_teacher"

# Test xem thời khóa biểu
curl -X GET \
  "http://localhost:3000/api/schedules/student" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}"
```

### Test với token giáo viên không chủ nhiệm
```bash
# Lấy token giáo viên bộ môn (không chủ nhiệm)
export NON_HOMEROOM_TEACHER_TOKEN="jwt_token_of_subject_teacher"

# Test sẽ trả về error
curl -X GET \
  "http://localhost:3000/api/schedules/student" \
  -H "Authorization: Bearer ${NON_HOMEROOM_TEACHER_TOKEN}"
```

## Tương lai

Có thể mở rộng để:
- Giáo viên xem thời khóa biểu của nhiều lớp (nếu dạy nhiều lớp)
- Admin/Manager chỉ định class_id cụ thể
- Thống kê thời khóa biểu theo giáo viên 