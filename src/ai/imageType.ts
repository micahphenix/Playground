// The Anthropic API rejects an image whose declared media_type doesn't match
// its actual bytes. Camera shots are always JPEG, but library picks can be
// PNG (screenshots), GIF, or WebP — so sniff the real type from the data
// instead of assuming.
//
// Base64 encodes each 3-byte group into 4 chars deterministically, so a file
// signature at offset 0 always yields the same base64 prefix. No decoding
// needed.

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const SIGNATURES: [prefix: string, type: ImageMediaType][] = [
  ['iVBORw0KGgo', 'image/png'], // 89 50 4E 47 0D 0A 1A 0A
  ['/9j/', 'image/jpeg'], // FF D8 FF
  ['R0lGOD', 'image/gif'], // "GIF8"
  ['UklGR', 'image/webp'], // "RIFF" — in practice always WebP for images
];

// Falls back to image/jpeg for unrecognized data: iOS re-encodes camera and
// most library assets to JPEG, so it's the overwhelmingly likely answer.
export function detectImageMediaType(base64: string): ImageMediaType {
  for (const [prefix, type] of SIGNATURES) {
    if (base64.startsWith(prefix)) return type;
  }
  return 'image/jpeg';
}
