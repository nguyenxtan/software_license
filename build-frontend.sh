#!/bin/bash
# Build Frontend Script - Dùng Docker để build, deploy vào aaPanel

set -e

echo "🚀 Building frontend with Docker..."

cd "$(dirname "$0")/frontend"

# Tạo .env nếu chưa có
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit frontend/.env to set correct VITE_API_URL"
    exit 1
fi

# Build bằng Docker
echo "📦 Running npm install and build..."
docker run --rm \
  -v "$(pwd)":/app \
  -w /app \
  node:18-alpine \
  sh -c "npm ci && npm run build"

echo "✅ Build completed! Files in ./frontend/dist"

# Deploy vào aaPanel web root (nếu tồn tại)
WEBROOT="/www/wwwroot/license.snpdemo.com"
if [ -d "$WEBROOT" ]; then
    echo "📋 Deploying to $WEBROOT..."
    rm -rf "$WEBROOT"/*
    cp -r dist/* "$WEBROOT/"
    echo "✅ Deployed to aaPanel web root"
    echo "🌐 Access: https://license.snpdemo.com"
else
    echo "⚠️  Web root $WEBROOT not found"
    echo "📂 Built files are in: $(pwd)/dist"
    echo "   Manually copy to your web server"
fi

echo ""
echo "🎉 Frontend build completed successfully!"
