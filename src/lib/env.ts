import { z } from 'zod';

// Empty strings in .env files should be treated as "not set" so `.optional()`
// fields don't trip length / format checks before those features are wired up.
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);
const optString = () => z.preprocess(emptyToUndef, z.string().optional());
const optSecret = (min: number) =>
  z.preprocess(emptyToUndef, z.string().min(min).optional());
const optUrl = () => z.preprocess(emptyToUndef, z.string().url().optional());

const serverSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgres'),
  NEXTAUTH_SECRET: optSecret(32),
  CLOUDINARY_URL: optString(),
  CLOUDINARY_CLOUD_NAME: optString(),
  CLOUDINARY_API_KEY: optString(),
  CLOUDINARY_API_SECRET: optString(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: optString(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optString(),
  NEXT_PUBLIC_SITE_URL: optUrl(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
type Env = ServerEnv & ClientEnv;

let cached: Env | null = null;

function loadEnv(): Env {
  if (cached) return cached;

  const server = serverSchema.safeParse(process.env);
  if (!server.success) {
    const issues = server.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid server environment variables:\n${issues}`);
  }

  const client = clientSchema.safeParse({
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!client.success) {
    const issues = client.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid client environment variables:\n${issues}`);
  }

  cached = { ...server.data, ...client.data };
  return cached;
}

// Lazy Proxy — env is only validated when a field is read, so `next build`
// does not fail just because .env.local is not yet filled in.
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return loadEnv()[prop as keyof Env];
  },
});
