export function MapUnavailable({ reason }: { reason?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Map unavailable</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        {reason === 'missing_token'
          ? 'NEXT_PUBLIC_MAPBOX_TOKEN is not set. Add a Mapbox public token to .env.local and reload.'
          : 'The map failed to load. Refresh the page or try again shortly.'}
      </p>
    </div>
  );
}
