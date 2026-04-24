'use client';

import { useTransition } from 'react';
import { updateParcelStatus } from '@/actions/parcels';
import type { ParcelStatus } from '@/db/schema';

const STATUS_OPTIONS: Array<{ value: ParcelStatus; label: string }> = [
  { value: 'active', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'inactive', label: 'Off market' },
];

export function RowStatus({ id, status }: { id: string; status: ParcelStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      name="status"
      defaultValue={status}
      disabled={pending}
      aria-label="Change status"
      onChange={(event) => {
        const next = event.currentTarget.value as ParcelStatus;
        startTransition(async () => {
          await updateParcelStatus(id, next);
        });
      }}
      className="h-7 rounded-lg border border-neutral-300 bg-white px-2 text-xs font-medium text-neutral-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
