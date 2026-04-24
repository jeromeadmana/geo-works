import type { NextConfig } from 'next';

// Parse CLOUDINARY_URL (format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
// and mirror the public portions into NEXT_PUBLIC_* env vars so
// `next-cloudinary` finds them without requiring the user to duplicate
// values in .env.local. API secret stays server-only.
function mirrorCloudinaryEnv() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) return;
  const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) return;
  const [, apiKey, , cloudName] = match;
  process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||= apiKey;
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||= cloudName;
}
mirrorCloudinaryEnv();

const nextConfig: NextConfig = {};

export default nextConfig;
