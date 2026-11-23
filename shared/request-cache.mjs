const entries = new Map();

function trim(maxEntries) {
  while (entries.size > maxEntries) {
    const oldest = entries.keys().next().value;
    entries.delete(oldest);
  }
}

export function cachedRequest(key, loader, options = {}) {
  if (typeof key !== "string" || !key) throw new TypeError("A non-empty cache key is required");
  if (typeof loader !== "function") throw new TypeError("A request loader function is required");

  const ttlMs = Math.max(0, Number(options.ttlMs) || 0);
  const maxEntries = Math.max(1, Math.floor(Number(options.maxEntries) || 64));
  const now = Date.now();
  const existing = entries.get(key);

  if (existing?.promise) return existing.promise;
  if (existing?.hasValue && existing.expiresAt > now) {
    entries.delete(key);
    entries.set(key, existing);
    return Promise.resolve(existing.value);
  }

  const entry = { promise: null, value: undefined, hasValue: false, expiresAt: 0 };
  const request = Promise.resolve().then(loader).then(value => {
    entry.value = value;
    entry.hasValue = true;
    entry.expiresAt = Date.now() + ttlMs;
    entry.promise = null;
    trim(maxEntries);
    return value;
  }).catch(error => {
    if (entries.get(key) === entry) entries.delete(key);
    throw error;
  });

  entry.promise = request;
  entries.set(key, entry);
  trim(maxEntries);
  return request;
}

export function invalidateCachedRequests(prefix = "") {
  const keyPrefix = String(prefix);
  let removed = 0;
  for (const key of entries.keys()) {
    if (key.startsWith(keyPrefix)) {
      entries.delete(key);
      removed += 1;
    }
  }
  return removed;
}

export function clearRequestCache() {
  entries.clear();
}
