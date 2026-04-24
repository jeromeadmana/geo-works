import Link from 'next/link';

const nav = [
  { href: '/parcels', label: 'Parcels' },
  { href: '/map', label: 'Map' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-black/5 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-neutral-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-700"
          />
          <span>GeoWorks</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-neutral-600 dark:text-neutral-300">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-neutral-950 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
