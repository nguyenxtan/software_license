# Hướng dẫn Deploy lên VPS

## 📋 Yêu cầu
- VPS có Docker & Docker Compose
- Port mở: 5433 (PostgreSQL), 3001 (Backend API), 5173 (Frontend)
- Git

---

## 🚀 Deploy bằng Docker Compose (Khuyến nghị)

### Bước 1: Chuẩn bị VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (nếu chưa có)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Verify
docker --version
docker-compose --version
```

### Bước 2: Clone project

```bash
# Clone từ GitHub (hoặc upload code lên VPS)
cd /opt
sudo git clone https://github.com/your-repo/software-license-system.git
cd software-license-system

# Hoặc upload bằng rsync
# rsync -avz --exclude 'node_modules' ./ user@vps:/opt/software-license-system/
```

### Bước 3: Cấu hình environment

```bash
# Copy file env
cp .env.production .env

# Chỉnh sửa
nano .env
```

**Cập nhật các giá trị:**
```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_random_secret_string
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://your-vps-ip:5173
```

### Bước 4: Start services

```bash
# Start all services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Kiểm tra status
docker-compose ps
```

### Bước 5: Init database (chỉ lần đầu)

```bash
# Vào backend container
docker exec -it software_license_api sh

# Chạy migrations
npx prisma migrate deploy

# Seed data mẫu (optional)
node prisma/seed.js

# Exit
exit
```

### Bước 6: Truy cập

- **Backend API**: http://your-vps-ip:3001
- **Health check**: http://your-vps-ip:3001/health
- **Frontend**: Chạy riêng (xem phần dưới)

**Login mặc định:**
- Username: `admin`
- Password: `123456`

---

## 🔧 Deploy thủ công (Không dùng Docker Compose)

### Backend

```bash
# 1. Tạo PostgreSQL container
docker run -d \
  --name software_license_db \
  -e POSTGRES_USER=license_admin \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=software_license \
  -p 5433:5432 \
  -v software_license_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15-alpine

# 2. Setup backend
cd backend
npm install

# 3. Tạo file .env
cat > .env << EOF
DATABASE_URL="postgresql://license_admin:your_password@localhost:5433/software_license?schema=public"
PORT=3001
NODE_ENV=production
JWT_SECRET=your_secret
# ... thêm các biến khác
EOF

# 4. Run migrations
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js

# 5. Start backend với PM2
npm install -g pm2
pm2 start src/index.js --name software-license-api
pm2 save
pm2 startup
```

### Frontend

```bash
cd frontend

# Build production
npm install
npm run build

# Serve với Nginx hoặc serve package
npm install -g serve
pm2 start "serve -s dist -l 5173" --name software-license-web
pm2 save
```

---

## 🔒 Cấu hình Nginx (Optional - để dùng domain)

```nginx
# /etc/nginx/sites-available/software-license

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/software-license /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📦 Backup & Restore

### Backup Database

```bash
# Backup toàn bộ database
docker exec software_license_db pg_dump -U license_admin software_license > backup_$(date +%Y%m%d).sql

# Hoặc backup container
docker commit software_license_db license_db_backup
docker save license_db_backup > license_db_backup.tar
```

### Restore Database

```bash
# Restore từ SQL file
docker exec -i software_license_db psql -U license_admin software_license < backup_20250110.sql

# Hoặc restore container
docker load < license_db_backup.tar
docker run -d --name software_license_db ... license_db_backup
```

---

## 🔄 Update Code

```bash
# Pull code mới
cd /opt/software-license-system
git pull

# Rebuild và restart
docker-compose down
docker-compose up -d --build

# Chạy migration nếu có thay đổi schema
docker exec -it software_license_api npx prisma migrate deploy
```

---

## 🐛 Troubleshooting

### Backend không start được

```bash
# Xem logs
docker logs software_license_api

# Kiểm tra database connection
docker exec -it software_license_db psql -U license_admin -d software_license -c "SELECT 1;"
```

### Port đã bị sử dụng

```bash
# Kiểm tra port
sudo lsof -i :3001
sudo lsof -i :5433

# Đổi port trong docker-compose.yml hoặc .env
```

### Migration lỗi

```bash
# Reset migrations (CHỈ dùng khi development!)
docker exec -it software_license_api npx prisma migrate reset

# Production: Xem log chi tiết
docker exec -it software_license_api npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## 📊 Monitoring

```bash
# Xem logs realtime
docker-compose logs -f

# Chỉ xem backend logs
docker logs -f software_license_api

# Chỉ xem database logs
docker logs -f software_license_db

# Kiểm tra resource usage
docker stats
```

---

## 🔐 Security Checklist

- [ ] Đổi password database mặc định
- [ ] Đổi JWT_SECRET
- [ ] Đổi password user admin
- [ ] Setup firewall (chỉ mở port cần thiết)
- [ ] Cấu hình SSL/TLS (Let's Encrypt)
- [ ] Backup tự động hàng ngày
- [ ] Update Docker images thường xuyên

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker-compose logs`
2. Database connection: `docker exec -it software_license_db psql -U license_admin`
3. Health check: `curl http://localhost:3001/health`
4. Environment variables: `docker exec software_license_api env`

---

Chúc bạn deploy thành công! 🚀
