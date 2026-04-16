#!/bin/bash

# NEPSE Stock Dashboard V2 - Restore Script
# Usage: ./scripts/restore.sh [timestamp]
# Example: ./scripts/restore.sh 20260416_143022

PROJECT_DIR="/Users/thisdevice/Documents/nepse-stockmarket-v2"
BACKUP_DIR="$PROJECT_DIR/.backup"

if [ -z "$1" ]; then
    echo "=== Available Backups ==="
    find "$BACKUP_DIR/code" -name "*.tar.gz" | sort -r | head -10
    echo ""
    echo "Usage: ./scripts/restore.sh [timestamp]"
    echo "Example: ./scripts/restore.sh 20260416_143022"
    exit 1
fi

TIMESTAMP="$1"
echo "=== Restoring from backup: $TIMESTAMP ==="

# Restore code
BACKUP_FILE=$(find "$BACKUP_DIR/code" -name "${TIMESTAMP}.tar.gz" | head -1)
if [ -n "$BACKUP_FILE" ]; then
    echo "Restoring code from $BACKUP_FILE..."
    tar -xzf "$BACKUP_FILE" -C "$PROJECT_DIR"
    echo "Code restored."
else
    echo "ERROR: Backup file not found: ${TIMESTAMP}.tar.gz"
    exit 1
fi

# Restore database if backup exists
DB_FILE=$(find "$BACKUP_DIR/db" -name "nepse_${TIMESTAMP}.db" | head -1)
if [ -n "$DB_FILE" ]; then
    echo "Restoring database..."
    cp "$DB_FILE" "$PROJECT_DIR/data/nepse.db"
    echo "Database restored."
else
    echo "WARNING: Database backup not found, skipping..."
fi

echo "=== Restore Complete ==="
echo "Please reinstall dependencies and restart the application."