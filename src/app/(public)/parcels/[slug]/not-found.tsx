import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Parcel not found</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        This listing may have been removed, sold, or never existed.
      </p>
      <Link
        href="/parcels"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      >
        Browse all parcels
      </Link>
    </div>
  );
}
