# Tình trạng Deploy - Software License System

**VPS:** 217.217.252.57
**Repository:** https://github.com/nguyenxtan/software_license
**Email:** tan.nx2377@gmail.com

---

## ✅ Đã hoàn thành

### 1. ✅ Chuẩn bị môi trường
- [x] Tạo PostgreSQL container `software_license_db` trên port 5433
- [x] Database: `software_license`
- [x] User: `license_admin` / Password: `LicenseDemo@2025`

### 2. ✅ Push code lên GitHub
- [x] Repository: https://github.com/nguyenxtan/software_license
- [x] Branch: main
- [x] Đã fix các lỗi:
  - Missing package-lock.json
  - Prisma OpenSSL compatibility (thêm openssl vào Dockerfile)
  - Port conflict (đổi từ 3000 → 3001)

### 3. ✅ Deploy Backend API
- [x] Clone project về VPS: `/opt/software_license`
- [x] Build Docker image từ `backend/Dockerfile`
- [x] Chạy container: `software_license_api`
- [x] Container đang chạy trên port 3001
- [x] Health check: http://217.217.252.57:3001/health → OK

### 4. ✅ Database Migration
- [x] Vào trong container: `docker exec -it software_license_api sh`
- [x] Chạy migration: `npx prisma migrate dev --name init`
- [x] Migration file tạo thành công: `backend/prisma/migrations/20251210151129_init/migration.sql`
- [x] Tất cả 10 tables đã được tạo trong database

---

### 5. ✅ Seed dữ liệu mẫu
- [x] Chạy: `node prisma/seed.js`
- [x] Đã tạo 4 phòng ban: IT, Marketing, Tài chính, Nhân sự
- [x] Đã tạo 4 users: admin, it.manager, mkt.manager, user1 (password: 123456)
- [x] Đã tạo 8 phần mềm mẫu với ngày hết hạn khác nhau
- [x] Đã tạo cấu hình hệ thống

### 6. ✅ Test API
- [x] Health check: `http://localhost:3001/health` → `{"status":"ok"}` ✓
- [x] Login API: `POST /api/auth/login` → JWT token trả về thành công ✓
- [x] Database connection hoạt động tốt
- [x] Authentication hoạt động tốt

---

### 7. ✅ Cấu hình aaPanel Reverse Proxy
- [x] Truy cập aaPanel web interface
- [x] Tạo website: `license.snpdemo.com`
- [x] Cấu hình Reverse Proxy → Target: `http://127.0.0.1:3001`
- [x] Test với Host header: `curl -H "Host: license.snpdemo.com" http://127.0.0.1/health`
- [x] Response: `{"status":"ok","timestamp":"2025-12-10T15:23:56.154Z"}` ✓

---

### 8. ✅ Cấu hình Cloudflare DNS
- [x] Đăng nhập Cloudflare Dashboard
- [x] Add A record: `license.snpdemo.com` → `217.217.252.57`
- [x] Proxy status: DNS only (tắt proxy)
- [x] DNS Propagation: Thành công
- [x] Test nslookup: Resolve đúng IP `217.217.252.57` ✓
- [x] Test API: `curl http://license.snpdemo.com/health` → OK ✓

---

## 🔄 ĐANG LÀM - Bước hiện tại

### 9. ⏳ Setup SSL Certificate (ĐANG CHỜ)

**Mục tiêu:** Bảo mật kết nối với HTTPS (Let's Encrypt SSL miễn phí)

**Các bước thực hiện:**
1. Vào aaPanel web interface
2. Chọn website: `license.snpdemo.com`
3. Vào tab **SSL**
4. Chọn **Let's Encrypt**
5. Click **Apply** (sẽ tự động verify domain và install cert)
6. Bật **Force HTTPS** (redirect HTTP → HTTPS)
7. Save
8. Test: `curl https://license.snpdemo.com/health`

**Lưu ý:** Domain phải resolve được (đã OK ✓) thì Let's Encrypt mới verify thành công

---

## ⏸️ Chưa làm - Các bước tiếp theo

### 10. ⏸️ Cấu hình Email SMTP (Gmail)
- [ ] Vào Google Account: https://myaccount.google.com/apppasswords
- [ ] Tạo App Password mới
- [ ] Cập nhật file `.env`:
  ```env
  SMTP_USER=tan.nx2377@gmail.com
  SMTP_PASS=<app-password-vừa-tạo>
  ```
- [ ] Restart container:
  ```bash
  docker-compose -f docker-compose.simple.yml restart backend
  ```

### 11. ⏸️ Build và Deploy Frontend
- [ ] Build frontend React app:
  ```bash
  cd /opt/software_license/frontend
  npm install
  npm run build
  ```
- [ ] Deploy bằng 1 trong 2 cách:
  - **Option A:** Serve với nginx/serve trên VPS
  - **Option B:** Deploy lên Vercel/Netlify (free)

### 12. ⏸️ Security Hardening (Quan trọng!)
- [ ] Đổi `JWT_SECRET` trong `.env` thành chuỗi random mạnh
- [ ] Đăng nhập lần đầu và đổi password user `admin`
- [ ] Xoá hoặc disable các user test không dùng
- [ ] Setup firewall rules
- [ ] Setup backup tự động database

---

## 📝 Lệnh thường dùng

### Xem logs
```bash
docker logs -f software_license_api
```

### Restart backend
```bash
cd /opt/software_license
docker-compose -f docker-compose.simple.yml restart backend
```

### Update code từ Git
```bash
cd /opt/software_license
git pull
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build

# Nếu có migration mới
docker exec -it software_license_api npx prisma migrate deploy
```

### Backup database
```bash
docker exec software_license_db pg_dump -U license_admin software_license > backup_$(date +%Y%m%d).sql
```

### Vào database
```bash
docker exec -it software_license_db psql -U license_admin -d software_license
```

---

## 🆘 Troubleshooting

**Container không start:**
```bash
docker logs software_license_api
```

**Không kết nối database:**
```bash
docker exec software_license_db psql -U license_admin -d software_license -c "SELECT 1;"
```

**Port bị chiếm:**
```bash
lsof -i :3001
```

---

**Cập nhật lần cuối:** 2025-12-10
**Trạng thái:** Đang ở bước 5 - Chờ seed database
