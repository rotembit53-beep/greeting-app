import { getCloudflareContext } from '@opennextjs/cloudflare';

async function bucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.MEDIA_BUCKET;
}

export async function putObject(
  key: string,
  data: ArrayBuffer,
  contentType: string
): Promise<void> {
  const b = await bucket();
  await b.put(key, data, { httpMetadata: { contentType } });
}

export async function getObject(
  key: string,
  range?: R2Range
): Promise<R2ObjectBody | null> {
  const b = await bucket();
  return b.get(key, range ? { range } : undefined);
}

export async function deleteObject(key: string): Promise<void> {
  const b = await bucket();
  await b.delete(key);
}

export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}
