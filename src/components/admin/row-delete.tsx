'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { softDeleteParcel } from '@/actions/parcels';
import { toast } from '@/lib/toast';

export function RowDelete({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete ${title}`}
      onClick={() => {
        if (!window.confirm(`Delete "${title}"? It will be hidden from the public site and map.`)) {
          return;
        }
        startTransition(async () => {
          try {
            await softDeleteParcel(id);
            toast.success('Parcel deleted', title);
          } catch (err) {
            toast.error(
              'Delete failed',
              err instanceof Error ? err.message : undefined,
            );
          }
        });
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/30"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
