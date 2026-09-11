/**
 * Pure formatting helpers for FilePreview. Component-prefixed basename
 * (`file-preview-*`): Linaria slug collisions are a non-issue in a
 * class-free module, but the naming rule keeps sibling files greppable
 * and future-proofs a later style split.
 */

/**
 * Human-readable byte size: `B` below 1 KiB, then the largest fitting
 * binary unit (`KB`/`MB`/`GB`/`TB`) with 2 significant decimals
 * (`512 B`, `1.00 KB`, `1.50 MB`). Non-finite or negative input (and
 * `undefined`) yields an empty string so callers can skip the meta chip.
 */
function formatFileSize(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);

  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

/**
 * Uppercase extension of a file name for the type badge (`report.pdf` →
 * `PDF`). Leading-dot files (` .vimrc`), extension-less names and a
 * trailing dot return an empty string (no badge).
 */
function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toUpperCase();
}

export { formatFileSize, getFileExtension };
