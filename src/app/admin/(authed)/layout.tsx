import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AuthedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav user={{ email: session.user.email ?? '', name: session.user.name }} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
