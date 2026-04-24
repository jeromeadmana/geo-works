'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in dev; in prod Vercel already logs it.
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-white px-4 text-neutral-900 dark:from-rose-950/30 dark:via-neutral-950 dark:to-neutral-950 dark:text-neutral-100">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-400">500</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            A server error was caught — we&apos;ll get it sorted shortly. Please try again in a moment.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-neutral-400">
              ref: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
