#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/kanwu-data-analyst-cv}"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/kanwu-backups}"
SERVICE_NAME="${SERVICE_NAME:-kanwu-cv}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="${BACKUP_DIR}/kanwu-data-${STAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"

if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet "${SERVICE_NAME}"; then
  sudo systemctl stop "${SERVICE_NAME}"
  trap 'sudo systemctl start "${SERVICE_NAME}" >/dev/null 2>&1 || true' EXIT
fi

tar -C "${APP_DIR}" -czf "${ARCHIVE}" .data .env
chmod 600 "${ARCHIVE}"

find "${BACKUP_DIR}" -name "kanwu-data-*.tar.gz" -type f -mtime "+${KEEP_DAYS}" -delete

echo "Backup created: ${ARCHIVE}"
