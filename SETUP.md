# Hướng dẫn Cài đặt và Chạy Hệ thống

## Yêu cầu hệ thống

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm hoặc yarn

## Bước 1: Cài đặt PostgreSQL

### macOS (sử dụng Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Tạo database:
```bash
createdb software_license
```

Hoặc sử dụng psql:
```bash
psql postgres
CREATE DATABASE software_license;
\q
```

## Bước 2: Cài đặt Backend

```bash
cd backend
npm install
```

### Cấu hình môi trường:

Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/software_license?schema=public"

# Thay đổi user và password theo PostgreSQL của bạn
# Ví dụ với user mặc định:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/software_license?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="Hệ thống quản lý bản quyền <noreply@yourcompany.com>"

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Khởi tạo database và seed dữ liệu:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with sample data
node prisma/seed.js
```

### Chạy backend server:

```bash
npm run dev
```

Backend sẽ chạy tại: http://localhost:3000

## Bước 3: Cài đặt Frontend

Mở terminal mới:

```bash
cd frontend
npm install
```

### Chạy frontend:

```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## Bước 4: Truy cập Hệ thống

Mở trình duyệt và truy cập: http://localhost:5173

### Tài khoản mặc định:

Sau khi chạy seed script, bạn có thể đăng nhập với các tài khoản sau:

1. **Admin:**
   - Username: `admin`
   - Password: `123456`
   - Role: ADMIN

2. **IT Manager:**
   - Username: `it.manager`
   - Password: `123456`
   - Role: MANAGER

3. **Marketing Manager:**
   - Username: `mkt.manager`
   - Password: `123456`
   - Role: MANAGER

4. **User:**
   - Username: `user1`
   - Password: `123456`
   - Role: USER

## Bước 5: Cấu hình Email (Tùy chọn)

### Sử dụng Gmail:

1. Bật xác thực 2 bước cho tài khoản Gmail
2. Tạo App Password:
   - Truy cập: https://myaccount.google.com/apppasswords
   - Tạo mật khẩu cho ứng dụng "Mail"
   - Copy password và paste vào `SMTP_PASS` trong file `.env`

### Test gửi email:

Sau khi cấu hình, hệ thống sẽ tự động gửi email nhắc nhở vào 1:00 AM hàng ngày.

Để test ngay:
- Vào màn hình danh sách phần mềm
- Click nút "Gửi email nhắc" trên một bản ghi bất kỳ

## Prisma Studio (Quản lý database trực quan)

```bash
cd backend
npx prisma studio
```

Mở trình duyệt tại: http://localhost:5555

## Troubleshooting

### Lỗi kết nối database:

```
Error: P1001: Can't reach database server
```

**Giải pháp:**
- Kiểm tra PostgreSQL đang chạy: `pg_isready`
- Kiểm tra DATABASE_URL trong `.env`
- Thử kết nối trực tiếp: `psql -d software_license`

### Lỗi Prisma migration:

```bash
# Reset database (XÓA TẤT CẢ DỮ LIỆU)
npx prisma migrate reset

# Sau đó seed lại
node prisma/seed.js
```

### Port đã được sử dụng:

**Backend (port 3000):**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Hoặc thay đổi PORT trong .env
PORT=3001
```

**Frontend (port 5173):**
Vite sẽ tự động chọn port khác nếu 5173 bị chiếm.

### Không gửi được email:

1. Kiểm tra cấu hình SMTP trong `.env`
2. Kiểm tra log backend để xem lỗi cụ thể
3. Đảm bảo App Password được tạo đúng (với Gmail)
4. Tắt tạm thời để test: `ENABLE_AUTO_NOTIFICATIONS=false`

## Cấu trúc thư mục

```
thongbaogiahanphanmem/
├── backend/
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, error handling
│   │   ├── config/           # Database, email config
│   │   └── utils/            # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Sample data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── services/         # API calls
│   │   ├── contexts/         # React contexts
│   │   └── types/            # TypeScript types
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - Đăng nhập
- GET `/api/auth/me` - Lấy thông tin user hiện tại
- POST `/api/auth/logout` - Đăng xuất

### Software Assets
- GET `/api/software-assets` - Danh sách phần mềm
- GET `/api/software-assets/:id` - Chi tiết phần mềm
- POST `/api/software-assets` - Tạo mới
- PUT `/api/software-assets/:id` - Cập nhật
- DELETE `/api/software-assets/:id` - Xóa
- POST `/api/software-assets/:id/complete-renewal` - Hoàn tất gia hạn
- POST `/api/software-assets/:id/send-reminder` - Gửi email nhắc

### Departments
- GET `/api/departments` - Danh sách phòng ban
- POST `/api/departments` - Tạo phòng ban mới

### Users (Admin only)
- GET `/api/users` - Danh sách người dùng
- POST `/api/users` - Tạo người dùng mới
- PUT `/api/users/:id` - Cập nhật người dùng
- DELETE `/api/users/:id` - Xóa người dùng

### Upload/Import
- GET `/api/upload/template` - Tải template Excel
- POST `/api/upload/import` - Upload file Excel
- GET `/api/upload/jobs` - Lịch sử import
- GET `/api/upload/export` - Xuất Excel

### Dashboard
- GET `/api/dashboard/summary` - Thống kê tổng quan
- GET `/api/dashboard/expiring?days=90` - Phần mềm sắp hết hạn

### Notifications
- GET `/api/notifications` - Danh sách thông báo
- POST `/api/notifications/:id/resend` - Gửi lại email

## Phát triển thêm

### Thêm field mới vào SoftwareAsset:

1. Cập nhật schema trong `backend/prisma/schema.prisma`
2. Chạy migration:
   ```bash
   npx prisma migrate dev --name add_new_field
   ```
3. Cập nhật types trong `frontend/src/types/index.ts`
4. Cập nhật form và table tương ứng

### Thay đổi logic nhắc nhở:

Chỉnh sửa file: `backend/src/services/schedulerService.js`

Thay đổi mốc nhắc:
```javascript
const REMINDER_DAYS = [90, 60, 30, 7, 1, 0]; // Tùy chỉnh theo nhu cầu
```

### Tích hợp Keycloak SSO (Tương lai):

Hệ thống đã chuẩn bị sẵn để tích hợp Keycloak:
- Bảng `users` có field `authProvider` và `externalId`
- Cấu hình Keycloak trong `.env`
- Chỉ cần implement logic OAuth2 trong `authController.js`

## Backup & Restore

### Backup database:
```bash
pg_dump software_license > backup_$(date +%Y%m%d).sql
```

### Restore database:
```bash
psql software_license < backup_20250101.sql
```

## Production Deployment

### Environment Variables cho Production:

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET=<strong-random-secret>
FRONTEND_URL=https://yourdomain.com
```

### Build Frontend:
```bash
cd frontend
npm run build
# Output sẽ ở folder dist/
```

### Build Backend (nếu cần):
```bash
cd backend
npm install --production
```

### Chạy với PM2:
```bash
npm install -g pm2
cd backend
pm2 start src/index.js --name software-license-api
pm2 save
pm2 startup
```

## Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Log của backend terminal
2. Console của trình duyệt (F12)
3. Prisma Studio để xem dữ liệu database
4. File log email (nếu có)

Chúc bạn triển khai thành công! 🚀
