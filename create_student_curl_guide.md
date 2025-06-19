# API Tạo Student - Hướng dẫn sử dụng

## Tổng quan
API này cho phép manager tạo student mới trong hệ thống EcoSchool với thông tin đầy đủ.

## Endpoint
```
POST /api/users/create-student
```

## Authentication
Yêu cầu JWT token với role `manager`

## Request Body
```json
{
  "name": "Nguyễn Văn An",           // Bắt buộc: Tên học sinh (2-100 ký tự)
  "email": "student@ecoschool.com",  // Bắt buộc: Email hợp lệ, duy nhất
  "studentId": "ST2024001",          // Bắt buộc: Mã học sinh (4-20 ký tự, chỉ chữ hoa và số)
  "className": "10A1",               // Bắt buộc: Tên lớp (phải tồn tại)
  "academicYear": "2024-2025",       // Tùy chọn: Năm học (mặc định 2024-2025)
  "dateOfBirth": "2010-05-15",       // Tùy chọn: Ngày sinh (ISO 8601)
  "gender": "male"                   // Tùy chọn: male/female/other
}
```

## Response thành công (201)
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "id": "676xxx...",
    "name": "Nguyễn Văn An",
    "email": "student@ecoschool.com",
    "studentId": "ST2024001",
    "class": {
      "id": "676yyy...",
      "className": "10A1",
      "academicYear": "2024-2025"
    },
    "dateOfBirth": "2010-05-15T00:00:00.000Z",
    "gender": "male",
    "role": ["student"],
    "isNewUser": true,
    "active": true,
    "tempPassword": "TempPass123!",
    "status": "awaiting_first_login",
    "createdAt": "2024-12-25T...",
    "updatedAt": "2024-12-25T..."
  }
}
```

## Quy trình đăng nhập đã được cải thiện

### 🔄 Logic Đăng Nhập Mới:
1. **Student/Teacher login** với email và mật khẩu (có thể là tempPassword)
2. **Hệ thống kiểm tra `isNewUser`:**
   - Nếu `isNewUser: true` → redirect tới trang **set-password** 
   - Nếu `isNewUser: false` → redirect tới trang **home**
3. **Không còn phân biệt** giữa OTP login và normal login

### 📍 Endpoint Set Password (Unified):
```
POST /api/users/set-password
```

**Trường hợp 1: Existing User (Student/Teacher đã tạo)**
```
Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>
Content-Type: application/json

{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Trường hợp 2: New User từ OTP**
```
Content-Type: application/json

{
  "tempToken": "temp_token_from_otp_login",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### ✅ Response Set Password:
```json
{
  "success": true,
  "message": "Password set successfully",
  "data": {
    "message": "Password set successfully",
    "user": {
      "id": "676xxx...",
      "email": "student@ecoschool.com",
      "name": "Nguyễn Văn An",
      "role": ["student"],
      "isNewUser": false,  // Đã chuyển thành false
      "...": "..."
    },
    "token": "new_jwt_token_here",     // Cho existing user
    "redirectTo": "home"               // Cho existing user
    // hoặc "redirectTo": "login"     // Cho OTP user
  }
}
```

## Lỗi thường gặp

### 400 - Validation Error
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "Only managers can create students"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "message": "Email already exists"
}
```

```json
{
  "success": false,
  "message": "Student ID already exists"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Class 10A1 not found for academic year 2024-2025"
}
```

## CURL Examples

### 1. Lấy danh sách lớp học
```bash
curl -X GET "http://localhost:3000/api/classes" \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN"
```

### 2. Tạo student mới
```bash
curl -X POST "http://localhost:3000/api/users/create-student" \
  -H "Authorization: Bearer YOUR_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn An",
    "email": "nguyenvanan@student.ecoschool.com",
    "studentId": "ST2024001",
    "className": "10A1",
    "academicYear": "2024-2025",
    "dateOfBirth": "2010-05-15",
    "gender": "male"
  }'
```

### 3. Student đăng nhập lần đầu với tempPassword
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvanan@student.ecoschool.com",
    "password": "TempPass123!"
  }'
```

**Response sẽ có `redirectTo: "set-password"`**

### 4. Student set password mới
```bash
curl -X POST "http://localhost:3000/api/users/set-password" \
  -H "Authorization: Bearer JWT_TOKEN_FROM_LOGIN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "MyNewPassword123!",
    "confirmPassword": "MyNewPassword123!"
  }'
```  

### 5. Student đăng nhập lần sau với password mới
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvanan@student.ecoschool.com", 
    "password": "MyNewPassword123!"
  }'
```

**Response sẽ có `redirectTo: "home"`**

## Validation Rules

### name
- Bắt buộc
- Từ 2 đến 100 ký tự
- Không được để trống

### email
- Bắt buộc
- Định dạng email hợp lệ
- Phải duy nhất trong hệ thống

### studentId
- Bắt buộc
- Từ 4 đến 20 ký tự
- Chỉ chứa chữ cái hoa (A-Z) và số (0-9)
- Phải duy nhất trong hệ thống

### className
- Bắt buộc
- Từ 1 đến 50 ký tự
- Lớp phải tồn tại trong hệ thống

### academicYear
- Tùy chọn (mặc định: 2024-2025)
- Định dạng: YYYY-YYYY (ví dụ: 2024-2025)

### dateOfBirth
- Tùy chọn
- Định dạng ISO 8601 (YYYY-MM-DD)
- Tuổi phải từ 5 đến 25

### gender
- Tùy chọn (mặc định: 'other')
- Giá trị hợp lệ: 'male', 'female', 'other'

### Password (cho set-password)
- Bắt buộc
- Tối thiểu 8 ký tự
- Phải chứa ít nhất: 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt

## Quy trình sau khi tạo

1. **Student được tạo** với trạng thái `isNewUser: true`
2. **Mật khẩu tạm thời** được tự động tạo và gửi qua email
3. **Student đăng nhập lần đầu** với tempPassword → redirect tới **set-password**
4. **Student set password mới** → `isNewUser` chuyển thành `false` 
5. **Các lần đăng nhập sau** → redirect tới **home**

## Notes

- ✅ **Logic đăng nhập được cải thiện**: Dựa vào `isNewUser` thay vì loại password
- ✅ **Chỉ có manager** mới có thể tạo student
- ✅ **Lớp học phải tồn tại** trước khi tạo student  
- ✅ **Email và studentId** phải duy nhất
- ✅ **Mật khẩu tạm thời** được gửi qua email
- ✅ **Tự động set `isNewUser: false`** sau khi đổi password
- ✅ **Password validation nghiêm ngặt** cho bảo mật

## Test Scripts

Để test API, bạn có thể chạy:
```bash
node create_student_api_test.js
``` 