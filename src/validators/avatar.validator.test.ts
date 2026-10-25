import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  isAvatarMimeType,
  sniffAvatarType,
} from "./avatar.validator";

describe("avatar validator", () => {
  it("accepts png, jpeg and webp", () => {
    expect(isAvatarMimeType("image/png")).toBe(true);
    expect(isAvatarMimeType("image/jpeg")).toBe(true);
    expect(isAvatarMimeType("image/webp")).toBe(true);
  });

  it("rejects other types", () => {
    expect(isAvatarMimeType("image/gif")).toBe(false);
    expect(isAvatarMimeType("image/svg+xml")).toBe(false);
    expect(isAvatarMimeType("text/html")).toBe(false);
    expect(isAvatarMimeType("")).toBe(false);
    expect(isAvatarMimeType("toString")).toBe(false);
  });

  it("maps each type to a file extension", () => {
    expect(AVATAR_TYPES["image/jpeg"]).toBe("jpg");
  });

  it("limits uploads to 2 MB", () => {
    expect(AVATAR_MAX_BYTES).toBe(2_097_152);
  });

  describe("sniffAvatarType", () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
    const jpeg = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
    const webp = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50];

    it("recognises png, jpeg and webp by their first bytes", () => {
      expect(sniffAvatarType(new Uint8Array(png))).toBe("image/png");
      expect(sniffAvatarType(new Uint8Array(jpeg))).toBe("image/jpeg");
      expect(sniffAvatarType(new Uint8Array(webp))).toBe("image/webp");
    });

    it("rejects RIFF files that are not WebP", () => {
      const wav = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45];
      expect(sniffAvatarType(new Uint8Array(wav))).toBeNull();
    });

    it("rejects other or too-short content", () => {
      expect(sniffAvatarType(new TextEncoder().encode("<svg xmlns"))).toBeNull();
      expect(sniffAvatarType(new Uint8Array([0x89, 0x50]))).toBeNull();
      expect(sniffAvatarType(new Uint8Array())).toBeNull();
    });
  });
});
