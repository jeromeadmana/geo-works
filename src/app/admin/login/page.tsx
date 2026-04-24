import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { callbackUrl, error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="inline-block h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700"
          />
          <h1 className="text-2xl font-semibold tracking-tight">GeoWorks admin</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to manage parcel listings.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} initialError={error} />
      </div>
    </div>
  );
}
