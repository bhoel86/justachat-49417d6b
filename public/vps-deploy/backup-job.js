#!/usr/bin/env node
/**
 * Justachat Backup Job
 * Called by cron to create scheduled backups
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = process.env.DEPLOY_DIR || '/var/www/justachat';
const BACKUP_DIR = process.env.BACKUP_DIR || '/backups/justachat';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = `justachat-${timestamp}.tar.gz`;

console.log(`[${new Date().toISOString()}] Starting backup: ${backupFile}`);

try {
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Create backup
  execSync(
    `tar -czf ${BACKUP_DIR}/${backupFile} --exclude='node_modules' --exclude='.git' .`,
    { cwd: DEPLOY_DIR, stdio: 'inherit' }
  );

  console.log(`[${new Date().toISOString()}] Backup created: ${backupFile}`);

  // Clean up old backups (keep last 10)
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  if (files.length > 10) {
    const toDelete = files.slice(10);
    toDelete.forEach(f => {
      fs.unlinkSync(path.join(BACKUP_DIR, f));
      console.log(`[${new Date().toISOString()}] Deleted old backup: ${f}`);
    });
  }

  console.log(`[${new Date().toISOString()}] Backup complete`);
} catch (error) {
  console.error(`[${new Date().toISOString()}] Backup failed:`, error.message);
  process.exit(1);
}
