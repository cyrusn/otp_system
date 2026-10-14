#!/bin/bash

LOCATION='otp_system'
DEST='root@calp'

echo "[Sync] Making directory on server..."
ssh $DEST "mkdir -p ~/$LOCATION"

echo "[Sync] Syncing app.tar and server control scripts to $DEST..."
rsync -rvv app.tar load.sh restart.sh start.sh init-db.sh .env.production $DEST:~/$LOCATION/

echo "[Sync] Sync finished!"
