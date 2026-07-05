import { backupFilename, backupsToDelete, hasBackupFor } from '../backupPolicy';

describe('backupPolicy', () => {
  it('names snapshots by ISO day', () => {
    expect(backupFilename('2026-07-05')).toBe('steward-backup-2026-07-05.json');
  });

  it('detects an existing snapshot for the day', () => {
    const files = ['steward-backup-2026-07-04.json', 'steward-backup-2026-07-05.json'];
    expect(hasBackupFor(files, '2026-07-05')).toBe(true);
    expect(hasBackupFor(files, '2026-07-06')).toBe(false);
  });

  it('keeps the newest 7 and deletes the rest', () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      backupFilename(`2026-06-${String(i + 10).padStart(2, '0')}`),
    );
    const doomed = backupsToDelete(files);
    expect(doomed).toEqual([
      'steward-backup-2026-06-10.json',
      'steward-backup-2026-06-11.json',
      'steward-backup-2026-06-12.json',
    ]);
  });

  it('deletes nothing at or under the cap', () => {
    expect(backupsToDelete([backupFilename('2026-07-05')])).toEqual([]);
    expect(backupsToDelete([])).toEqual([]);
  });

  it('leaves non-backup files alone even when unsorted input', () => {
    const files = ['export.json', 'notes.txt', backupFilename('2026-07-05')];
    expect(backupsToDelete(files, 0)).toEqual([backupFilename('2026-07-05')]);
  });
});
