'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { subscribeToasts, type ToastEventDetail } from '@/lib/toast';
import { cn } from '@/lib/utils';

type ActiveToast = ToastEventDetail & { enteredAt: number };

const KIND_STYLES: Record<ToastEventDetail['kind'], string> = {
  success: 'bg-emerald-50 text-emerald-950 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-100 dark:ring-emerald-500/30',
  error: 'bg-rose-50 text-rose-950 ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-100 dark:ring-rose-500/30',
  info: 'bg-neutral-50 text-neutral-950 ring-neutral-600/20 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-white/10',
};

const KIND_ICON: Record<ToastEventDetail['kind'], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    return subscribeToasts((detail) => {
      setToasts((prev) => [...prev, { ...detail, enteredAt: Date.now() }]);
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, detail.durationMs);
      return () => window.clearTimeout(timer);
    });
  }, []);

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-6 sm:items-end sm:pr-6"
    >
      {toasts.map((t) => {
        const Icon = KIND_ICON[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ring-1 ring-inset backdrop-blur transition-all',
              'data-[enter=true]:translate-y-0 data-[enter=true]:opacity-100',
              KIND_STYLES[t.kind],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium leading-snug">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs opacity-80">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
