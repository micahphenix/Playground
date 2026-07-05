import * as FileSystem from 'expo-file-system';
import { backupFilename, backupsToDelete, hasBackupFor } from './backupPolicy';

// Automatic daily snapshot of everything Steward knows. All state lives in
// AsyncStorage on one device; the manual JSON export is the only other way
// out. This writes exportAll() to the app's Documents directory once per day
// and keeps the last 7 snapshots, so a bad migration or corrupted store is
// recoverable. Documents is included in iCloud/device backups on iOS, which
// is what makes this survive a lost phone. Deleting the app still wipes it —
// that's the WP20 Notion exporter's job to solve properly.

const DIR = 'backups/';

function backupDir(): string | null {
  const root = FileSystem.documentDirectory;
  return root ? root + DIR : null;
}

// Fire-and-forget from app startup. Never throws — a failed backup must not
// take the app down with it.
export async function runDailyBackup(exportAll: () => Promise<unknown>): Promise<void> {
  try {
    const dir = backupDir();
    if (!dir) return; // web / unsupported platform
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const existing = await FileSystem.readDirectoryAsync(dir);
    const today = new Date().toISOString().slice(0, 10);
    if (hasBackupFor(existing, today)) return;

    const snapshot = await exportAll();
    await FileSystem.writeAsStringAsync(dir + backupFilename(today), JSON.stringify(snapshot));

    for (const stale of backupsToDelete([...existing, backupFilename(today)])) {
      await FileSystem.deleteAsync(dir + stale, { idempotent: true }).catch(() => {});
    }
  } catch {
    // Swallow — backup is best-effort by design.
  }
}
