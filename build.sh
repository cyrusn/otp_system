#!/bin/bash
echo "[Build] Compiling otp-system Docker image for linux/amd64..."
docker buildx build --platform linux/amd64 -t cyrusn/otp-system:latest .

echo "[Build] Saving image to app.tar..."
docker save -o app.tar cyrusn/otp-system:latest

echo "[Build] Finished packaging. Ready to sync!"
