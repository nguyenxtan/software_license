#!/bin/bash

# Software License Management System - Deploy Script
# Usage: ./deploy.sh [frontend|backend|all]

set -e  # Exit on error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/software_license"
WEB_DIR="/www/wwwroot/license.snpdemo.com"

echo -e "${GREEN}=== Software License Deploy Script ===${NC}"
echo ""

# Default to 'all' if no argument provided
DEPLOY_TARGET=${1:-all}

# Navigate to project directory
cd $PROJECT_DIR

# Step 1: Pull latest code
echo -e "${YELLOW}[1/4] Pulling latest code from git...${NC}"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Deploy backend if needed
if [ "$DEPLOY_TARGET" == "backend" ] || [ "$DEPLOY_TARGET" == "all" ]; then
    echo -e "${YELLOW}[2/4] Rebuilding backend Docker container...${NC}"
    docker-compose build --no-cache backend
    docker-compose restart backend
    echo -e "${GREEN}✓ Backend deployed${NC}"
    echo ""
else
    echo -e "${YELLOW}[2/4] Skipping backend deployment${NC}"
    echo ""
fi

# Step 3: Build frontend
if [ "$DEPLOY_TARGET" == "frontend" ] || [ "$DEPLOY_TARGET" == "all" ]; then
    echo -e "${YELLOW}[3/4] Building frontend...${NC}"
    cd frontend

    # Check if node_modules exists, install if not
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    npm run build
    echo -e "${GREEN}✓ Frontend built${NC}"
    echo ""

    # Step 4: Deploy frontend files
    echo -e "${YELLOW}[4/4] Deploying frontend to web directory...${NC}"
    cp -r dist/* $WEB_DIR/
    echo -e "${GREEN}✓ Frontend deployed to $WEB_DIR${NC}"
    echo ""
else
    echo -e "${YELLOW}[3/4] Skipping frontend build${NC}"
    echo -e "${YELLOW}[4/4] Skipping frontend deployment${NC}"
    echo ""
fi

# Show status
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "Website: https://license.snpdemo.com"
echo ""
echo "Services status:"
docker-compose ps
echo ""
echo -e "${GREEN}Done! Test your website now.${NC}"
