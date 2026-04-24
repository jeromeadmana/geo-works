'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { createParcel, updateParcel, type ParcelInput } from '@/actions/parcels';
import { MapPicker } from '@/components/admin/map-picker';
import { US_STATES } from '@/lib/states';
import { slugify } from '@/lib/slug';
import { toast } from '@/lib/toast';
import type { ParcelStatus } from '@/db/schema';
import type { ParcelWithPhotos } from '@/lib/parcels';

type FormValues = {
  title: string;
  slug: string;
  description: string;
  price: string;
  acreage: string;
  apn: string;
  state: string;
  county: string;
  addressLine: string;
  zipCode: string;
  lat: string;
  lng: string;
  status: ParcelStatus;
  featured: boolean;
  termsJson: string;
  financingJson: string;
};

const DEFAULTS: FormValues = {
  title: '',
  slug: '',
  description: '',
  price: '',
  acreage: '',
  apn: '',
  state: 'TX',
  county: '',
  addressLine: '',
  zipCode: '',
  lat: '',
  lng: '',
  status: 'active',
  featured: false,
  termsJson: '{}',
  financingJson: '{}',
};

function toFormValues(p: ParcelWithPhotos): FormValues {
  return {
    title: p.title,
    slug: p.slug,
    description: p.description ?? '',
    price: p.price ?? '',
    acreage: p.acreage ?? '',
    apn: p.apn ?? '',
    state: p.state,
    county: p.county ?? '',
    addressLine: p.addressLine ?? '',
    zipCode: p.zipCode ?? '',
    lat: String(p.lat),
    lng: String(p.lng),
    status: p.status,
    featured: p.featured,
    termsJson: JSON.stringify(p.terms ?? {}, null, 2),
    financingJson: JSON.stringify(p.financing ?? {}, null, 2),
  };
}

