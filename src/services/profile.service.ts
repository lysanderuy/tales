import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  isAvatarMimeType,
  sniffAvatarType,
} from "@/validators/avatar.validator";
import type { UpdateProfileInput } from "@/validators/profile.validator";

const AVATAR_BUCKET = "avatars";

const LIST_PAGE_SIZE = 100;

async function removeAvatarObjects(userId: string, keepName?: string): Promise<void> {
  const bucket = getAdminClient().storage.from(AVATAR_BUCKET);
  const names: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await bucket.list(userId, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    names.push(...data.map((file) => file.name));
    if (data.length < LIST_PAGE_SIZE) break;
  }
  const stale = names.filter((name) => name !== keepName).map((name) => `${userId}/${name}`);
  for (let start = 0; start < stale.length; start += LIST_PAGE_SIZE) {
    const { error } = await bucket.remove(stale.slice(start, start + LIST_PAGE_SIZE));
    if (error) throw error;
  }
}

export const profileService = {
  async getById(id: string): Promise<Profile | undefined> {
    return db.query.profiles.findFirst({
      where: eq(profiles.id, id),
    });
  },

  async update(id: string, input: UpdateProfileInput): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();

    return updated;
  },

  async setAvatar(userId: string, file: File): Promise<Profile | undefined> {
    if (!isAvatarMimeType(file.type)) throw new AppError(400, messages.avatarTypeNotAllowed);
    if (file.size > AVATAR_MAX_BYTES) throw new AppError(413, messages.avatarTooLarge);

    const sniffed = sniffAvatarType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
    if (!sniffed) throw new AppError(400, messages.avatarTypeNotAllowed);

    const name = `${randomUUID()}.${AVATAR_TYPES[sniffed]}`;
    const path = `${userId}/${name}`;
    const bucket = getAdminClient().storage.from(AVATAR_BUCKET);
    const { error } = await bucket.upload(path, file, {
      contentType: sniffed,
      cacheControl: "31536000",
    });
    if (error) throw error;

    const { data } = bucket.getPublicUrl(path);
    const [updated] = await db
      .update(profiles)
      .set({ avatarUrl: data.publicUrl, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning();

    if (!updated) {
      await bucket.remove([path]);
      return undefined;
    }
    // The new avatar is already saved; a failed cleanup only leaves an unused file behind.
    await removeAvatarObjects(userId, name).catch(() => undefined);
    return updated;
  },

  async removeAvatar(userId: string): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ avatarUrl: null, updatedAt: new Date() })
      .where(eq(profiles.id, userId))
      .returning();
    if (updated) await removeAvatarObjects(userId).catch(() => undefined);
    return updated;
  },

  async purgeAvatarObjects(userId: string): Promise<void> {
    await removeAvatarObjects(userId);
  },
};
