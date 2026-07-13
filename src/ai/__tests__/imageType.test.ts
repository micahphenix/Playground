import { detectImageMediaType } from '../imageType';

// Encode real file signatures rather than hardcoding expected base64 — this
// verifies the prefix constants in imageType.ts against the actual bytes.
function b64(bytes: number[], padTo = 32): string {
  const padded = [...bytes, ...Array(Math.max(0, padTo - bytes.length)).fill(0)];
  return Buffer.from(padded).toString('base64');
}

describe('detectImageMediaType', () => {
  it('detects PNG (the July 13 defect: library screenshots)', () => {
    expect(detectImageMediaType(b64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'image/png',
    );
  });

  it('detects JPEG', () => {
    expect(detectImageMediaType(b64([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectImageMediaType(b64([0xff, 0xd8, 0xff, 0xe1]))).toBe('image/jpeg'); // EXIF variant
  });

  it('detects GIF (87a and 89a)', () => {
    expect(detectImageMediaType(b64([...'GIF87a'].map(c => c.charCodeAt(0))))).toBe('image/gif');
    expect(detectImageMediaType(b64([...'GIF89a'].map(c => c.charCodeAt(0))))).toBe('image/gif');
  });

  it('detects WebP (RIFF container)', () => {
    const riffWebp = [...'RIFF'].map(c => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map(c => c.charCodeAt(0)));
    expect(detectImageMediaType(b64(riffWebp))).toBe('image/webp');
  });

  it('falls back to JPEG for unrecognized data', () => {
    expect(detectImageMediaType(b64([0x00, 0x01, 0x02, 0x03]))).toBe('image/jpeg');
    expect(detectImageMediaType('')).toBe('image/jpeg');
  });
});
