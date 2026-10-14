#!/bin/bash
echo "[Remote Deploy] Starting full service upgrade cycle..."

# 1. Load the new Docker image
./load.sh

# 2. Stop existing container if running
echo "[Remote Deploy] Stopping old container..."
docker stop otp-system || true

# 3. Remove old container
echo "[Remote Deploy] Removing old container..."
docker rm otp-system || true

# 4. Spawn new container using start.sh
./start.sh

# 5. Clean up stale Docker resources to free disk space
echo "[Remote Deploy] Cleaning up build caches and dangling images..."
docker container prune -f
docker image prune -a -f

echo "[Remote Deploy] Service upgrade cycle completed successfully! 🚀"
