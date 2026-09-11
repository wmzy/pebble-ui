import { formatFileSize, getFileExtension } from './file-preview-format';

describe('formatFileSize', () => {
  it('returns empty string for missing, non-finite or negative input', () => {
    expect(formatFileSize()).toBe('');
    expect(formatFileSize(undefined)).toBe('');
    expect(formatFileSize(Number.NaN)).toBe('');
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('');
    expect(formatFileSize(-1)).toBe('');
  });

  it('keeps bytes below 1 KiB as B', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('scales through binary units', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
    expect(formatFileSize(1536)).toBe('1.50 KB');
    expect(formatFileSize(10 * 1024)).toBe('10.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  it('trims decimals for large mantissas', () => {
    expect(formatFileSize(123 * 1024)).toBe('123 KB');
    expect(formatFileSize(12.3 * 1024 * 1024)).toBe('12.3 MB');
  });

  it('caps at TB', () => {
    const twoPB = 2 * 1024 ** 5;
    expect(formatFileSize(twoPB)).toBe('2048 TB');
  });
});

describe('getFileExtension', () => {
  it('uppercases the extension', () => {
    expect(getFileExtension('report.pdf')).toBe('PDF');
    expect(getFileExtension('photo.jpeg')).toBe('JPEG');
  });

  it('uses the last dot segment', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('GZ');
  });

  it('returns empty string for dotfiles, no extension and trailing dot', () => {
    expect(getFileExtension('.vimrc')).toBe('');
    expect(getFileExtension('Makefile')).toBe('');
    expect(getFileExtension('draft.')).toBe('');
  });
});
