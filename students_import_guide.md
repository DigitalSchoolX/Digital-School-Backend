# 🎓 Students Import System - EcoSchool

## 📋 Tổng quan
Hệ thống import học sinh với logic:
1. **Upload file xlsx** → **Gửi email với mật khẩu tạm thời** → **Lưu user với `isNewUser: true`**
2. **Student đăng nhập lần đầu** → **Redirect tới trang thiết lập mật khẩu mới**
3. **Hoàn tất thiết lập** → **`isNewUser: false`** → **Truy cập bình thường**

## 📁 Files đã tạo

### 1. **Data & Scripts:**
- `students_import.xlsx` - File Excel chứa 16 học sinh cho 4 lớp
- `create_students_xlsx.js` - Script tạo file Excel mẫu
- `create_students_base64_curl.js` - Script tạo curl commands
- `students_import_payload.json` - Base64 payload cho API

### 2. **Backend Code:**
- `src/modules/user/services/user.service.js` - Thêm methods import students
- `src/modules/user/controllers/user.controller.js` - Thêm controllers import students  
- `src/modules/user/routes/user.routes.js` - Thêm routes import students

## 📊 Dữ liệu Students

### **16 học sinh cho 4 lớp:**
- **12A1**: 4 students (HS001-HS004)
- **12A2**: 4 students (HS005-HS008) 
- **12A3**: 4 students (HS009-HS012)
- **12A4**: 4 students (HS013-HS016)

### **Thông tin mỗi student:**
```
- name: Tên đầy đủ (VD: Nguyễn Văn An)
- email: .stu@yopmail.com (VD: nguyenvanan.stu@yopmail.com)
- dateOfBirth: 2006 (học sinh lớp 12)
- gender: male/female
- studentId: HS001, HS002... (unique)
- className: 12A1, 12A2, 12A3, 12A4
- schoolYear: 2024-2025
```

## 🔧 API Endpoints

### **Import Students:**
```
POST /api/users/import-students        - Upload file xlsx
POST /api/users/import-students-base64 - Import từ base64
```

### **Quyền truy cập:** Chỉ **manager** mới được import

## 📧 Email System

### **Tự động gửi email chào mừng:**
- **Subject:** "Chào mừng học sinh mới - EcoSchool"
- **Nội dung:** Thông tin đăng nhập, mật khẩu tạm thời, hướng dẫn
- **Format:** HTML đẹp với styling

### **Logic email:**
1. Tạo mật khẩu tạm thời (12 ký tự phức tạp)
2. Gửi email với mật khẩu tạm thời
3. Nếu gửi email thất bại → Log mật khẩu để admin thông báo thủ công

## 🚀 CURL Commands

### **Token Manager:**
```bash
MANAGER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NmJlMGEzNjA0NzFhMjJmMjk0MjI2MSIsImVtYWlsIjoibWFuYWdlcjFAZWNvc2Nob29sLmNvbSIsInJvbGUiOlsibWFuYWdlciJdLCJpYXQiOjE3MzUxMDA1ODQsImV4cCI6MTczNTEwNDE4NH0.YOKnVjQrfWn8yNPPJjP3JKqzuQUHCdvGNPUFnOGBwTg"
```

### **1. Import từ File Upload:**
```bash
curl -X POST "http://localhost:3000/api/users/import-students" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -F "file=@students_import.xlsx"
```

### **2. Import từ Base64:**
```bash
curl -X POST "http://localhost:3000/api/users/import-students-base64" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d @students_import_payload.json
```

## ⚠️ Yêu cầu trước khi Import

### **Bắt buộc tạo các lớp học trước:**
Trước khi import students, cần tạo 4 lớp học bằng Class API:

```bash
# Tạo lớp 12A1
curl -X POST "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "className": "12A1",
    "academicYear": "2024-2025", 
    "homeroomTeacherId": "TEACHER_ID_HERE"
  }'

# Tương tự cho 12A2, 12A3, 12A4
```

