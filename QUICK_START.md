# Hướng dẫn Khởi động Nhanh

## Cài đặt lần đầu (15 phút)

### 1. Cài đặt PostgreSQL và tạo database
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14
createdb software_license

# Hoặc sử dụng Docker
docker run --name postgres-license -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=software_license -p 5432:5432 -d postgres:14
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env

# Chỉnh sửa file .env với thông tin database của bạn
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/software_license?schema=public"

npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js

npm run dev
```

Backend chạy tại: **http://localhost:3000**

### 3. Setup Frontend (Terminal mới)
```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:5173**

### 4. Đăng nhập
- URL: http://localhost:5173
- Username: **admin**
- Password: **123456**

---

## Sử dụng hàng ngày

### Khởi động hệ thống

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Dừng hệ thống
Nhấn `Ctrl + C` ở mỗi terminal

---

## Các tính năng chính

### 1. Quản lý bản quyền phần mềm
- **Thêm mới**: Nút "Thêm mới" trên màn hình danh sách
- **Sửa**: Click vào tên phần mềm hoặc nút "Sửa"
- **Xóa**: Nút "Xóa" (chỉ Admin)
- **Gia hạn**: Nút "Gia hạn" để cập nhật ngày hết hạn mới

### 2. Import từ Excel
1. Tải template: Nút "Tải template" trên màn hình Upload
2. Điền dữ liệu vào file Excel
3. Upload file lên hệ thống
4. Xem kết quả import (thành công/thất bại)

### 3. Xuất báo cáo Excel
- Màn hình danh sách: Nút "Xuất Excel"
- Có thể filter trước khi xuất

### 4. Dashboard
- Xem tổng quan: Tổng số phần mềm, sắp hết hạn, đã hết hạn
- Biểu đồ theo phòng ban, trạng thái
- Danh sách 10 phần mềm sắp hết hạn

### 5. Gửi email nhắc nhở
- **Tự động**: Hệ thống tự gửi vào 1:00 AM hàng ngày
- **Thủ công**: Nút "Gửi email" trên từng bản ghi

### 6. Quản lý người dùng (Admin)
- Thêm/sửa/xóa user
- Phân quyền: ADMIN, MANAGER, USER, VIEWER
- Gán phòng ban

### 7. Quản lý phòng ban (Admin)
- Thêm/sửa phòng ban
- Cấu hình email nhóm để nhận cảnh báo

---

## Phân quyền

| Chức năng | ADMIN | MANAGER | USER | VIEWER |
|-----------|-------|---------|------|--------|
| Xem danh sách phần mềm | ✅ | ✅ (phòng mình) | ✅ (phòng mình) | ✅ |
| Thêm/Sửa phần mềm | ✅ | ✅ | ❌ | ❌ |
| Xóa phần mềm | ✅ | ❌ | ❌ | ❌ |
| Gia hạn | ✅ | ✅ | ❌ | ❌ |
| Upload Excel | ✅ | ✅ | ❌ | ❌ |
| Quản lý User | ✅ | ❌ | ❌ | ❌ |
| Quản lý Phòng ban | ✅ | ❌ | ❌ | ❌ |
| Xem Dashboard | ✅ | ✅ | ✅ | ✅ |
| Gửi email thủ công | ✅ | ✅ | ❌ | ❌ |

---

## Template Excel

### Các cột bắt buộc:
1. **Phần mềm** - Tên phần mềm (required)
2. **Thời hạn (dd/mm/yyyy)** - Ngày hết hạn (required)

### Các cột tùy chọn:
- STT
- Kinh phí năm 2025 (VNĐ)
- Đơn vị sử dụng (tên phòng ban)
- Ghi chú
- Nhắc trước 3 tháng (Y/N)
- Nhà cung cấp
- Số hợp đồng
- Loại license
- Số lượng

### Ví dụ dữ liệu:

| STT | Phần mềm | Kinh phí năm 2025 (VNĐ) | Đơn vị sử dụng | Thời hạn | Nhắc trước 3 tháng |
|-----|----------|------------------------|----------------|----------|-------------------|
| 1 | Microsoft Office 365 | 50000000 | Phòng CNTT | 31/12/2025 | Y |
| 2 | Adobe Creative Cloud | 30000000 | Phòng Marketing | 15/06/2025 | Y |

