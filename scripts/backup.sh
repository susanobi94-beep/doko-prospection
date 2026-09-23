#!/bin/sh
set -e

# Backup script for Doko Prospection Postgres Database
# Usage: ./scripts/backup.sh
# Can be scheduled via cron or Coolify container

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/doko_prospection_${TIMESTAMP}.sql.gz"

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL is not set."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup completed successfully: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retention policy: remove backups older than RETENTION_DAYS
echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "doko_prospection_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[$(date)] All done."
