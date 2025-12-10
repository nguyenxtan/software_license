# Hệ thống Quản lý Bản quyền & Hợp đồng Phần mềm

Web app nội bộ để theo dõi và nhắc nhở gia hạn bản quyền phần mềm, hợp đồng bảo trì và dịch vụ.

## Tính năng chính

1. **Quản lý thông tin bản quyền & hợp đồng**
   - Lưu trữ thông tin chi tiết về phần mềm, hợp đồng bảo trì
   - Theo dõi thời hạn và chi phí
   - Phân loại theo phòng ban

2. **Cảnh báo tự động**
   - Nhắc nhở trước khi hết hạn (mặc định 3 tháng, có thể cấu hình)
   - Gửi email tự động theo các mốc: 90, 60, 30, 7, 1 ngày
   - Dashboard hiển thị trạng thái

3. **Import/Export Excel**
   - Nhập dữ liệu hàng loạt từ file Excel
   - Xuất báo cáo theo nhiều định dạng
   - Template Excel chuẩn

4. **Quản lý quy trình**
   - Đánh dấu đã xử lý/gia hạn
   - Lịch sử gia hạn
   - Theo dõi tiến độ

5. **Báo cáo & Dashboard**
   - Tổng quan trực quan
   - Biểu đồ thống kê
   - Báo cáo chi tiết theo phòng ban

## Cấu trúc dự án

```
├── backend/              # API Server
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation
│   │   ├── services/     # Email, scheduler
│   │   └── utils/        # Helper functions
│   └── prisma/           # Database schema
└── frontend/             # React SPA
    └── src/
        ├── components/   # UI components
        ├── pages/        # Page components
        ├── services/     # API calls
        └── contexts/     # State management
```

## Công nghệ sử dụng

### Backend
- Node.js + Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- node-cron (scheduled jobs)
- nodemailer (email)
- xlsx (Excel processing)

### Frontend
- React + TypeScript
- Vite
- Ant Design
- React Router
- Axios
- Recharts

## Cài đặt

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Cấu hình database trong .env
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Phân quyền

- **System Admin**: Quản lý user, cấu hình hệ thống
- **Department Manager**: Quản lý phần mềm của phòng ban
- **User**: Xem và cập nhật thông tin
- **Viewer**: Chỉ xem báo cáo

## Tính năng mở rộng (tương lai)

- Tích hợp Keycloak SSO
- Đính kèm file hợp đồng
- Thông báo qua Teams/Slack
- Audit trail đầy đủ
- Đa năm tài chính
