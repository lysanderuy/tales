export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_REQUEST_OVERHEAD_BYTES = 512 * 1024;

export const AVATAR_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export type AvatarMimeType = keyof typeof AVATAR_TYPES;

export function isAvatarMimeType(type: string): type is AvatarMimeType {
  return Object.hasOwn(AVATAR_TYPES, type);
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function sniffAvatarType(bytes: Uint8Array): AvatarMimeType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  return null;
}
