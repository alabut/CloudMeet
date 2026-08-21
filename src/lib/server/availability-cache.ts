/**
 * Availability cache invalidation
 *
 * Availability answers are cached in KV under two independent keyspaces:
 *   - month grid:   availability:month:{eventSlug}:{month}
 *   - per-day slots: availability:{eventSlug}:{date}
 *
 * KV has no wildcard/prefix delete, so we can't purge "availability:*" in
 * one call, and listing + deleting every matching key on every write would
 * burn list+delete operations against the free-tier quota for a
 * single-user, low-traffic app.
 *
 * Instead we use a cache-version counter: every cache key is namespaced
 * with the current version, and invalidating just bumps the version to a
 * fresh random value. Old entries become unreachable immediately and are
 * left for their existing 300s TTL to expire naturally - no enumeration,
 * no per-key deletes, and no read-modify-write race to get wrong.
 */

const CACHE_VERSION_KEY = 'availability:cache-version';

/**
 * Read the current cache version, defaulting to '0' if never set.
 */
async function getCacheVersion(kv: KVNamespace): Promise<string> {
	return (await kv.get(CACHE_VERSION_KEY)) ?? '0';
}

/**
 * Build the versioned cache key for the month-grid endpoint.
 */
export async function getMonthCacheKey(
	kv: KVNamespace,
	eventSlug: string,
	month: string
): Promise<string> {
	const version = await getCacheVersion(kv);
	return `availability:month:v${version}:${eventSlug}:${month}`;
}

/**
 * Build the versioned cache key for the per-day slots endpoint.
 */
export async function getDayCacheKey(
	kv: KVNamespace,
	eventSlug: string,
	date: string
): Promise<string> {
	const version = await getCacheVersion(kv);
	return `availability:v${version}:${eventSlug}:${date}`;
}

/**
 * Invalidate every cached availability response (both the month grid and
 * per-day slots, for every event type and date) by rolling the cache
 * version. Call this whenever data that affects availability changes:
 * weekly hours, timezone, event types, or bookings being
 * created/rescheduled/cancelled.
 */
export async function invalidateAvailabilityCache(kv: KVNamespace): Promise<void> {
	await kv.put(CACHE_VERSION_KEY, crypto.randomUUID());
}
