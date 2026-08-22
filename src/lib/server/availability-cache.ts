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

/**
 * KNOWN LIMITATION -- eventual consistency.
 *
 * Cloudflare KV is eventually consistent: a `put` of the version key can take
 * up to ~60s to propagate, and `get` reads are edge-cached for a similar
 * window. So for roughly a minute after availability changes, a request may
 * read the OLD version, build the OLD cache key, and serve pre-change data.
 * Observed in production: right after saving new hours the booking calendar
 * showed every date disabled, and a single reload fixed it.
 *
 * Mitigated (not solved) by holding cached entries for only 60s -- KV's
 * minimum -- so a stale version still misses an expired entry and recomputes.
 * Worst-case staleness is therefore bounded at about a minute.
 *
 * The real fix is to keep the version in D1, which IS strongly consistent.
 * Both availability endpoints already read the users row on every request
 * (`SELECT id, slug, timezone, settings FROM users`), so storing it in
 * `users.settings` would cost no extra query. It was not done here because it
 * changes this module's signature and all six call sites, several of which sit
 * in the booking, cancel and reschedule paths.
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
