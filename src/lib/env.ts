import { z } from "zod";

// Lazy validation — next build imports routes before env vars exist. Server-only;
// client components must use process.env.NEXT_PUBLIC_* directly.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  // Server-only. Needed to delete a user's account (Supabase admin API).
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, key: string) {
    cached ??= envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    return cached[key as keyof Env];
  },
});