---

## Cấu hình Email

### Gmail (Khuyến nghị cho test)

1. Tạo App Password:
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn "Mail" và "Other"
   - Copy password

2. Cập nhật file `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password-từ-bước-1
EMAIL_FROM="Hệ thống quản lý bản quyền <noreply@yourcompany.com>"
```

3. Restart backend server

### Test gửi email:
- Vào danh sách phần mềm
- Click "Gửi email" trên một bản ghi
- Kiểm tra inbox

---

## Mốc thời gian nhắc nhở

Mặc định hệ thống gửi email khi còn:
- **90 ngày** (3 tháng)
- **60 ngày** (2 tháng)
- **30 ngày** (1 tháng)
- **7 ngày** (1 tuần)
- **1 ngày** (hôm sau hết hạn)
- **0 ngày** (hôm nay hết hạn)

Chỉnh sửa tại: `backend/src/services/schedulerService.js`
```javascript
const REMINDER_DAYS = [90, 60, 30, 7, 1, 0];
```

---

## Troubleshooting nhanh

### Backend không chạy được:
```bash
# Kiểm tra PostgreSQL
pg_isready

# Kiểm tra port 3000
lsof -i:3000

# Xem log lỗi ở terminal backend
```

### Frontend không kết nối được backend:
- Kiểm tra backend đang chạy: http://localhost:3000/health
- Kết quả mong đợi: `{"status":"ok","timestamp":"..."}`

### Không thể đăng nhập:
```bash
# Reset password cho admin
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = await bcrypt.hash('123456', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { passwordHash: hash }
  });
  console.log('Password reset to: 123456');
  await prisma.\$disconnect();
})();
"
```

### Reset toàn bộ database:
```bash
cd backend
npx prisma migrate reset
node prisma/seed.js
```

---

## Prisma Studio (Xem/sửa database trực tiếp)

```bash
cd backend
npx prisma studio
```

Truy cập: http://localhost:5555

Có thể xem và chỉnh sửa:
- Users
- Departments
- Software Assets
- Notifications
- Import Jobs

---

## Các lệnh hữu ích

### Backend:
```bash
cd backend

# Chạy dev mode
npm run dev

# Tạo migration mới
npx prisma migrate dev --name ten_migration

# Reset database
npx prisma migrate reset

# Prisma Studio
npx prisma studio

# Seed lại data
node prisma/seed.js
```

### Frontend:
```bash
cd frontend

# Chạy dev mode
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## URLs quan trọng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Backend Health**: http://localhost:3000/health
- **Prisma Studio**: http://localhost:5555

---

## Tài khoản mặc định

| Username | Password | Role | Phòng ban |
|----------|----------|------|-----------|
| admin | 123456 | ADMIN | Phòng CNTT |
| it.manager | 123456 | MANAGER | Phòng CNTT |
| mkt.manager | 123456 | MANAGER | Phòng Marketing |
| user1 | 123456 | USER | Phòng CNTT |

---

## Workflow thông thường

### Thêm phần mềm mới:
1. Đăng nhập với quyền ADMIN hoặc MANAGER
2. Vào "Danh sách bản quyền"
3. Click "Thêm mới"
4. Điền thông tin
5. Lưu

### Import hàng loạt:
1. Vào "Upload Excel"
2. Click "Tải template"
3. Điền dữ liệu vào Excel
4. Upload file
5. Kiểm tra kết quả
6. Xem "Lịch sử import" nếu có lỗi

### Gia hạn phần mềm:
1. Vào "Danh sách bản quyền"
2. Tìm phần mềm cần gia hạn
3. Click "Gia hạn"
4. Nhập ngày hết hạn mới, chi phí
5. Lưu
6. Lịch sử gia hạn sẽ được lưu tự động

### Xem báo cáo:
1. Vào "Dashboard" - xem tổng quan
2. Vào "Danh sách bản quyền" - filter và xuất Excel
3. Vào "Thông báo" - xem lịch sử email

---

Chúc bạn sử dụng hiệu quả! 🎉
