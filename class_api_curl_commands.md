# Class API - CURL Commands

## Token Manager
```
MANAGER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NmJlMGEzNjA0NzFhMjJmMjk0MjI2MSIsImVtYWlsIjoibWFuYWdlcjFAZWNvc2Nob29sLmNvbSIsInJvbGUiOlsibWFuYWdlciJdLCJpYXQiOjE3MzUxMDA1ODQsImV4cCI6MTczNTEwNDE4NH0.YOKnVjQrfWn8yNPPJjP3JKqzuQUHCdvGNPUFnOGBwTg"
```

## 1. Lấy danh sách giáo viên có thể làm chủ nhiệm
```bash
curl -X GET "http://localhost:3000/api/classes/available-teachers?academicYear=2024-2025" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json"
```

## 2. Tạo lớp học mới
```bash
curl -X POST "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "className": "10A1",
    "academicYear": "2024-2025",
    "homeroomTeacherId": "TEACHER_ID_HERE"
  }'
```

## 3. Lấy danh sách lớp học
```bash
curl -X GET "http://localhost:3000/api/classes?page=1&limit=10&academicYear=2024-2025" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json"
```

## 4. Lấy chi tiết lớp học
```bash
curl -X GET "http://localhost:3000/api/classes/CLASS_ID_HERE" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json"
```

## 5. Cập nhật lớp học
```bash
curl -X PUT "http://localhost:3000/api/classes/CLASS_ID_HERE" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "className": "10A1_Updated",
    "academicYear": "2024-2025"
  }'
```

## 6. Xóa lớp học (soft delete)
```bash
curl -X DELETE "http://localhost:3000/api/classes/CLASS_ID_HERE" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json"
```

## 7. Tìm kiếm lớp học
```bash
curl -X GET "http://localhost:3000/api/classes?search=10A&academicYear=2024-2025" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json"
```

## 8. Lọc lớp học theo trạng thái
```bash
curl -X GET "http://localhost:3000/api/classes?active=true&academicYear=2024-2025" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Lưu ý quan trọng:

1. **Thay thế ID**: 
   - `TEACHER_ID_HERE` → ID giáo viên thực tế từ API available-teachers
   - `CLASS_ID_HERE` → ID lớp học thực tế từ API tạo lớp

2. **Quyền truy cập**: Chỉ manager và admin mới có quyền tạo/sửa/xóa lớp học

3. **Token**: Token có thể hết hạn, cần tạo token mới nếu cần

## Các bước thực hiện:

1. **Khởi động server**: `npm start`
2. **Lấy danh sách giáo viên**: Chạy curl command #1
3. **Copy ID giáo viên**: Thay vào `TEACHER_ID_HERE` trong command #2
4. **Tạo lớp học**: Chạy curl command #2
5. **Copy ID lớp học**: Thay vào `CLASS_ID_HERE` trong các command khác
6. **Test các API**: Chạy các command còn lại

## Payload mẫu:

### Tạo lớp học:
```json
{
  "className": "10A1",
  "academicYear": "2024-2025",
  "homeroomTeacherId": "676be0a3604712345678901a"
}
```

### Cập nhật lớp học:
```json
{
  "className": "10A1_Updated",
  "academicYear": "2024-2025",
  "homeroomTeacherId": "676be0a3604712345678901b",
  "active": true
}
```

## Tính năng chính của API:

✅ **Tạo lớp học**: Tên lớp, năm học, giáo viên chủ nhiệm  
✅ **Tự động cập nhật role**: Thêm role `homeroom_teacher` cho giáo viên  
✅ **Validation**: Kiểm tra trùng lặp, giáo viên đã làm chủ nhiệm  
✅ **Phân trang**: Hỗ trợ pagination cho danh sách lớp  
✅ **Tìm kiếm**: Tìm theo tên lớp, lọc theo năm học, trạng thái  
✅ **Soft delete**: Xóa mềm, không xóa vĩnh viễn  
✅ **Quản lý role**: Tự động thêm/xóa role homeroom_teacher 