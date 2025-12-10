#!/bin/bash

# Script cài đặt tự động cho Hệ thống Quản lý Bản quyền Phần mềm
# Hỗ trợ macOS và Linux

set -e

echo "=========================================="
echo "Hệ thống Quản lý Bản quyền Phần mềm"
echo "Script Cài đặt Tự động"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check prerequisites
echo "Bước 1: Kiểm tra các yêu cầu hệ thống..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    success "Node.js đã cài đặt: $NODE_VERSION"
else
    error "Node.js chưa được cài đặt"
    info "Vui lòng cài đặt Node.js >= 18.x từ https://nodejs.org"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    success "npm đã cài đặt: $NPM_VERSION"
else
    error "npm chưa được cài đặt"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    PG_VERSION=$(psql --version)
    success "PostgreSQL đã cài đặt: $PG_VERSION"
else
    warning "PostgreSQL chưa được cài đặt"
    echo ""
    read -p "Bạn có muốn tiếp tục? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Step 2: Create database
echo "Bước 2: Tạo database..."
echo ""

DB_NAME="software_license"

if command_exists psql; then
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        warning "Database '$DB_NAME' đã tồn tại"
        read -p "Bạn có muốn xóa và tạo lại? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb "$DB_NAME" 2>/dev/null || true
            createdb "$DB_NAME"
            success "Database đã được tạo lại"
        fi
    else
        createdb "$DB_NAME"
        success "Database '$DB_NAME' đã được tạo"
    fi
else
    warning "Bỏ qua việc tạo database tự động"
    info "Vui lòng tạo database thủ công: createdb $DB_NAME"
fi

echo ""

# Step 3: Setup Backend
echo "Bước 3: Cài đặt Backend..."
echo ""

cd backend

# Create .env if not exists
if [ ! -f .env ]; then
    info "Tạo file .env từ template..."
    cp .env.example .env

    # Get current user
    CURRENT_USER=$(whoami)

    # Update DATABASE_URL with detected user
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/user:password/$CURRENT_USER:postgres/" .env
    else
        # Linux
        sed -i "s/user:password/$CURRENT_USER:postgres/" .env
    fi

    success "File .env đã được tạo"
    warning "Vui lòng kiểm tra và cập nhật thông tin trong file backend/.env"
else
    info "File .env đã tồn tại, bỏ qua..."
fi

# Install dependencies
info "Đang cài đặt dependencies..."
npm install

success "Dependencies đã được cài đặt"

# Generate Prisma Client
info "Đang generate Prisma Client..."
npx prisma generate

success "Prisma Client đã được generate"

# Run migrations
info "Đang chạy database migrations..."
npx prisma migrate dev --name init

success "Migrations đã hoàn tất"

# Seed database
read -p "Bạn có muốn seed dữ liệu mẫu? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "Đang seed dữ liệu mẫu..."
    node prisma/seed.js
    success "Dữ liệu mẫu đã được thêm vào database"
fi

cd ..

echo ""

# Step 4: Setup Frontend
echo "Bước 4: Cài đặt Frontend..."
echo ""

cd frontend

# Install dependencies
info "Đang cài đặt dependencies..."
npm install

success "Frontend dependencies đã được cài đặt"

cd ..

echo ""

# Step 5: Final instructions
echo "=========================================="
echo -e "${GREEN}✓ Cài đặt hoàn tất!${NC}"
echo "=========================================="
echo ""

echo "🚀 Để khởi động hệ thống:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "=========================================="
echo ""

echo "📝 Thông tin đăng nhập mặc định:"
echo ""
echo "  Username: admin"
echo "  Password: 123456"
echo ""

echo "🌐 URLs:"
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  Prisma:   npx prisma studio (trong thư mục backend)"
echo ""

echo "=========================================="
echo ""

echo "📚 Tài liệu hướng dẫn:"
echo ""
echo "  - README.md         : Tổng quan"
echo "  - SETUP.md          : Hướng dẫn chi tiết"
echo "  - QUICK_START.md    : Khởi động nhanh"
echo "  - PROJECT_SUMMARY.md: Tổng kết dự án"
echo "  - STRUCTURE.md      : Cấu trúc dự án"
echo ""

warning "Lưu ý quan trọng:"
echo "  1. Cập nhật thông tin database trong backend/.env"
echo "  2. Cấu hình SMTP email nếu muốn gửi thông báo tự động"
echo "  3. Thay đổi JWT_SECRET trong production"
echo ""

success "Chúc bạn sử dụng thành công!"
echo ""
