type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (bucket && bucket.reset > now) {
    if (bucket.count >= limit) {
      const retryAfter = Math.max(0, bucket.reset - now);
      return { ok: false, retryAfter };
    }
    bucket.count += 1;
    return { ok: true, retryAfter: bucket.reset - now };
  }
  buckets.set(key, { count: 1, reset: now + windowMs });
  return { ok: true, retryAfter: windowMs };
}
