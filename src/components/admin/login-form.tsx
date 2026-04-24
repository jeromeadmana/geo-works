'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { loginAction } from '@/actions/auth';

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    initialError ? decodeURIComponent(initialError) : null,
  );
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);
    if (result.ok) {
      startTransition(() => {
        router.push(callbackUrl || '/admin/parcels');
        router.refresh();
      });
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  const busy = submitting || pending;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900"
    >
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          disabled={busy}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-200"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          disabled={busy}
          className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex h-10 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="pt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
        Demo credentials:
        <br />
        <code className="font-mono">admin@geoworks.local</code> / <code className="font-mono">geoworks-admin</code>
      </p>
    </form>
  );
}
