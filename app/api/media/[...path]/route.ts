import { NextRequest, NextResponse } from 'next/server';
import { getObject } from '@/lib/media';

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

// Parsed manually into a plain object instead of forwarding the Headers
// instance to R2's get() — @opennextjs/cloudflare's local dev shim runs the
// R2 simulator in a separate realm, so passing a Next.js Headers instance
// across that boundary fails an internal instanceof check (throws in dev
// only; a plain object crosses fine).
function parseRangeHeader(header: string | null): R2Range | undefined {
  if (!header) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return undefined;

  const [, startStr, endStr] = match;
  if (startStr === '') {
    if (endStr === '') return undefined;
    return { suffix: parseInt(endStr, 10) } as R2Range;
  }

  const offset = parseInt(startStr, 10);
  if (endStr === '') return { offset } as R2Range;

  const end = parseInt(endStr, 10);
  return { offset, length: end - offset + 1 } as R2Range;
}

function resolveRange(
  range: R2Range | undefined,
  size: number
): { start: number; end: number } | null {
  if (!range) return null;

  // R2Range objects declare all three possible fields (offset/length/suffix),
  // with the unused ones present but `undefined` — so `'suffix' in range`
  // matches every shape. Branch on the value instead.
  const loose = range as { offset?: number; length?: number; suffix?: number };

  if (typeof loose.suffix === 'number') {
    const start = Math.max(0, size - loose.suffix);
    return { start, end: size - 1 };
  }

  const start = loose.offset ?? 0;
  const length = loose.length ?? size - start;
  const end = Math.min(size, start + length) - 1;
  return { start, end };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const key = path.join('/');

  const rangeHeader = req.headers.get('range');
  const object = await getObject(key, parseRangeHeader(rangeHeader));

  if (!object) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Built manually instead of object.writeHttpMetadata(headers) — same
  // instanceof-across-realms issue as above in local dev.
  const headers = new Headers();
  const meta = object.httpMetadata;
  if (meta?.contentType) headers.set('content-type', meta.contentType);
  if (meta?.contentLanguage) headers.set('content-language', meta.contentLanguage);
  if (meta?.contentDisposition) headers.set('content-disposition', meta.contentDisposition);
  if (meta?.contentEncoding) headers.set('content-encoding', meta.contentEncoding);
  headers.set('etag', object.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  // R2 always populates object.range (even for a full-object read), so only
  // treat this as partial content when the client actually sent a Range header.
  const resolved = rangeHeader ? resolveRange(object.range, object.size) : null;

  if (resolved) {
    headers.set('content-range', `bytes ${resolved.start}-${resolved.end}/${object.size}`);
    headers.set('content-length', String(resolved.end - resolved.start + 1));
    return new NextResponse(object.body, { status: 206, headers });
  }

  headers.set('content-length', String(object.size));
  return new NextResponse(object.body, { status: 200, headers });
}
