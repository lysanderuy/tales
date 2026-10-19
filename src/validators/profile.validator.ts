import { z } from "zod";

const validTimeZones = new Set<string>([...Intl.supportedValuesOf("timeZone"), "UTC"]);

const examDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "That date doesn't exist.");

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .optional()
      .meta({ description: "Name shown in the app.", example: "Jane Doe" }),
    school: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional()
      .meta({ description: "School, or null to clear.", example: "University of Santo Tomas" }),
    reviewCenter: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional()
      .meta({ description: "Review center, or null to clear.", example: "Example Review Center" }),
    examDate: examDateSchema.nullable().optional().meta({
      description: "Exam date as YYYY-MM-DD, or null to clear.",
      example: "2027-03-20",
    }),
    timeZone: z
      .string()
      .refine((value) => validTimeZones.has(value), "Use a valid IANA time zone.")
      .optional()
      .meta({ description: "IANA time zone that defines her day.", example: "Asia/Manila" }),
    soundOn: z.boolean().optional().meta({ description: "Whether sounds are on.", example: true }),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const profileResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Profile ID (matches the Supabase auth user ID).",
      example: "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90",
    }),
    email: z
      .string()
      .email()
      .meta({ description: "Account email address.", example: "jane@example.com" }),
    displayName: z.string().meta({ description: "Name shown in the app.", example: "Jane Doe" }),
    school: z
      .string()
      .nullable()
      .meta({ description: "School, if set.", example: "University of Santo Tomas" }),
    reviewCenter: z
      .string()
      .nullable()
      .meta({ description: "Review center, if set.", example: "Example Review Center" }),
    examDate: z
      .string()
      .nullable()
      .meta({ description: "Exam date as YYYY-MM-DD, if set.", example: "2027-03-20" }),
    timeZone: z
      .string()
      .meta({ description: "IANA time zone that defines her day.", example: "Asia/Manila" }),
    soundOn: z.boolean().meta({ description: "Whether sounds are on.", example: true }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the profile was created.",
      example: "2026-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().datetime().meta({
      description: "Timestamp the profile was last updated.",
      example: "2026-01-15T09:30:00.000Z",
    }),
  })
  .meta({ id: "Profile", description: "A user profile." });

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
