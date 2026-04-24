import type { ParcelStatus } from '@/db/schema';

type Numeric = string | number | null | undefined;

export function formatPrice(value: Numeric): string {
  if (value === null || value === undefined || value === '') return 'Contact for price';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return 'Contact for price';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatAcreage(value: Numeric): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: n < 1 ? 3 : 2,
  }).format(n);
  return `${formatted} ${n === 1 ? 'acre' : 'acres'}`;
}

export function formatCoord(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

export const STATUS_LABELS: Record<ParcelStatus, string> = {
  active: 'Available',
  pending: 'Pending',
  sold: 'Sold',
  inactive: 'Off market',
};

export const STATUS_BADGE_CLASSES: Record<ParcelStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  sold: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  inactive: 'bg-gray-50 text-gray-700 ring-gray-500/20',
};
