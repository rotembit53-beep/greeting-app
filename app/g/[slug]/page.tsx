import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGreetingBySlug, incrementCounter } from '@/lib/v2/db';
import { isValidSlug } from '@/lib/v2/slug';
import { toPublicGreeting } from '@/lib/v2/types';
import GreetingExperience from '@/components/v2/experience/GreetingExperience';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Open Graph matters more here than anywhere else in the product — this URL
 * is pasted straight into WhatsApp, and the preview card is the first thing
 * the recipient sees.
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

  const firstImage = greeting.media.find((m) => m.type === 'image')?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: firstImage ? [{ url: firstImage }] : undefined,
    },
    twitter: {
      card: firstImage ? 'summary_large_image' : 'summary',
      title,
      description,
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
