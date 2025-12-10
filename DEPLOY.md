# Production Deployment Guide

## 📋 System Requirements

- VPS with Docker installed
- PostgreSQL database (existing or new)
- Domain with DNS access
- Web server (Nginx/aaPanel) for SSL and static files

---

## 🚀 Quick Deploy

### 1. Clone Repository

```bash
cd /opt
git clone https://github.com/nguyenxtan/software_license.git
cd software_license
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set your values:
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_PASSWORD=your-secure-password
JWT_SECRET=your-random-string
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FRONTEND_URL=https://your-domain.com
```

### 3. Deploy Backend

```bash
docker-compose up -d --build
```

### 4. Initialize Database

```bash
# Run migrations
docker exec -it software_license_api npx prisma migrate deploy

# Seed sample data (optional)
docker exec -it software_license_api node prisma/seed.js
```

### 5. Build Frontend

```bash
cd frontend
cp .env.example .env
nano .env  # Set VITE_API_URL=https://your-domain.com/api

cd ..
./build-frontend.sh
```

---

## 📖 Detailed Configuration

### Backend Setup

Backend runs on port 3001 in Docker container.

**Check Status:**
```bash
docker ps
docker logs -f software_license_api
curl http://localhost:3001/health
```

### Frontend Setup

Frontend is built as static files and served via Nginx/aaPanel.

**Configure Nginx:**
```nginx
location / {
    root /www/wwwroot/your-domain.com;
    try_files $uri $uri/ /index.html;
}

location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### SSL Certificate

Using Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

Or configure via aaPanel → SSL → Let's Encrypt.

---

## 🔄 Update Application

```bash
cd /opt/software_license
git pull
docker-compose down
docker-compose up -d --build
docker exec -it software_license_api npx prisma migrate deploy
./build-frontend.sh
```

---

## 💾 Backup

### Database Backup

```bash
# Backup
docker exec software_license_db pg_dump -U license_admin software_license > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i software_license_db psql -U license_admin software_license < backup.sql
```

### Automated Backup

Add to crontab:
```bash
0 2 * * * docker exec software_license_db pg_dump -U license_admin software_license > /backup/license_$(date +\%Y\%m\%d).sql
```

---

## 🐛 Troubleshooting

### Backend Connection Issues

```bash
# Check logs
docker logs software_license_api

# Verify database connection
docker exec -it software_license_api npx prisma db pull

# Check environment
docker exec software_license_api env | grep DATABASE_URL
```

### Frontend Not Loading

```bash
# Check files exist
ls -la /www/wwwroot/your-domain.com/

# Verify API connection
curl https://your-domain.com/api/health

# Check Nginx config
nginx -t
```

### Port Conflicts

```bash
# Check what's using port 3001
lsof -i :3001

# Change port in docker-compose.yml if needed
```

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to random secure string
- [ ] Use strong database password
- [ ] Enable SSL/HTTPS
- [ ] Change admin password after first login (admin/123456)
- [ ] Setup firewall (allow only 22, 80, 443, 3001)
- [ ] Regular backups
- [ ] Keep Docker images updated

---

## 📊 Monitoring

```bash
# Container status
docker ps

# Logs
docker logs -f software_license_api

# Resource usage
docker stats
```

---

## 📞 Default Credentials

- **Username:** admin
- **Password:** 123456

⚠️ **Change immediately after first login**

---

For client handover instructions, see [HANDOVER.md](HANDOVER.md)
