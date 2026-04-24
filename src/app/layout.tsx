import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/toast-provider';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'GeoWorks — U.S. land for sale',
    template: '%s · GeoWorks',
  },
  description:
    'Browse U.S. land parcels for sale. Owner financing, clean titles, and an interactive map to find your next property.',
  openGraph: {
    type: 'website',
    siteName: 'GeoWorks',
    title: 'GeoWorks — U.S. land for sale',
    description:
      'Browse U.S. land parcels for sale. Owner financing, clean titles, and an interactive map to find your next property.',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
