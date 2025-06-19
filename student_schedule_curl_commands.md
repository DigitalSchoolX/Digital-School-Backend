# Student & Homeroom Teacher Schedule API - Curl Commands for Testing

## Prerequisites
1. Đảm bảo server đang chạy (thường port 3000)
2. Có JWT token của một học sinh (role=student) hoặc giáo viên chủ nhiệm (role=teacher)
3. Học sinh đã được assign vào một lớp (có class_id) HOẶC giáo viên là chủ nhiệm của một lớp
4. Lớp đó đã có thời khóa biểu active cho năm học 2024-2025

## Environment Variables (thay thế trong các lệnh)
```bash
# Server URL
export SERVER_URL="http://localhost:3000"

# JWT Token của học sinh
export STUDENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT Token của giáo viên chủ nhiệm
export TEACHER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Content type
export CONTENT_TYPE="application/json"
```

---

## 1. Xem Thời Khóa Biểu Tuần (Tất cả các ngày)

### Học sinh xem thời khóa biểu năm học hiện tại (2024-2025)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Giáo viên chủ nhiệm xem thời khóa biểu của lớp mình
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Lấy thời khóa biểu năm học cụ thể
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student?academicYear=2024-2025" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Lấy thời khóa biểu năm học khác (ví dụ 2023-2024)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student?academicYear=2023-2024" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

---

## 2. Xem Thời Khóa Biểu Theo Ngày

### Học sinh xem Thứ Hai (dayOfWeek = 1)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/1" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Giáo viên chủ nhiệm xem Thứ Hai
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/1" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Thứ Ba (dayOfWeek = 2)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/2" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Thứ Tư (dayOfWeek = 3)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/3" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Thứ Năm (dayOfWeek = 4)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/4" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Thứ Sáu (dayOfWeek = 5)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/5" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Thứ Bảy (dayOfWeek = 6)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/6" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Với năm học cụ thể
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/1?academicYear=2024-2025" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

---

## 3. Test Cases - Error Scenarios

### Test không có token
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Test token không hợp lệ
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer invalid_token_here" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Test dayOfWeek không hợp lệ (< 1)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/0" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Test dayOfWeek không hợp lệ (> 6)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student/day/7" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Test năm học không đúng format
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student?academicYear=2024" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Test năm học không liên tiếp
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student?academicYear=2024-2026" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

---

## 4. Testing với Multiple Tokens

### Admin/Manager xem thời khóa biểu (được phép)
```bash
export ADMIN_TOKEN="admin_jwt_token_here"

curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Giáo viên chủ nhiệm xem thời khóa biểu (được phép)
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

### Giáo viên không chủ nhiệm xem thời khóa biểu (không được phép)  
```bash
export NON_HOMEROOM_TEACHER_TOKEN="non_homeroom_teacher_jwt_token_here"

curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${NON_HOMEROOM_TEACHER_TOKEN}" \
  -H "Content-Type: ${CONTENT_TYPE}"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Teacher is not a homeroom teacher of any class in this academic year. Only homeroom teachers can view class schedule."
}
```

---

## 5. Performance Testing

### Test lấy data nhiều lần liên tiếp (học sinh)
```bash
for i in {1..5}; do
  echo "Request $i (Student):"
  curl -X GET \
    "${SERVER_URL}/api/schedules/student" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: ${CONTENT_TYPE}" \
    -w "Time: %{time_total}s\n"
  echo "---"
done
```

### Test lấy data nhiều lần liên tiếp (giáo viên)
```bash
for i in {1..5}; do
  echo "Request $i (Teacher):"
  curl -X GET \
    "${SERVER_URL}/api/schedules/student" \
    -H "Authorization: Bearer ${TEACHER_TOKEN}" \
    -H "Content-Type: ${CONTENT_TYPE}" \
    -w "Time: %{time_total}s\n"
  echo "---"
