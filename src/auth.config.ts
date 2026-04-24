import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth configuration. This file cannot import DB, bcrypt, or
 * anything Node-only because it runs in the proxy (formerly middleware)
 * on the edge runtime. The full `authorize` implementation lives in
 * `src/lib/auth.ts`, which re-exports a wrapped NextAuth instance.
 */
export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isAdminRoute = pathname.startsWith('/admin');
      const isLoginRoute = pathname === '/admin/login';

      if (isAdminRoute && !isLoginRoute && !isLoggedIn) {
        const loginUrl = new URL('/admin/login', nextUrl);
        const returnTo = pathname + nextUrl.search;
        if (returnTo && returnTo !== '/admin/login') {
          loginUrl.searchParams.set('callbackUrl', returnTo);
        }
        return Response.redirect(loginUrl);
      }

      if (isLoginRoute && isLoggedIn) {
        return Response.redirect(new URL('/admin/parcels', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        if (user.role) token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
