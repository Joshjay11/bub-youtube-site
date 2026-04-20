import { kv } from '@vercel/kv';

type Result =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Fixed-window rate limit backed by Upstash KV (via @vercel/kv).
 *
 * Key convention: `rl:<route>:<identity>` — caller chooses. Keep keys stable
 * across deploys so TTLs aren't reset on every release.
 *
 * `windowSeconds` is the bucket size. `limit` is the max events per bucket.
 *
 * Fail-open posture: if KV is unreachable, allow the request and log. Better
 * to serve a real user than to 429 everyone because the rate-limit infra
 * blipped.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<Result> {
  try {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, windowSeconds);
    }

    if (count > limit) {
      const ttl = await kv.ttl(key);
      return {
        allowed: false,
        retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    }

    return { allowed: true, remaining: limit - count };
  } catch (err) {
    console.error('[rate-limit] KV failure — failing open', err);
    return { allowed: true, remaining: -1 };
  }
}
