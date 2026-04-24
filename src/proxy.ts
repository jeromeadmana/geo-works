import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Edge-safe proxy: the bare authConfig (no credentials provider, no DB).
// The `authorized` callback in authConfig handles redirects for /admin/*.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*'],
};
