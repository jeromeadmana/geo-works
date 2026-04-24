import Link from 'next/link';
import { logoutAction } from '@/actions/auth';

const links = [
  { href: '/admin/parcels', label: 'Parcels' },
  { href: '/admin/audit', label: 'Audit log' },
];

export function AdminNav({
  user,
}: {
  user: { email: string; name?: string | null };
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/admin/parcels" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-700"
            />
            <span>GeoWorks admin</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-neutral-600 sm:flex dark:text-neutral-300">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-neutral-950 dark:hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
            >
              View public site ↗
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-neutral-500 sm:inline dark:text-neutral-400">
            {user.name || user.email}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-full border border-neutral-300 bg-white px-3 text-xs font-medium transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
