export default function AdminParcelsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-8 w-36 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[62px] w-36 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="h-11 border-b border-black/5 bg-neutral-50 dark:border-white/10 dark:bg-neutral-950" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 items-center gap-4 border-b border-black/5 px-4 last:border-b-0 dark:border-white/10"
          >
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 flex-1 max-w-xs animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-7 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
