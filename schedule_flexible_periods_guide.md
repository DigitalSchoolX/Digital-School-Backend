# Hệ Thống Thời Khóa Biểu Linh Hoạt - Hướng Dẫn Chi Tiết

## Tổng Quan Thay Đổi

Hệ thống thời khóa biểu đã được cập nhật để **linh hoạt hơn** với số tiết học trong ngày, thay vì cố định 10 tiết:

### ❌ **Trước đây (Cũ)**
- Cố định 10 tiết/ngày (5 sáng + 5 chiều)
- Giờ ra chơi: Tiết 3 (sáng) và tiết 8 (chiều)
- Không linh hoạt theo ngày trong tuần

### ✅ **Hiện tại (Mới)**
- **6-7 tiết/ngày** (linh hoạt theo từng ngày)
- **Giờ ra chơi**: Tiết giữa (tự động tính toán)
- **Phân chia buổi**: Tự động chia sáng/chiều dựa trên tổng số tiết

---

## Cấu Trúc Mới

### **Phân Bổ Tiết Theo Ngày**
```
Thứ 2: 7 tiết (4 sáng + 3 chiều)
Thứ 3: 6 tiết (3 sáng + 3 chiều)  
Thứ 4: 7 tiết (4 sáng + 3 chiều)
Thứ 5: 6 tiết (3 sáng + 3 chiều)
Thứ 6: 7 tiết (4 sáng + 3 chiều)
Thứ 7: 6 tiết (3 sáng + 3 chiều)
```

**Tổng cộng**: 39 tiết/tuần (thay vì 54 tiết)

### **Logic Giờ Ra Chơi**
- **Tự động**: Tiết giữa = `Math.ceil(totalPeriods / 2)`
- **Ngày 6 tiết**: Giờ ra chơi = Tiết 3
- **Ngày 7 tiết**: Giờ ra chơi = Tiết 4

### **Phân Chia Buổi Học**
```javascript
// Logic tự động
const morningPeriods = Math.ceil(totalPeriods / 2);
if (period <= morningPeriods) {
  session = 'morning';
} else {
  session = 'afternoon';
}
```

---

## Ví Dụ Thực Tế

### **Thứ 2 (7 tiết)**
```json
{
  "dayOfWeek": 1,
  "dayName": "Thứ 2",
  "periods": [
    { "periodNumber": 1, "session": "morning", "subject": "Toán", "isBreak": false },
    { "periodNumber": 2, "session": "morning", "subject": "Văn", "isBreak": false },
    { "periodNumber": 3, "session": "morning", "subject": "Anh", "isBreak": false },
    { "periodNumber": 4, "session": "morning", "isBreak": true, "notes": "Giờ ra chơi" },
    { "periodNumber": 5, "session": "afternoon", "subject": "Lý", "isBreak": false },
    { "periodNumber": 6, "session": "afternoon", "subject": "Hóa", "isBreak": false },
    { "periodNumber": 7, "session": "afternoon", "subject": "Sinh", "isBreak": false }
  ]
}
```

### **Thứ 3 (6 tiết)**
```json
{
  "dayOfWeek": 2,
  "dayName": "Thứ 3",
  "periods": [
    { "periodNumber": 1, "session": "morning", "subject": "Toán", "isBreak": false },
    { "periodNumber": 2, "session": "morning", "subject": "Văn", "isBreak": false },
    { "periodNumber": 3, "session": "morning", "isBreak": true, "notes": "Giờ ra chơi" },
    { "periodNumber": 4, "session": "afternoon", "subject": "Anh", "isBreak": false },
    { "periodNumber": 5, "session": "afternoon", "subject": "Sử", "isBreak": false },
    { "periodNumber": 6, "session": "afternoon", "subject": "Địa", "isBreak": false }
  ]
}
```

---

## Thay Đổi Trong Code

### **1. Model Updates**
```javascript
// schedule.model.js
periodNumber: {
  type: Number,
  required: true,
  min: 1,
  max: 7 // Thay đổi từ 10 thành 7
}

session: {
  type: String,
  required: true,
  enum: ['morning', 'afternoon', 'full_day'] // Thêm 'full_day'
}
```

