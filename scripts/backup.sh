#!/bin/bash

# NEPSE Stock Dashboard V2 - Backup Script
# Run this manually or set up in cron

PROJECT_DIR="/Users/thisdevice/Documents/nepse-stockmarket-v2"
BACKUP_DIR="$PROJECT_DIR/.backup"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y%m%d")

echo "=== NEPSE Dashboard Backup ==="
echo "Timestamp: $TIMESTAMP"

# Create backup directories
mkdir -p "$BACKUP_DIR/code/$DATE"
mkdir -p "$BACKUP_DIR/db"
mkdir -p "$BACKUP_DIR/config"

# Backup code files
echo "Backing up code..."
tar -czf "$BACKUP_DIR/code/$DATE/$TIMESTAMP.tar.gz" \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='.git' \
    -C "$PROJECT_DIR" \
    backend app core config tests scripts data .backup IMPLEMENTATION_PLAN.md README.md PROJECT_PLAN.md QUICK_START.md requirements.txt 2>/dev/null

# Backup database if exists
if [ -f "$PROJECT_DIR/data/nepse.db" ]; then
    echo "Backing up database..."
    cp "$PROJECT_DIR/data/nepse.db" "$BACKUP_DIR/db/nepse_$TIMESTAMP.db"
fi

# Backup config
if [ -f "$PROJECT_DIR/backend/.env" ]; then
    echo "Backing up config..."
    cp "$PROJECT_DIR/backend/.env" "$BACKUP_DIR/config/.env_$TIMESTAMP"
fi

# Cleanup old backups (keep last 7 days of code, 30 days of database)
find "$BACKUP_DIR/code" -type f -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR/db" -type f -mtime +30 -delete 2>/dev/null

echo "=== Backup Complete ==="
echo "Backup saved to: $BACKUP_DIR/code/$DATE/$TIMESTAMP.tar.gz"