done
```

### Test các ngày khác nhau
```bash
for day in {1..6}; do
  echo "Testing day $day:"
  curl -X GET \
    "${SERVER_URL}/api/schedules/student/day/$day" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: ${CONTENT_TYPE}" \
    -w "Time: %{time_total}s\n"
  echo "---"
done
```

---

## 6. Sample Script for Automation

### Tạo file test_student_teacher_schedule.sh
```bash
#!/bin/bash

# Configuration
SERVER_URL="http://localhost:3000"
STUDENT_TOKEN="your_student_token_here"
TEACHER_TOKEN="your_teacher_token_here"

echo "=== Testing Student & Teacher Schedule API ==="

# Test 1: Student weekly schedule
echo "1. Testing student weekly schedule..."
response=$(curl -s -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}")
echo $response | jq .

# Test 2: Teacher weekly schedule
echo "2. Testing teacher weekly schedule..."
response=$(curl -s -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}")
echo $response | jq .

# Test 3: Daily schedules for both
for day in {1..6}; do
  echo "3.$day Testing day $day schedule (Student)..."
  response=$(curl -s -X GET \
    "${SERVER_URL}/api/schedules/student/day/$day" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}")
  echo $response | jq .
  
  echo "3.$day Testing day $day schedule (Teacher)..."
  response=$(curl -s -X GET \
    "${SERVER_URL}/api/schedules/student/day/$day" \
    -H "Authorization: Bearer ${TEACHER_TOKEN}")
  echo $response | jq .
done

echo "=== Test completed ==="
```

### Chạy script
```bash
chmod +x test_student_teacher_schedule.sh
./test_student_teacher_schedule.sh
```

---

## 7. Expected Response Structure

### Success Response (Weekly Schedule)
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
        "email": "teacher@example.com"
      }
    },
    "currentUser": {
      "id": "user_id", 
      "name": "Trần Thị B",
      "email": "user@example.com",
      "role": ["student"],
      "studentId": "2024001",
      "isHomeroomTeacher": false
    },
    "weeklySchedule": [
      {
        "dayOfWeek": 1,
        "dayName": "Thứ Hai",
        "totalPeriods": 7,
        "periods": [...]
      }
    ],
    "scheduleInfo": {
      "status": "active",
      "effectiveDate": "2024-09-01T00:00:00.000Z",
      "totalPeriodsPerWeek": 39
    }
  }
}
```

### Response cho Giáo viên chủ nhiệm
```json
{
  "success": true,
  "data": {
    "currentUser": {
      "id": "teacher_id",
      "name": "Nguyễn Văn A",
      "email": "teacher@example.com",
      "role": ["teacher"],
      "studentId": null,
      "isHomeroomTeacher": true
    }
  }
}
```

---

## 8. Debugging Tips

### Kiểm tra JWT token có hợp lệ không
```bash
# Decode JWT token (cần jq và base64)
echo $STUDENT_TOKEN | cut -d'.' -f2 | base64 -d | jq .
echo $TEACHER_TOKEN | cut -d'.' -f2 | base64 -d | jq .
```

### Kiểm tra server có chạy không
```bash
curl -X GET "${SERVER_URL}/api/auth/health" 2>/dev/null || echo "Server not running"
```

### Test với verbose output
```bash
curl -v -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}"
```

### Lưu response vào file để debug
```bash
curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  -o student_schedule_response.json

curl -X GET \
  "${SERVER_URL}/api/schedules/student" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -o teacher_schedule_response.json

cat student_schedule_response.json | jq .
cat teacher_schedule_response.json | jq .
```

---

## 9. Specific Error Messages

### Học sinh chưa có lớp
```json
{
  "success": false,
  "message": "Student is not assigned to any class. Please contact administrator."
}
```

### Giáo viên không phải chủ nhiệm
```json
{
  "success": false,
  "message": "Teacher is not a homeroom teacher of any class in this academic year. Only homeroom teachers can view class schedule."
}
```

### Không tìm thấy thời khóa biểu
```json
{
  "success": false,
  "message": "No schedule found for your class in academic year 2024-2025. Please contact your teacher."
}
``` 