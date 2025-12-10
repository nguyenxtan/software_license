# Frontend Deployment Guide

## 🎯 Deploy Frontend trên VPS với aaPanel

### Bước 1: Tạo file .env

```bash
cd /opt/software_license/frontend
cp .env.example .env
nano .env
```

Sửa URL cho đúng domain:
```env
VITE_API_URL=https://license.snpdemo.com/api
```

### Bước 2: Build và Deploy (1 lệnh)

```bash
cd /opt/software_license
./build-frontend.sh
```

Script sẽ tự động:
- Build frontend bằng Docker
- Copy files vào `/www/wwwroot/license.snpdemo.com/`
- Hoàn tất!

### Bước 3: Cấu hình Nginx trên aaPanel

Vào aaPanel → Website `license.snpdemo.com` → **Config**

Đảm bảo có cấu hình này:

```nginx
location / {
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

Save và Reload Nginx.

### Bước 4: Test

Truy cập: https://license.snpdemo.com

Đăng nhập với:
- Username: `admin`
- Password: `123456`

---

## 🔄 Update Frontend sau này

```bash
cd /opt/software_license
git pull
./build-frontend.sh
```

Xong! 🎉

---

## 🐛 Troubleshooting

**Lỗi: "Cannot find module"**
- Xóa node_modules và build lại:
  ```bash
  cd frontend
  rm -rf node_modules dist
  cd ..
  ./build-frontend.sh
  ```

**Lỗi: "API connection failed"**
- Check VITE_API_URL trong frontend/.env
- Test API: `curl https://license.snpdemo.com/api/health`

**Blank page / 404**
- Check Nginx config có `try_files $uri $uri/ /index.html;`
- Check file permissions: `ls -la /www/wwwroot/license.snpdemo.com/`
