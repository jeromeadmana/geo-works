import type { ReactNode } from 'react';
import { bulkUpdateStatusFormAction } from '@/actions/parcels';

export function BulkActions({ children }: { children: ReactNode }) {
  return (
    <form action={bulkUpdateStatusFormAction}>
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <span className="text-neutral-500 dark:text-neutral-400">
          With selected rows, mark as:
        </span>
        <select
          name="status"
          defaultValue="sold"
          required
          className="h-8 rounded-lg border border-neutral-300 bg-white px-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="active">Available</option>
          <option value="pending">Pending</option>
          <option value="sold">Sold</option>
          <option value="inactive">Off market</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-full bg-neutral-950 px-3 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
        >
          Apply to selected
        </button>
      </div>
    </form>
  );
}
