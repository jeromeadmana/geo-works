export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-neutral-50 dark:border-white/10 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-neutral-600 sm:flex-row sm:items-center sm:px-6 dark:text-neutral-400">
        <p>
          © {new Date().getFullYear()} GeoWorks. U.S. land listings &amp; owner financing.
        </p>
        <p className="text-neutral-500 dark:text-neutral-500">
          This is a demonstration site. Listings are illustrative only.
        </p>
      </div>
    </footer>
  );
}
