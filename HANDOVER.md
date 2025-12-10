# Hướng dẫn Bàn giao cho Công ty

## 📦 Package bàn giao

### 1. Source Code
- Repository: https://github.com/your-company/software-license-system
- Hoặc file zip: `software-license-system.zip`

### 2. Database
- Container image: `license_db_backup.tar` (nếu có data demo)
- Hoặc SQL dump: `initial_data.sql`

### 3. Documentation
- README.md - Tổng quan
- DEPLOY.md - Hướng dẫn deploy
- QUICK_START.md - Hướng dẫn sử dụng
- API Documentation - Danh sách API endpoints

---

## 🚀 Hướng dẫn Công ty Deploy

### Yêu cầu hệ thống

**Tối thiểu:**
- Server: 2 CPU cores, 4GB RAM, 20GB disk
- OS: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Docker & Docker Compose
- Ports: 5432 (DB), 3001 (API), 80/443 (Web)

**Khuyến nghị Production:**
- Server: 4 CPU cores, 8GB RAM, 50GB SSD
- Backup storage: 50GB+
- SSL certificate
- Domain name

---

## 📝 Các bước deploy đơn giản

### Option 1: Deploy bằng Docker Compose (Đơn giản nhất)

```bash
# Bước 1: Clone project
git clone https://github.com/your-company/software-license-system.git
cd software-license-system

# Bước 2: Tạo file cấu hình
cp .env.production .env
nano .env  # Chỉnh sửa các thông tin

# Bước 3: Start tất cả services (1 lệnh!)
docker-compose up -d

# Bước 4: Xem logs để kiểm tra
docker-compose logs -f

# XONG! Truy cập http://your-server-ip:3001
```

### Option 2: Deploy lên Cloud Provider

#### AWS:
- RDS PostgreSQL (database)
- EC2 hoặc ECS (backend)
- S3 + CloudFront (frontend)

#### Azure:
- Azure Database for PostgreSQL
- App Service (backend)
- Static Web Apps (frontend)

#### Google Cloud:
- Cloud SQL PostgreSQL
- Cloud Run (backend)
- Firebase Hosting (frontend)

**Chỉ cần đổi `DATABASE_URL` trong .env!**

---

## 🔧 Cấu hình cần thiết

### File `.env` (Quan trọng!)

```env
# Database - THAY ĐỔI PASSWORD!
DB_PASSWORD=THAY_PASSWORD_NAY_NGAY

# JWT - THAY ĐỔI SECRET!
JWT_SECRET=THAY_SECRET_NAY_BANG_STRING_RANDOM

# Email - Cấu hình SMTP của công ty
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email-cong-ty@company.com
SMTP_PASS=mat-khau-email
EMAIL_FROM="Hệ thống IT <noreply@company.com>"

# URL
FRONTEND_URL=http://domain-cong-ty.com
```

### Cấu hình Email

**Nếu dùng Gmail:**
1. Bật 2-factor authentication
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Dùng App Password trong `SMTP_PASS`

**Nếu dùng Email Server công ty:**
- Hỏi IT về: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

---

## 👥 Tài khoản mặc định

**Admin:**
- Username: `admin`
- Password: `123456`

⚠️ **BẮT BUỘC đổi password ngay sau khi đăng nhập lần đầu!**

---

## 📊 Quản lý hệ thống

### Các lệnh thường dùng

```bash
# Xem logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Stop tất cả
docker-compose down

# Start lại
docker-compose up -d

# Backup database
docker exec software_license_db pg_dump -U license_admin software_license > backup.sql

# Update code
git pull
docker-compose down
docker-compose up -d --build
```

### Truy cập database

```bash
# Qua command line
docker exec -it software_license_db psql -U license_admin -d software_license

# Qua pgAdmin (nếu đã cài)
# Host: localhost
# Port: 5433
# User: license_admin
# Database: software_license
```

---

## 🔒 Bảo mật Production

### Checklist bắt buộc:

