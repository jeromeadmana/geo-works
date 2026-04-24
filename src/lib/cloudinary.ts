import { v2 as cloudinary } from 'cloudinary';

// Cloudinary's SDK auto-reads CLOUDINARY_URL from process.env. We just
// expose typed helpers around it.

export function isConfigured(): boolean {
  const cfg = cloudinary.config();
  return Boolean(cfg.cloud_name && cfg.api_key && cfg.api_secret);
}

/**
 * Public credentials safe to send to the browser. The API secret never
 * leaves the server — signing happens in /api/cloudinary/sign.
 */
export function getPublicCloudinaryConfig(): { cloudName: string; apiKey: string } | null {
  const cfg = cloudinary.config();
  if (!cfg.cloud_name || !cfg.api_key) return null;
  return {
    cloudName: String(cfg.cloud_name),
    apiKey: String(cfg.api_key),
  };
}

export function signUpload(params: Record<string, string | number>) {
  if (!isConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL in .env.local.');
  }
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = { ...params, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    toSign,
    cloudinary.config().api_secret as string,
  );
  return {
    signature,
    timestamp,
    apiKey: cloudinary.config().api_key as string,
    cloudName: cloudinary.config().cloud_name as string,
  };
}

export async function deleteByPublicId(publicId: string): Promise<void> {
  if (!isConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch {
    // Swallow — we prefer to log the orphan via audit rather than block the
    // DB delete. The caller can inspect the audit log if needed.
  }
}

export { cloudinary };
