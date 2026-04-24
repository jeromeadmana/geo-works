import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-4 dark:from-emerald-950/40 dark:via-neutral-950 dark:to-neutral-950">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          The link may be out of date, or the parcel may have been removed from the map.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            Home
          </Link>
          <Link
            href="/parcels"
            className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            Browse parcels
          </Link>
        </div>
      </div>
    </div>
  );
}