- [ ] Đổi `DB_PASSWORD` thành password mạnh
- [ ] Đổi `JWT_SECRET` thành chuỗi random dài
- [ ] Đổi password user `admin` sau lần đăng nhập đầu
- [ ] Setup SSL/HTTPS (Let's Encrypt miễn phí)
- [ ] Chỉ mở ports cần thiết trên firewall
- [ ] Backup tự động hàng ngày
- [ ] Giới hạn IP truy cập pgAdmin/database
- [ ] Cấu hình log rotation
- [ ] Monitor disk space

### Setup SSL với Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renew
sudo certbot renew --dry-run
```

---

## 💾 Backup & Recovery

### Backup tự động (Khuyến nghị)

**Tạo cron job:**
```bash
# Chỉnh sửa crontab
crontab -e

# Thêm dòng này (backup hàng ngày lúc 2h sáng)
0 2 * * * docker exec software_license_db pg_dump -U license_admin software_license > /backup/license_$(date +\%Y\%m\%d).sql
```

### Restore từ backup

```bash
# Restore SQL file
docker exec -i software_license_db psql -U license_admin software_license < backup_20250110.sql
```

---

## 📈 Monitoring

### Kiểm tra sức khỏe hệ thống

```bash
# Health check endpoint
curl http://localhost:3001/health

# Xem resource usage
docker stats

# Kiểm tra disk space
df -h
```

### Cảnh báo khi hệ thống có vấn đề

Có thể tích hợp:
- Uptime monitoring: UptimeRobot, Pingdom
- Log management: ELK Stack, Datadog
- Alert: Email, Slack, Teams

---

## 🆘 Troubleshooting

### Lỗi thường gặp

**1. Backend không kết nối được database**
```bash
# Kiểm tra database running
docker ps | grep postgres

# Test connection
docker exec software_license_db psql -U license_admin -d software_license -c "SELECT 1;"

# Kiểm tra DATABASE_URL trong .env
```

**2. Email không gửi được**
```bash
# Xem logs
docker logs software_license_api | grep -i email

# Test SMTP
telnet smtp.gmail.com 587
```

**3. Port đã bị chiếm**
```bash
# Kiểm tra port
sudo lsof -i :3001

# Đổi port trong docker-compose.yml
```

---

## 📞 Liên hệ Support

**Trong quá trình demo:**
- Email: your-email@demo.com
- Phone: +84 xxx xxx xxx

**Sau khi bàn giao:**
- Documentation: Xem các file .md trong project
- Issues: GitHub Issues
- Wiki: GitHub Wiki

---

## 📋 Checklist bàn giao

### Người giao (Bạn):
- [ ] Source code đã push lên repository
- [ ] Documentation đầy đủ
- [ ] Backup database demo (nếu có)
- [ ] Credentials mặc định được document
- [ ] Hướng dẫn deploy đã test trên môi trường sạch

### Người nhận (Công ty):
- [ ] Đã clone được source code
- [ ] Đã chạy được bằng docker-compose
- [ ] Đã đổi các credentials mặc định
- [ ] Đã cấu hình email thành công
- [ ] Đã test các chức năng chính
- [ ] Đã setup backup tự động
- [ ] Đã cấu hình monitoring

---

## 🎯 Tóm tắt cho IT Manager

**Hệ thống này:**
- ✅ Chạy trên Docker → Deploy đơn giản, không phụ thuộc OS
- ✅ Database PostgreSQL → Có thể dùng managed service (AWS RDS, Azure...)
- ✅ Backend Node.js → Nhẹ, ít resource
- ✅ Toàn bộ chỉ cần 1 lệnh: `docker-compose up -d`
- ✅ Dễ scale: Thêm replicas, load balancer
- ✅ Dễ backup: Export SQL hoặc snapshot volume

**Chi phí ước tính:**
- VPS nhỏ (demo): $5-10/tháng
- VPS production: $20-50/tháng
- Managed database: $15-100/tháng (tuỳ scale)

**Thời gian deploy:**
- Từ zero → running: 15-30 phút
- Update code: 2-5 phút

---

Chúc công ty triển khai thành công! 🎉
