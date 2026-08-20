import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getGreetingBySlug, incrementCounter } from '@/lib/v2/db';
import { isValidSlug } from '@/lib/v2/slug';
import { toPublicGreeting } from '@/lib/v2/types';
import GreetingExperience from '@/components/v2/experience/GreetingExperience';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * The absolute origin this request came in on.
 *
 * Open Graph crawlers (WhatsApp above all) refuse relative image URLs, and
 * `metadataBase` can't help here: there's no fixed deploy URL in the config,
 * so the only thing that's right in dev, on a workers.dev preview and on the
 * production domain alike is the host the request actually arrived on.
 * `NEXT_PUBLIC_SITE_URL` overrides it when a canonical domain is set.
 */
async function requestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/**
 * Open Graph matters more here than anywhere else in the product — this URL
 * is pasted straight into WhatsApp, and the preview card is the first thing
 * the recipient sees.
 *
 * The card is deliberately the Interagift wordmark, never a photo out of the
 * greeting: that photo is the surprise, and a link preview would spoil it in
 * the chat list before the recipient ever taps.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) return { title: 'Interagift' };

  const greeting = await getGreetingBySlug(slug);
  if (!greeting) return { title: 'Interagift' };

  const title = `🎁 ${greeting.recipientName}, מחכה לך הפתעה`;
  const description = greeting.senderName
    ? `${greeting.senderName} הכין/ה לך משהו מיוחד. פתחו כאן ❤️`
    : 'מישהו הכין לך הפתעה אישית. פתחו כאן ❤️';

  const image = {
    url: `${await requestOrigin()}/og.jpg`,
    width: 1200,
    height: 630,
    alt: 'Interagift',
    type: 'image/jpeg',
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
    // A surprise link should never show up in search results.
    robots: { index: false, follow: false },
  };
}

export default async function GreetingPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isValidSlug(slug)) notFound();

  const greeting = await getGreetingBySlug(slug);
  if (!greeting) notFound();

  // A page load is a "view"; actually opening the gate is tracked separately
  // from the client as an "open".
  await incrementCounter(slug, 'viewCount');

  return <GreetingExperience greeting={toPublicGreeting(greeting)} />;
}
