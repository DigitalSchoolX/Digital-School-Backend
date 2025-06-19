# Fix Login Logic - Phân Biệt 1-Time Password và Regular Password

## 🎯 **Vấn Đề Đã Fix**

### **❌ Trước đây (Lỗi)**
- Đăng nhập với password đã set → vẫn redirect vào `set-password`
- Không phân biệt được giữa temporary password và regular password
- Logic redirect không đúng theo yêu cầu

### **✅ Bây giờ (Đã Fix)**
- **1-time password (OTP/temp)** → redirect vào `set-password`
- **Regular password (đã set)** → redirect vào `home`
- Logic xử lý chính xác theo flow

---

## 🔧 **Các Thay Đổi Đã Thực Hiện**

### **1. Auth Service (`auth.service.js`)**

#### **Logic Login Mới:**
```javascript
async login(email, password) {
  // 1. Tìm user với cả passwordHash và tempPassword
  const user = await User.findOne({ email }).select('+passwordHash +tempPassword');
  
  if (!user) {
    // 2. Nếu không có user, check OTP login
    return await this.handleOTPLogin(email, password);
  }

  // 3. Kiểm tra temporary password trước
  if (user.tempPassword && user.tempPassword === password) {
    return {
      redirectTo: 'set-password',
      message: 'Please set your permanent password'
    };
  }

  // 4. Kiểm tra regular password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // 5. Kiểm tra isNewUser
  if (user.isNewUser) {
    return {
      redirectTo: 'set-password',
      message: 'Please complete your profile setup'
    };
  }

  // 6. Login thành công với regular password
  return {
    redirectTo: 'home',
    message: 'Login successful'
  };
}
```

#### **Handle OTP Login:**
```javascript
async handleOTPLogin(email, password) {
  const otpData = global.otpStorage?.[email];
  
  if (otpData && otpData.otp === password) {
    return {
      redirectTo: 'set-password',
      message: 'Please set your password to complete registration'
    };
  }
  
  throw new Error('Invalid email or password');
}
```

### **2. User Service (`user.service.js`)**

#### **SetPassword Method:**
```javascript
async setPassword(tokenOrTempToken, password, confirmPassword) {
  // Cập nhật user sau khi set password
  const updatedUser = await User.findByIdAndUpdate(userId, { 
    passwordHash,
    isNewUser: false,    // ✅ Không còn là new user
    isPending: false,    // ✅ Không còn pending
    tempPassword: null   // ✅ Xóa temporary password
  });
}
```

---

## 🧪 **Test Cases**

### **Test 1: OTP Login (Lần đầu tạo tài khoản)**
```bash
# Tạo user với OTP
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@school.com",
    "role": "teacher"
  }'

# Đăng nhập với OTP (password 1-time)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@school.com",
    "password": "Abc123!@#$%^"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "redirectTo": "set-password",
    "message": "Please set your password to complete registration",
    "token": "...",
    "user": {...}
  }
}
```

### **Test 2: Temporary Password (Teacher Import)**
```bash
# Import teacher (có temporary password)
curl -X POST http://localhost:3000/api/users/import-teachers \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -F "file=@teachers.xlsx"

# Đăng nhập với temporary password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "TempPass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "redirectTo": "set-password",
    "message": "Please set your permanent password",
    "token": "...",
    "user": {...}
  }
}
```

### **Test 3: Regular Password (User đã set password)**
```bash
# Đăng nhập với password thường
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@school.com",
    "password": "MyPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "redirectTo": "home",
    "message": "Login successful",
    "token": "...",
    "user": {
      "id": "...",
      "email": "user@school.com",
      "isNewUser": false
    }
  }
}
```

### **Test 4: Set Password Flow**
```bash
# Set password từ temporary/OTP
curl -X POST http://localhost:3000/api/users/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "tempToken": "TEMP_TOKEN_FROM_LOGIN",
    "password": "MyNewPassword123!",
    "confirmPassword": "MyNewPassword123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "redirectTo": "home",
    "message": "Password set successfully",
    "token": "NEW_JWT_TOKEN",
    "user": {
      "isNewUser": false,
      "isPending": false
    }
  }
}
```

---

## 📋 **Decision Tree**

```
Login Request (email, password)
├── User exists?
│   ├── No → Check OTP
│   │   ├── Valid OTP → redirectTo: "set-password"
│   │   └── Invalid → Error
│   └── Yes → Check password type
│       ├── Matches tempPassword → redirectTo: "set-password"
│       ├── Matches regular password
│       │   ├── isNewUser: true → redirectTo: "set-password"
│       │   └── isNewUser: false → redirectTo: "home"
│       └── No match → Error
```

---

## 🔍 **Frontend Integration**

### **Login Response Handling**
```javascript
// Frontend login handler
async function handleLogin(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    
    if (result.success) {
      // Lưu token
      localStorage.setItem('token', result.data.token);
      
      // Redirect dựa trên response
      if (result.data.redirectTo === 'set-password') {
        window.location.href = '/set-password';
      } else if (result.data.redirectTo === 'home') {
        window.location.href = '/dashboard';
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

---

## ⚡ **Quick Test Commands**

### **1. Test OTP Login**
```bash
export TOKEN="your_manager_token"

# Create user with OTP
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@school.com", "role": "teacher"}'

# Login with OTP (check console for OTP)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@school.com", "password": "YOUR_OTP_HERE"}' | jq
```

### **2. Test Regular Login**
```bash
# Login with existing user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@school.com", "password": "their_password"}' | jq
```

---

## 🚨 **Troubleshooting**

### **1. User vẫn redirect vào set-password**
- **Kiểm tra**: `user.isNewUser` trong database
- **Fix**: Set `isNewUser: false` nếu user đã hoàn thành setup
```sql
db.users.updateOne(
  { email: "user@school.com" },
  { $set: { isNewUser: false, isPending: false, tempPassword: null } }
)
```

### **2. OTP không work**
- **Kiểm tra**: `global.otpStorage` có data không
- **Fix**: Restart server để reset OTP storage
```bash
npm run dev  # Restart server
```

### **3. Temporary password không work**
- **Kiểm tra**: `user.tempPassword` field trong database
- **Fix**: Ensure tempPassword is set during import
```sql
db.users.findOne({ email: "teacher@school.com" }, { tempPassword: 1 })
```

---

## 📝 **Database States**

### **New User (OTP flow)**
```json
{
  "email": "new@school.com",
  "passwordHash": null,
  "tempPassword": null,
  "isNewUser": true,
  "isPending": false
}
```

### **Imported Teacher (temp password)**
```json
{
  "email": "teacher@school.com",
  "passwordHash": "hashed_default_or_empty",
  "tempPassword": "TempPass123!",
  "isNewUser": true,
  "isPending": true
}
```

### **Completed User (regular password)**
```json
{
  "email": "user@school.com",
  "passwordHash": "hashed_user_password",
  "tempPassword": null,
  "isNewUser": false,
  "isPending": false
}
```

---

## ✅ **Kết Quả Mong Đợi**

1. **OTP Login** → `redirectTo: "set-password"`
2. **Temporary Password** → `redirectTo: "set-password"`
3. **Regular Password** (isNewUser: false) → `redirectTo: "home"`
4. **Set Password** → Clear temp data + `redirectTo: "home"`

Logic này sẽ đảm bảo user được redirect đúng nơi theo trạng thái tài khoản của họ! 🎉 