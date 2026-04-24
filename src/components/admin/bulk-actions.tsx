'use client';

import { useTransition, type ReactNode } from 'react';
import { bulkUpdateStatus } from '@/actions/parcels';
import { STATUS_LABELS } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { ParcelStatus } from '@/db/schema';

export function BulkActions({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const ids = fd.getAll('selected').map(String).filter(Boolean);
    const status = fd.get('status') as ParcelStatus;

    if (ids.length === 0) {
      toast.info('Select at least one row first');
      return;
    }

    const form = event.currentTarget;
    startTransition(async () => {
      try {
        const result = await bulkUpdateStatus(ids, status);
        const count = result?.updated ?? ids.length;
        toast.success(
          `Updated ${count} ${count === 1 ? 'parcel' : 'parcels'}`,
          `Marked ${STATUS_LABELS[status].toLowerCase()}`,
        );
        form
          .querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="selected"]:checked')
          .forEach((cb) => {
            cb.checked = false;
          });
      } catch (err) {
        toast.error(
          'Bulk update failed',
          err instanceof Error ? err.message : undefined,
        );
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <span className="text-neutral-500 dark:text-neutral-400">
          With selected rows, mark as:
        </span>
        <select
          name="status"
          defaultValue="sold"
          required
          disabled={pending}
          className="h-8 rounded-lg border border-neutral-300 bg-white px-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="active">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
          <option value="inactive">Off market</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center rounded-full bg-neutral-950 px-3 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
        >
          {pending ? 'Applying…' : 'Apply to selected'}
        </button>
      </div>
    </form>
  );
}
