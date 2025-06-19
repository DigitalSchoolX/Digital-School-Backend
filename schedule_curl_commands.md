# Curl Commands - Thời Khóa Biểu API

## Authentication Setup
```bash
# Thay YOUR_TOKEN bằng JWT token thực tế
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export BASE_URL="http://localhost:3000/api/schedules"
```

---

## 1. Preview Tạo Thời Khóa Biểu

### Preview khối 12 năm 2024-2025
```bash
curl -X POST $BASE_URL/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12
  }'
```

### Preview khối 10 năm 2024-2025
```bash
curl -X POST $BASE_URL/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 10
  }'
```

---

## 2. Tạo Thời Khóa Biểu

### Tạo cho khối 12 (cơ bản)
```bash
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }'
```

### Tạo cho khối 11 với custom schedule
```bash
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 11,
    "effectiveDate": "2024-09-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z",
    "customSchedule": {
      "daysOfWeek": [1, 2, 3, 4, 5, 6],
      "periodsPerDay": {
        "1": 7,
        "2": 6,
        "3": 7,
        "4": 6,
        "5": 7,
        "6": 6
      }
    }
  }'
```

### Tạo cho khối 10
```bash
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 10,
    "effectiveDate": "2024-09-01T00:00:00.000Z",
    "endDate": "2025-06-30T00:00:00.000Z"
  }'
```

---

## 3. Lấy Danh Sách Thời Khóa Biểu

### Lấy tất cả (trang 1)
```bash
curl -X GET "$BASE_URL?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy theo năm học
```bash
curl -X GET "$BASE_URL?academicYear=2024-2025" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy theo khối lớp
```bash
curl -X GET "$BASE_URL?gradeLevel=12" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy theo khối và năm học
```bash
curl -X GET "$BASE_URL?academicYear=2024-2025&gradeLevel=12" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy theo trạng thái active
```bash
curl -X GET "$BASE_URL?status=active&academicYear=2024-2025" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy với phân trang
```bash
curl -X GET "$BASE_URL?page=2&limit=5&academicYear=2024-2025&gradeLevel=11" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Lấy Chi Tiết Thời Khóa Biểu

### Lấy chi tiết (thay SCHEDULE_ID)
```bash
curl -X GET $BASE_URL/67123abc456def789012345 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Cập Nhật Thời Khóa Biểu

### Cập nhật status thành draft
```bash
curl -X PUT $BASE_URL/67123abc456def789012345 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "draft"
  }'
```

### Cập nhật ngày hiệu lực
```bash
curl -X PUT $BASE_URL/67123abc456def789012345 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "effectiveDate": "2024-09-15T00:00:00.000Z",
    "endDate": "2025-07-15T00:00:00.000Z"
  }'
```

### Cập nhật thời khóa biểu chi tiết
```bash
curl -X PUT $BASE_URL/67123abc456def789012345 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
          },
          {
            "periodNumber": 2,
            "session": "morning",
            "subject": "64f1b2a3c4d5e6f7g8h9i0j5",
            "teacher": "64f1b2a3c4d5e6f7g8h9i0j6",
            "room": "A102",
            "isBreak": false
          },
          {
            "periodNumber": 3,
            "session": "morning",
            "isBreak": true,
            "notes": "Giờ ra chơi"
          }
        ]
      }
    ]
  }'
```

---

## 6. Xóa Thời Khóa Biểu

### Xóa (soft delete)
```bash
curl -X DELETE $BASE_URL/67123abc456def789012345 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Thống Kê Thời Khóa Biểu

### Thống kê năm 2024-2025
```bash
curl -X GET "$BASE_URL/stats?academicYear=2024-2025" \
  -H "Authorization: Bearer $TOKEN"
```

### Thống kê năm 2023-2024
```bash
curl -X GET "$BASE_URL/stats?academicYear=2023-2024" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Lấy Danh Sách Lớp Theo Khối

### Lấy lớp khối 12 năm 2024-2025
```bash
curl -X GET "$BASE_URL/classes?academicYear=2024-2025&gradeLevel=12" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy lớp khối 11 năm 2024-2025
```bash
curl -X GET "$BASE_URL/classes?academicYear=2024-2025&gradeLevel=11" \
  -H "Authorization: Bearer $TOKEN"
```

### Lấy lớp khối 10 năm 2024-2025
```bash
curl -X GET "$BASE_URL/classes?academicYear=2024-2025&gradeLevel=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 9. Test Cases Thực Tế

### Workflow hoàn chỉnh
```bash
#!/bin/bash

# Setup
export TOKEN="YOUR_JWT_TOKEN_HERE"
export BASE_URL="http://localhost:3000/api/schedules"

echo "=== 1. Preview trước khi tạo ==="
curl -X POST $BASE_URL/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12
  }' | jq

echo -e "\n=== 2. Tạo thời khóa biểu ==="
RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }')

echo $RESPONSE | jq

echo -e "\n=== 3. Lấy danh sách vừa tạo ==="
curl -X GET "$BASE_URL?academicYear=2024-2025&gradeLevel=12&status=active" \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n=== 4. Thống kê ==="
curl -X GET "$BASE_URL/stats?academicYear=2024-2025" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 10. Error Testing

### Test validation errors
```bash
# Missing required fields
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid academic year format
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024",
    "gradeLevel": 12,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }'

# Invalid grade level
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 15,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }'

# Past effective date
curl -X POST $BASE_URL \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "effectiveDate": "2023-09-01T00:00:00.000Z"
  }'
```

### Test authorization
```bash
# No token
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }'

# Invalid token
curl -X POST $BASE_URL \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "academicYear": "2024-2025",
    "gradeLevel": 12,
    "effectiveDate": "2024-09-01T00:00:00.000Z"
  }'
```

---

## 11. Response Examples

### Successful Create Response
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
        "id": "67123abc456def789012345",
        "className": "12A1",
        "totalPeriods": 39,
        "status": "active",
        "effectiveDate": "2024-09-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "gradeLevel",
      "message": "Grade level must be between 1 and 12"
    }
  ]
}
```

---

## Tips & Tricks

### 1. Use jq for JSON formatting
```bash
curl ... | jq '.'
```

### 2. Save response to variable
```bash
RESPONSE=$(curl -s ...)
echo $RESPONSE | jq '.data.schedules[0].id'
```

### 3. Extract schedule ID for further testing
```bash
SCHEDULE_ID=$(curl -s ... | jq -r '.data.schedules[0].id')
curl -X GET $BASE_URL/$SCHEDULE_ID -H "Authorization: Bearer $TOKEN"
```

### 4. Test with different environments
```bash
# Development
export BASE_URL="http://localhost:3000/api/schedules"

# Staging
export BASE_URL="https://staging.ecoschool.com/api/schedules"

# Production
export BASE_URL="https://api.ecoschool.com/api/schedules"
```

### 5. Batch testing
```bash
# Test multiple grade levels
for grade in 10 11 12; do
  echo "Testing grade $grade"
  curl -X POST $BASE_URL/preview \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"academicYear\": \"2024-2025\", \"gradeLevel\": $grade}" | jq
done
``` 