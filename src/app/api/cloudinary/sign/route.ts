import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/lib/auth';
import { isConfigured } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint consumed by `next-cloudinary`'s `CldUploadWidget` via
 * `signatureEndpoint`. Receives `{ paramsToSign }` and returns a signature
 * generated with our server-only API secret. Auth-gated so random visitors
 * cannot get signed upload URLs.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    paramsToSign?: Record<string, string | number>;
  };
  if (!body.paramsToSign || typeof body.paramsToSign !== 'object') {
    return NextResponse.json({ error: 'Missing paramsToSign' }, { status: 400 });
  }

  const signature = cloudinary.utils.api_sign_request(
    body.paramsToSign,
    cloudinary.config().api_secret as string,
  );

  return NextResponse.json({ signature });
}
