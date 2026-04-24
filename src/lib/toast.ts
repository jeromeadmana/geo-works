'use client';

// Tiny zero-dep toast bus. A single module-level EventTarget broadcasts
// toast events to any subscribed <ToastProvider>. Callers use the exported
// `toast` helpers and don't need context.

export type ToastKind = 'success' | 'error' | 'info';

export type ToastEventDetail = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  durationMs: number;
};

const bus = new EventTarget();
let nextId = 1;

function emit(kind: ToastKind, title: string, description?: string, durationMs = 3200) {
  const detail: ToastEventDetail = {
    id: nextId++,
    kind,
    title,
    description,
    durationMs,
  };
  bus.dispatchEvent(new CustomEvent<ToastEventDetail>('toast', { detail }));
  return detail.id;
}

export const toast = {
  success: (title: string, description?: string) => emit('success', title, description),
  error: (title: string, description?: string) => emit('error', title, description, 5000),
  info: (title: string, description?: string) => emit('info', title, description),
};

export function subscribeToasts(handler: (detail: ToastEventDetail) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<ToastEventDetail>).detail);
  bus.addEventListener('toast', listener);
  return () => bus.removeEventListener('toast', listener);
}
