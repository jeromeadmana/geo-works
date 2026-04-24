export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="flex-1 bg-neutral-50 dark:bg-neutral-950">{children}</main>;
}
