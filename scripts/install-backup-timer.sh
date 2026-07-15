#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/kanwu-data-analyst-cv}"
SERVICE_FILE="/etc/systemd/system/kanwu-backup.service"
TIMER_FILE="/etc/systemd/system/kanwu-backup.timer"

sudo cp "${APP_DIR}/deployment/systemd/kanwu-backup.service" "${SERVICE_FILE}"
sudo cp "${APP_DIR}/deployment/systemd/kanwu-backup.timer" "${TIMER_FILE}"
sudo systemctl daemon-reload
sudo systemctl enable --now kanwu-backup.timer
sudo systemctl list-timers --all | grep kanwu-backup || true

echo "Daily backup timer installed."
