#!/bin/bash
# JAC VPS Management Script v2.0
# Standalone - No Lovable dependency
# Usage: /opt/jac-deploy/manage.sh {deploy|backup|list|restore|schedule|status}

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/justachat}"
BACKUP_DIR="${BACKUP_DIR:-/backups/justachat}"
CRON_FILE="/etc/cron.d/jac-backup"

case "$1" in
  deploy)
    echo "=== Deploying from GitHub ==="
    cd $DEPLOY_DIR
    git fetch origin main
    git reset --hard origin/main
    npm install --legacy-peer-deps
    npm run build
    echo "✓ Deploy complete!"
    ;;
    
  backup)
    echo "=== Creating Backup ==="
    TIMESTAMP=$(date +%Y%m%dT%H%M%S)
    mkdir -p $BACKUP_DIR
    cd $DEPLOY_DIR
    tar -czf $BACKUP_DIR/justachat-${TIMESTAMP}.tar.gz --exclude='node_modules' --exclude='.git' .
    # Keep only last 10 backups
    cd $BACKUP_DIR && ls -t *.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm --
    echo "✓ Backup saved: justachat-${TIMESTAMP}.tar.gz"
    ;;
    
  list)
    echo "=== Available Backups ==="
    if [ -d "$BACKUP_DIR" ]; then
      ls -lh $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No backups found"
    else
      echo "Backup directory not found: $BACKUP_DIR"
    fi
    ;;
    
  restore)
    if [ -z "$2" ]; then
      echo "Usage: $0 restore <filename>"
      echo ""
      echo "Available backups:"
      ls $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No backups found"
      exit 1
    fi
    BACKUP_FILE="$BACKUP_DIR/$2"
    if [ ! -f "$BACKUP_FILE" ]; then
      echo "Error: Backup file not found: $BACKUP_FILE"
      exit 1
    fi
    echo "=== Creating safety backup first ==="
    TIMESTAMP=$(date +%Y%m%dT%H%M%S)
    cd $DEPLOY_DIR
    tar -czf $BACKUP_DIR/pre-restore-${TIMESTAMP}.tar.gz --exclude='node_modules' --exclude='.git' .
    echo "=== Restoring from $2 ==="
    tar -xzf $BACKUP_FILE -C $DEPLOY_DIR
    npm install --legacy-peer-deps
    npm run build
    echo "✓ Restore complete!"
    ;;
    
  schedule)
    FREQ="${2:-daily}"
    case "$FREQ" in
      hourly)
        echo "0 * * * * root /opt/jac-deploy/manage.sh backup >> /var/log/jac-backup.log 2>&1" > $CRON_FILE
        echo "✓ Backup scheduled: hourly"
        ;;
      daily)
        echo "0 2 * * * root /opt/jac-deploy/manage.sh backup >> /var/log/jac-backup.log 2>&1" > $CRON_FILE
        echo "✓ Backup scheduled: daily at 2am"
        ;;
      weekly)
        echo "0 3 * * 0 root /opt/jac-deploy/manage.sh backup >> /var/log/jac-backup.log 2>&1" > $CRON_FILE
        echo "✓ Backup scheduled: weekly on Sunday at 3am"
        ;;
      disable|off)
        rm -f $CRON_FILE
        echo "✓ Backup schedule disabled"
        ;;
      *)
        echo "Usage: $0 schedule {hourly|daily|weekly|disable}"
        exit 1
        ;;
    esac
    chmod 644 $CRON_FILE 2>/dev/null
    ;;
    
  status)
    echo "=== JAC VPS Status ==="
    echo ""
    echo "Version: $(grep 'VERSION' $DEPLOY_DIR/src/lib/version.ts 2>/dev/null | head -1 || echo 'Unknown')"
    echo "Commit:  $(cd $DEPLOY_DIR && git log -1 --format='%h - %s (%cr)' 2>/dev/null || echo 'Unknown')"
    echo ""
    echo "Last backup: $(ls -t $BACKUP_DIR/*.tar.gz 2>/dev/null | head -1 || echo 'None')"
    echo "Total backups: $(ls $BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)"
    echo ""
    if [ -f "$CRON_FILE" ]; then
      echo "Backup schedule: $(cat $CRON_FILE | grep -oE '(hourly|daily|weekly)' || echo 'custom')"
    else
      echo "Backup schedule: disabled"
    fi
    echo ""
    echo "Services:"
    systemctl is-active --quiet nginx && echo "  nginx: ✓ running" || echo "  nginx: ✗ stopped"
    systemctl is-active --quiet jac-deploy && echo "  jac-deploy: ✓ running" || echo "  jac-deploy: ✗ stopped"
    ;;
    
  *)
    echo "JAC VPS Manager v2.0"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  deploy              Pull latest from GitHub and rebuild"
    echo "  backup              Create a backup now"
    echo "  list                List available backups"
    echo "  restore <file>      Restore from a backup file"
    echo "  schedule <freq>     Set backup schedule (hourly|daily|weekly|disable)"
    echo "  status              Show system status"
    echo ""
    ;;
esac
