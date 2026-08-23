import { NextRequest, NextResponse } from 'next/server';

/**
 * Minimal per-IP fixed-window rate limiter.
 *
 * The product has no accounts, so the identity we can throttle on is the
 * client IP (Cloudflare's `cf-connecting-ip` in production; forwarded headers
 * behind other proxies; a shared bucket in local dev where none are present).
 *
 * State is in-memory. On Cloudflare that means per-isolate rather than
 * strictly global, so a determined attacker spread across isolates sees a
 * higher effective ceiling — but it still stops the common case (one source
 * hammering one endpoint) with zero added infrastructure. The production
 * upgrade is the Workers `RateLimit` binding; this utility is the portable
 * floor that also works in `next dev`. It fails open: if anything here throws,
 * the request proceeds rather than erroring the product.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

// Bound the map so a flood of distinct IPs can't grow it without limit.
const MAX_TRACKED = 10_000;

function clientIp(req: NextRequest): string {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local'
  );
}

export interface RateLimitOptions {
  /** Distinct namespace per endpoint so their budgets don't share a counter. */
  bucket: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Returns a 429 NextResponse when the caller is over budget, or `null` when
 * the request may proceed. Call at the very top of a route handler:
 *
 *   const limited = rateLimit(req, { bucket: 'generate', limit: 10, windowMs: 60_000 });
 *   if (limited) return limited;
 */
export function rateLimit(
  req: NextRequest,
  { bucket, limit, windowMs }: RateLimitOptions
): NextResponse | null {
  try {
    const now = Date.now();
    const key = `${bucket}:${clientIp(req)}`;
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      if (buckets.size >= MAX_TRACKED) {
        // Drop expired entries before inserting a new one.
        for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }

    if (existing.count >= limit) {
      const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return NextResponse.json(
        { error: 'Too many requests', errorCode: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    existing.count += 1;
    return null;
  } catch {
    return null; // fail open — never let the limiter break the product
  }
}
