'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from 'next-cloudinary';
import { Star, Trash2, Upload } from 'lucide-react';
import { addPhoto, removePhoto, setPrimaryPhoto } from '@/actions/parcels';
import { toast } from '@/lib/toast';
import type { ParcelPhoto } from '@/db/schema';
import { cn } from '@/lib/utils';

export function PhotoManager({
  parcelId,
  initialPhotos,
  cloud,
}: {
  parcelId: string;
  initialPhotos: ParcelPhoto[];
  cloud: { cloudName: string; apiKey: string } | null;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleUpload(result: CloudinaryUploadWidgetResults) {
    if (result.event !== 'success' || typeof result.info !== 'object' || !result.info) return;
    const info = result.info as {
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
    };
    try {
      setError(null);
      const { id } = await addPhoto({
        parcelId,
        url: info.secure_url,
        publicId: info.public_id,
        width: info.width ?? null,
        height: info.height ?? null,
      });
      setPhotos((prev) => [
        ...prev,
        {
          id,
          parcelId,
          url: info.secure_url,
          publicId: info.public_id,
          alt: null,
          width: info.width ?? null,
          height: info.height ?? null,
          sortOrder: prev.length,
          isPrimary: prev.length === 0,
          createdAt: new Date(),
        } as ParcelPhoto,
      ]);
      toast.success('Photo added');
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed to persist';
      setError(message);
      toast.error('Photo upload failed', message);
    }
  }

  async function onSetPrimary(photoId: string) {
    try {
      await setPrimaryPhoto(parcelId, photoId);
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === photoId })),
      );
      toast.success('Primary photo updated');
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not set primary.';
      setError(message);
      toast.error('Update failed', message);
    }
  }

  async function onDelete(photoId: string) {
    if (!window.confirm('Delete this photo? This removes it from Cloudinary too.')) return;
    try {
      await removePhoto(photoId);
      setPhotos((prev) => {
        const removed = prev.find((p) => p.id === photoId);
        const remaining = prev.filter((p) => p.id !== photoId);
        if (removed?.isPrimary && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isPrimary: true };
        }
        return remaining;
      });
      toast.success('Photo removed');
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed.';
      setError(message);
      toast.error('Delete failed', message);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-neutral-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            The primary photo shows on listing cards and the detail page hero.
          </p>
        </div>
        {cloud ? (
          <CldUploadWidget
            signatureEndpoint="/api/cloudinary/sign"
            options={{
              cloudName: cloud.cloudName,
              apiKey: cloud.apiKey,
              folder: `geo-works/parcels/${parcelId}`,
              sources: ['local', 'url', 'camera'],
              multiple: true,
              maxFiles: 10,
              clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
              maxFileSize: 10_000_000,
            }}
            onSuccess={handleUpload}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                <Upload className="h-4 w-4" />
                Upload photo
              </button>
            )}
          </CldUploadWidget>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Set CLOUDINARY_URL to enable uploads
          </span>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No photos yet. Upload one to get started.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className={cn(
                'group relative overflow-hidden rounded-xl border bg-neutral-100 dark:bg-neutral-800',
                photo.isPrimary
                  ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                  : 'border-black/5 dark:border-white/10',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt ?? ''}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              {photo.isPrimary && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                {!photo.isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(photo.id)}
                    className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-full bg-white/90 px-2 text-xs font-medium text-neutral-900 hover:bg-white"
                  >
                    <Star className="h-3 w-3" />
                    Make primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(photo.id)}
                  aria-label="Delete photo"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-600 hover:bg-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
