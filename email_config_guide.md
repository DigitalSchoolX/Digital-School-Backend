# Hướng dẫn cấu hình Email cho EcoSchool

## Vấn đề hiện tại
❌ Email không gửi được do lỗi: `nodemailer.createTransporter is not a function`

## Đã sửa lỗi code
✅ Đã sửa `createTransporter` thành `createTransport` 
✅ Đã thêm kiểm tra cấu hình email
✅ Đã tối ưu hóa error handling

## Cách cấu hình email

### Bước 1: Tạo file .env
Tạo file `.env` trong thư mục gốc với nội dung:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ecoschool-app-dev
JWT_SECRET=your-super-secret-jwt-key-here-should-be-very-long-and-random

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=EcoSchool System <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Bước 2: Cấu hình Gmail App Password

1. **Bật 2-Factor Authentication:**
   - Truy cập: https://myaccount.google.com/security
   - Bật "2-Step Verification"

2. **Tạo App Password:**
   - Truy cập: https://support.google.com/accounts/answer/185833
   - Chọn "Mail" và thiết bị của bạn
   - Copy mật khẩu ứng dụng 16 ký tự

3. **Cập nhật .env:**
   ```env
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Bước 3: Test email

Sau khi cấu hình, restart server và thử import lại:

```bash
# Restart server
npm start

# Test import base64
curl -X POST "http://localhost:3000/api/users/import-students-base64" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @students_import_payload.json
```

## Các tùy chọn email khác

### Sử dụng SMTP tùy chỉnh:
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@your-domain.com
EMAIL_PASS=your-password
```

### Sử dụng Outlook/Hotmail:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## Lưu ý quan trọng

- ⚠️ **Không commit file .env** vào git
- ✅ Sử dụng App Password thay vì mật khẩu thường
- 🔒 Giữ bí mật thông tin email
- 📧 Test với email thật trước khi production

## Nếu không muốn cấu hình email

Hệ thống sẽ tự động fallback và in temporary passwords ra console:

```
📧 [NO EMAIL CONFIG] Temp password for student@example.com: ABC123xyz!
⚠️  Please configure EMAIL_USER, EMAIL_PASS in .env file to send real emails
```

Students vẫn có thể đăng nhập bằng temporary passwords này. 