### **2. Service Logic**
```javascript
// Số tiết theo ngày
getTotalPeriodsForDay(dayOfWeek) {
  switch (dayOfWeek) {
    case 1: return 7; // Thứ 2
    case 2: return 6; // Thứ 3
    case 3: return 7; // Thứ 4
    case 4: return 6; // Thứ 5
    case 5: return 7; // Thứ 6
    case 6: return 6; // Thứ 7
    default: return 6;
  }
}

// Xác định session
getSessionForPeriod(period, totalPeriods) {
  const morningPeriods = Math.ceil(totalPeriods / 2);
  return period <= morningPeriods ? 'morning' : 'afternoon';
}
```

### **3. Validation Updates**
```javascript
// Cập nhật validation
body('weeklySchedule.*.periods.*.periodNumber')
  .isInt({ min: 1, max: 7 }) // Thay đổi từ max: 10

body('weeklySchedule.*.periods.*.session')
  .isIn(['morning', 'afternoon', 'full_day']) // Thêm full_day
```

---

## Lợi Ích Của Hệ Thống Mới

### **1. Linh Hoạt Hơn**
- Không bị ràng buộc cố định 10 tiết
- Có thể điều chỉnh theo nhu cầu thực tế của trường
- Phù hợp với các chuẩn giáo dục khác nhau

### **2. Thực Tế Hơn**
- 6-7 tiết/ngày phù hợp với học sinh
- Giảm áp lực học tập
- Tăng hiệu quả tiếp thu

### **3. Dễ Quản Lý**
- Logic tự động cho giờ ra chơi
- Tự động phân chia buổi học
- Thống kê chính xác số tiết

---

## Migration & Compatibility

### **Dữ Liệu Cũ**
- Hệ thống tự động tương thích với thời khóa biểu cũ
- Không cần migrate dữ liệu hiện có
- API responses sẽ hiển thị đúng số tiết mới

### **API Endpoints**
- Tất cả endpoints giữ nguyên
- Chỉ thay đổi logic internal
- Response format không đổi

### **Frontend Integration**
- Cần cập nhật UI để hiển thị 6-7 tiết thay vì 10
- Cập nhật validation client-side
- Thay đổi các hardcoded values

---

## Testing

### **Test Cases Cần Cập Nhật**

1. **Tạo thời khóa biểu mới**
   - Verify 6-7 tiết per day
   - Check correct break period placement
   - Validate session assignment

2. **Validation Tests**
   - Period number: 1-7 (not 1-10)
   - Session values: morning/afternoon/full_day

3. **Edge Cases**
   - Ngày có 6 tiết vs 7 tiết
   - Giờ ra chơi ở vị trí đúng
   - Phân chia buổi học chính xác

---

## Configuration

### **Tùy Chỉnh Số Tiết**
Nếu cần thay đổi số tiết cho từng ngày, cập nhật trong service:

```javascript
getTotalPeriodsForDay(dayOfWeek) {
  // Có thể config từ database hoặc config file
  const periodsConfig = {
    1: 7, // Thứ 2
    2: 6, // Thứ 3
    3: 7, // Thứ 4
    4: 6, // Thứ 5
    5: 7, // Thứ 6
    6: 6  // Thứ 7
  };
  
  return periodsConfig[dayOfWeek] || 6;
}
```

### **Custom Schedule Support**
API hỗ trợ tùy chỉnh số tiết qua `customSchedule` parameter:

```json
{
  "customSchedule": {
    "periodsPerDay": {
      "1": 7,
      "2": 6,
      "3": 7,
      "4": 6,
      "5": 7,
      "6": 6
    }
  }
}
```

---

## Troubleshooting

### **Common Issues**

1. **Validation Error: Period > 7**
   - **Cause**: Cũ frontend gửi period number > 7
   - **Fix**: Cập nhật client validation

2. **Session Error: Invalid value**
   - **Cause**: Frontend gửi session không hợp lệ
   - **Fix**: Ensure sessions are 'morning'/'afternoon'/'full_day'

3. **Break Period Wrong Position**
   - **Cause**: Logic cũ hardcode tiết 3/8
   - **Fix**: Sử dụng `Math.ceil(totalPeriods / 2)`

### **Debug Tips**

```javascript
// Log để debug
console.log('Day:', dayOfWeek, 'Total Periods:', totalPeriods);
console.log('Break Period:', Math.ceil(totalPeriods / 2));
console.log('Morning Periods:', Math.ceil(totalPeriods / 2));
```

---

## Kết Luận

Hệ thống thời khóa biểu mới với **6-7 tiết/ngày** mang lại sự linh hoạt và thực tế hơn. Tất cả API endpoints và logic đã được cập nhật để hỗ trợ cấu trúc mới này, đồng thời vẫn đảm bảo tương thích với dữ liệu hiện có. 