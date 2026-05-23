#!/bin/bash

# ─── CONFIG ───────────────────────────────────────────────────────────────────
BACKUP_DIR="/home/bostonclub/backups"
DB_CONTAINER="bostonclub-db-1"
DB_NAME="bostonclub"
DB_USER="postgres"
RETENTION_DAYS=7
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="bostonclub_$DATE.sql.gz"
# ──────────────────────────────────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup: $FILENAME"

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup exitoso: $BACKUP_DIR/$FILENAME ($(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1))"
else
  echo "[$(date)] ERROR: Fallo el backup" >&2
  exit 1
fi

# Borrar backups más viejos que RETENTION_DAYS días
find "$BACKUP_DIR" -name "bostonclub_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backups viejos eliminados (>$RETENTION_DAYS días)"

echo "[$(date)] Backups disponibles:"
ls -lh "$BACKUP_DIR"
