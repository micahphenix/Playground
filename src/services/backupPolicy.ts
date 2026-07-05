// Pure policy for the automatic backup rotation — kept free of expo-file-system
// so it runs under Jest.

export const BACKUP_PREFIX = 'steward-backup-';
export const BACKUP_KEEP = 7;

export function backupFilename(isoDay: string): string {
  return `${BACKUP_PREFIX}${isoDay}.json`;
}

// True when today's snapshot already exists — backup runs at most once a day.
export function hasBackupFor(filenames: string[], isoDay: string): boolean {
  return filenames.includes(backupFilename(isoDay));
}

// Which files to delete to keep only the newest BACKUP_KEEP snapshots.
// Filenames sort chronologically because the date is ISO-formatted.
// Non-backup files in the directory are left alone.
export function backupsToDelete(filenames: string[], keep = BACKUP_KEEP): string[] {
  const backups = filenames
    .filter(f => f.startsWith(BACKUP_PREFIX) && f.endsWith('.json'))
    .sort();
  return backups.slice(0, Math.max(0, backups.length - keep));
}
