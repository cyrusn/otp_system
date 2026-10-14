#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

LOCATION='otp_system'
DEST='root@calp'

ssh $DEST "mkdir -p ~/$LOCATION"

echo "🔄 Triggering remote app load and restart..."
ssh ${DEST} "bash -c 'cd ~/${LOCATION} && \
  chmod +x start.sh load.sh restart.sh && \
  ./restart.sh'"

echo "🎉 Deployment successful!"