### **Lấy danh sách giáo viên có thể làm chủ nhiệm:**
```bash
curl -X GET "http://localhost:3000/api/classes/available-teachers?academicYear=2024-2025" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

## 🔄 Quy trình thực hiện

### **Bước 1: Chuẩn bị dữ liệu**
```bash
node create_students_xlsx.js                # Tạo file Excel
node create_students_base64_curl.js         # Tạo curl commands
```

### **Bước 2: Tạo lớp học**
```bash
# Lấy danh sách giáo viên
curl -X GET "http://localhost:3000/api/classes/available-teachers?academicYear=2024-2025" \
  -H "Authorization: Bearer $MANAGER_TOKEN"

# Tạo 4 lớp học (thay TEACHER_ID bằng ID thực tế)
curl -X POST "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"className": "12A1", "academicYear": "2024-2025", "homeroomTeacherId": "TEACHER_ID"}'
```

### **Bước 3: Import Students**
```bash
# Chọn 1 trong 2 cách:
# Cách 1: Upload file
curl -X POST "http://localhost:3000/api/users/import-students" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -F "file=@students_import.xlsx"

# Cách 2: Base64
curl -X POST "http://localhost:3000/api/users/import-students-base64" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d @students_import_payload.json
```

### **Bước 4: Kiểm tra kết quả**
```bash
# Lấy danh sách students
curl -X GET "http://localhost:3000/api/users?role=student" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

## 📨 Kiểm tra Email

### **Truy cập Yopmail:**
1. Đi tới https://yopmail.com
2. Nhập email: `nguyenvanan.stu@yopmail.com`
3. Kiểm tra email chào mừng với mật khẩu tạm thời

### **Test đăng nhập:**
1. Sử dụng email và mật khẩu tạm thời từ email
2. Hệ thống sẽ redirect tới trang thiết lập mật khẩu mới
3. Nhập mật khẩu mới → Hoàn tất thiết lập

## ✅ Tính năng chính

### **🔐 Bảo mật:**
- Chỉ manager mới có quyền import
- JWT token authentication
- Mật khẩu tạm thời phức tạp (12 ký tự)
- Hash password với bcrypt

### **📧 Email tự động:**
- Gửi email chào mừng với mật khẩu tạm thời
- HTML template đẹp với styling
- Fallback log nếu email thất bại

### **🔄 Workflow:**
- Import → Gửi email → Save user với `isNewUser: true`
- Login lần đầu → Redirect tới set-password
- Set password → `isNewUser: false` → Access bình thường

### **✅ Validation:**
- Kiểm tra email trùng lặp
- Kiểm tra studentId trùng lặp  
- Kiểm tra lớp học tồn tại
- Validate dữ liệu đầu vào

### **📊 Response format:**
```json
{
  "success": true,
  "message": "Student import completed",
  "data": {
    "success": [
      {
        "row": 2,
        "email": "nguyenvanan.stu@yopmail.com",
        "name": "Nguyễn Văn An",
        "studentId": "HS001",
        "className": "12A1",
        "status": "awaiting_first_login",
        "tempPassword": "Abc123!@#xyz"
      }
    ],
    "failed": [],
    "total": 16
  }
}
```

## 🎯 Kết quả mong đợi

### **Sau khi import thành công:**
- ✅ 16 students được tạo trong database
- ✅ Mỗi student có `isNewUser: true`
- ✅ Mỗi student được assign vào đúng lớp
- ✅ 16 emails được gửi với mật khẩu tạm thời
- ✅ Students có thể đăng nhập và thiết lập mật khẩu mới

### **Workflow hoàn chỉnh:**
1. **Manager import** → Students được tạo với mật khẩu tạm thời
2. **Email được gửi** → Students nhận thông tin đăng nhập
3. **Students login** → Redirect tới set-password page
4. **Set password** → Account được kích hoạt hoàn toàn
5. **Login tiếp theo** → Truy cập bình thường vào hệ thống

🎉 **Hệ thống import students hoàn chỉnh với email automation!** 