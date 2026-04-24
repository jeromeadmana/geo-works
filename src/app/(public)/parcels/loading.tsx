export default function ParcelsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900"
          >
            <div className="aspect-[4/3] w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="mt-auto flex items-end justify-between pt-2">
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
