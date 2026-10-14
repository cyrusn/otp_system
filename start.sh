#!/bin/bash
echo "[Remote Start] Launching otp-system container..."

# Create database data folder on host if not exists
mkdir -p ./data

docker run -d \
  --name otp-system \
  --restart unless-stopped \
  -p 127.0.0.1:4494:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env.production \
  -e BASE_PATH=/otp \
  cyrusn/otp-system:latest

echo "[Remote Start] Container is running on port 4494!"
