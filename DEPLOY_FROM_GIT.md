# Deploy từ Git Repository

## 📋 Sau khi push code lên GitHub/GitLab

### Bước 1: Clone project trên VPS

```bash
# SSH vào VPS
ssh root@217.217.252.57

# Clone project
cd /opt
git clone https://github.com/YOUR_USERNAME/software-license-system.git
cd software-license-system
```

---

### Bước 2: Tạo file .env

```bash
cat > .env << 'EOF'
# Database
DB_PASSWORD=LicenseDemo@2025

# JWT
JWT_SECRET=change_this_to_random_secure_string_in_production

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="Hệ thống quản lý bản quyền <noreply@yourcompany.com>"

# Frontend URL
FRONTEND_URL=http://217.217.252.57:5173

# Notifications
ENABLE_AUTO_NOTIFICATIONS=true
EOF
```

---

### Bước 3: Deploy bằng Docker Compose

#### Option A: Deploy với compose đơn giản (dùng DB container có sẵn)

```bash
# Build và start backend
docker-compose -f docker-compose.simple.yml up -d --build

# Xem logs
docker-compose -f docker-compose.simple.yml logs -f backend
```

#### Option B: Deploy toàn bộ (tạo container DB mới)

```bash
# Stop và remove container DB cũ
docker stop software_license_db
docker rm software_license_db

# Start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

---

### Bước 4: Init database (chỉ lần đầu tiên)

```bash
# Đợi backend container start xong (~30s)
sleep 30

# Vào container
docker exec -it software_license_api sh

# Chạy migrations
npx prisma migrate deploy

# Seed dữ liệu mẫu
node prisma/seed.js

# Exit
exit
```

---

### Bước 5: Kiểm tra

```bash
# Health check từ VPS
curl http://localhost:3001/health

# Kết quả mong đợi:
# {"status":"ok","timestamp":"2025-01-10T..."}

# Check từ bên ngoài
curl http://217.217.252.57:3001/health
```

---

### Bước 6: Kiểm tra containers

```bash
docker ps

# Kết quả mong đợi:
# software_license_api    Up X minutes
# software_license_db     Up X minutes (nếu dùng docker-compose.yml)
```

---

## 🔄 Update code sau này

```bash
# SSH vào VPS
ssh root@217.217.252.57
cd /opt/software-license-system

# Pull code mới
git pull

# Rebuild và restart
docker-compose down
docker-compose up -d --build

# Chạy migration nếu có thay đổi schema
docker exec -it software_license_api npx prisma migrate deploy
```

---

## 🌐 Access URLs

- **Backend API**: http://217.217.252.57:3001
- **Health check**: http://217.217.252.57:3001/health
- **Frontend**: Cần build và deploy riêng (xem bên dưới)

---

## 🎨 Deploy Frontend (Optional)

### Option 1: Build và serve trên VPS

```bash
cd frontend
npm install
npm run build

# Serve với nginx hoặc serve
npm install -g serve
serve -s dist -l 5173
```

### Option 2: Thêm vào docker-compose.yml

Uncomment phần `frontend` service trong `docker-compose.yml`

---

## 🔐 Bảo mật Production

Sau khi deploy xong, nhớ:

1. **Đổi passwords:**
   ```bash
   # Login với admin/123456
   # Vào Settings → Đổi password ngay
   ```

2. **Đổi JWT_SECRET:**
   ```bash
   nano .env
   # Đổi JWT_SECRET thành chuỗi random
   docker-compose restart backend
   ```

3. **Setup firewall (nếu chưa):**
   ```bash
   # Allow ports
   ufw allow 22      # SSH
   ufw allow 80      # HTTP
   ufw allow 443     # HTTPS
   ufw allow 3001    # Backend API
   ufw allow 5173    # Frontend
   ufw enable
   ```

4. **Setup SSL với Let's Encrypt:**
   ```bash
   # Cài certbot
   apt install certbot nginx

   # Get certificate
   certbot --nginx -d your-domain.com
   ```

---

## 🐛 Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
docker logs software_license_api

# Xem logs database
docker logs software_license_db
```

### Không kết nối được database

```bash
# Test connection
docker exec software_license_db psql -U license_admin -d software_license -c "SELECT 1;"

# Kiểm tra DATABASE_URL
docker exec software_license_api env | grep DATABASE_URL
```

### Migration lỗi

```bash
# Xem chi tiết
docker exec -it software_license_api npx prisma migrate status

# Force deploy
docker exec -it software_license_api npx prisma migrate deploy --force
```

---

## 📞 Login mặc định

- **Username**: admin
- **Password**: 123456

⚠️ **Đổi ngay sau khi đăng nhập lần đầu!**

---

Chúc bạn deploy thành công! 🚀