export function ParcelForm({
  mode,
  initial,
  mapboxToken,
}: {
  mode: 'create' | 'edit';
  initial?: ParcelWithPhotos;
  mapboxToken: string;
}) {
  const router = useRouter();
  const defaults = useMemo(
    () => (initial ? toFormValues(initial) : DEFAULTS),
    [initial],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({ defaultValues: defaults });

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = watch('title');
  const lat = watch('lat');
  const lng = watch('lng');
  const latNum = lat ? Number(lat) : null;
  const lngNum = lng ? Number(lng) : null;

  // Auto-generate slug from title until user has manually edited the slug field.
  useEffect(() => {
    if (!dirtyFields.slug) {
      setValue('slug', slugify(title || ''));
    }
  }, [title, dirtyFields.slug, setValue]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    let terms: Record<string, unknown> = {};
    let financing: Record<string, unknown> = {};
    try {
      terms = values.termsJson.trim() ? (JSON.parse(values.termsJson) as Record<string, unknown>) : {};
    } catch {
      setFormError('Terms must be valid JSON.');
      return;
    }
    try {
      financing = values.financingJson.trim()
        ? (JSON.parse(values.financingJson) as Record<string, unknown>)
        : {};
    } catch {
      setFormError('Financing must be valid JSON.');
      return;
    }

    const payload: ParcelInput = {
      title: values.title,
      slug: values.slug || undefined,
      description: values.description,
      price: values.price === '' ? null : Number(values.price),
      acreage: values.acreage === '' ? null : Number(values.acreage),
      apn: values.apn || null,
      state: values.state.toUpperCase(),
      county: values.county || null,
      addressLine: values.addressLine || null,
      zipCode: values.zipCode || null,
      lat: Number(values.lat),
      lng: Number(values.lng),
      status: values.status,
      terms,
      financing,
      featured: values.featured,
    };

    try {
      if (mode === 'edit' && initial) {
        await updateParcel(initial.id, payload);
        toast.success('Saved');
        startTransition(() => router.refresh());
      } else {
        const created = await createParcel(payload);
        toast.success('Parcel created', 'Upload photos next.');
        router.push(`/admin/parcels/${created.id}/edit?created=1`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed.';
      setFormError(message);
      toast.error(mode === 'edit' ? 'Save failed' : 'Create failed', message);
    }
  });

  const busy = isSubmitting || isPending;

  return (
    <form onSubmit={submit} className="space-y-8">
      <Section title="Basic info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={errors.title?.message}>
            <input
              {...register('title', { required: 'Title is required' })}
              className={inputClass}
              placeholder="160 Acres in Brewster County, TX"
            />
          </Field>
          <Field label="Slug" hint="URL-safe identifier (auto from title)">
            <input {...register('slug')} className={`${inputClass} font-mono`} />
          </Field>
        </div>
        <Field label="Description" className="mt-4">
          <textarea
            {...register('description')}
            rows={6}
            className={inputClass}
            placeholder="Describe the parcel, access, utilities, zoning…"
          />
        </Field>
      </Section>

      <Section title="Location" description="Click or drag the pin on the map; lat/lng update automatically.">
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
          <MapPicker
            token={mapboxToken}
            lat={Number.isFinite(latNum ?? NaN) ? (latNum as number) : null}
            lng={Number.isFinite(lngNum ?? NaN) ? (lngNum as number) : null}
            onChange={(newLat, newLng) => {
              setValue('lat', newLat.toFixed(5), { shouldDirty: true });
              setValue('lng', newLng.toFixed(5), { shouldDirty: true });
            }}
          />
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" error={errors.lat?.message}>
                <input
                  type="number"
                  step="any"
                  {...register('lat', { required: 'Latitude is required' })}
                  className={`${inputClass} font-mono text-xs`}
                />
              </Field>
              <Field label="Longitude" error={errors.lng?.message}>
                <input
                  type="number"
                  step="any"
                  {...register('lng', { required: 'Longitude is required' })}
                  className={`${inputClass} font-mono text-xs`}
                />
              </Field>
            </div>
            <Field label="State">
              <select {...register('state')} className={inputClass}>
                {Object.entries(US_STATES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} — {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="County">
              <input {...register('county')} className={inputClass} placeholder="Brewster" />
            </Field>
            <Field label="Address (optional)">
              <input {...register('addressLine')} className={inputClass} />
            </Field>
            <Field label="ZIP">
              <input {...register('zipCode')} className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Pricing & identifiers">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (USD)">
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('price')}
              className={inputClass}
              placeholder="59500"
            />
          </Field>
          <Field label="Acreage">
            <input
              type="number"
              step="0.001"
              min="0"
              {...register('acreage')}
              className={inputClass}
              placeholder="160"
            />
          </Field>
          <Field label="APN">
            <input
              {...register('apn')}
              className={`${inputClass} font-mono`}
              placeholder="0001-0012-0160"
            />
          </Field>
        </div>
      </Section>

      <Section title="Status & flags">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_auto]">
          <Field label="Status">
            <select {...register('status')} className={inputClass}>
              <option value="active">Available</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="inactive">Off market</option>
            </select>
          </Field>
          <label className="mt-7 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register('featured')}
              className="h-4 w-4 rounded border-neutral-300 accent-emerald-600"
            />
            Featured
          </label>
        </div>
      </Section>

      <details className="rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
        <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Advanced: terms &amp; financing (JSON)
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Terms">
            <textarea
              {...register('termsJson')}
              rows={6}
              className={`${inputClass} font-mono text-xs`}
              spellCheck={false}
            />
          </Field>
          <Field label="Financing">
            <textarea
              {...register('financingJson')}
              rows={6}
              className={`${inputClass} font-mono text-xs`}
              spellCheck={false}
            />
          </Field>
        </div>
      </details>

      {formError && (
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {formError}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-black/5 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-white/10 dark:bg-neutral-950/95">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {mode === 'edit' ? 'Editing parcel' : 'Creating new parcel'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/parcels')}
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              {busy ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create parcel'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

const inputClass =
  'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-neutral-900">
      <header className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-500">
          {hint}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </label>
  );
}
