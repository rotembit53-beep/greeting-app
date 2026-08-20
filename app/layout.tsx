import type { Metadata } from 'next';
import { Heebo, Frank_Ruhl_Libre, Assistant } from 'next/font/google';
import './globals.css';
import '@/components/v2/v2.css';

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['hebrew', 'latin'],
});

/** Display serif used by the templates that ask for one. */
const display = Frank_Ruhl_Libre({
  variable: '--font-v2-display',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

/**
 * Text face for V2 UI copy. Assistant is drawn for Hebrew rather than
 * retro-fitted to it — its narrower counters and taller x-height hold up at
 * the small tag/caption sizes where Heebo starts to feel generic, and it
 * pairs with Frank Ruhl Libre the way a grotesque pairs with a serif in
 * print. Scoped to `.v2-scope` in v2.css, so V1 pages keep Heebo untouched.
 */
const sans = Assistant({
  variable: '--font-v2-sans',
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Interagift — הפתעה שאי אפשר לשכוח',
  description:
    'צרו ברכה אינטראקטיבית ומותאמת אישית תוך פחות מדקה — עם AI, תמונות, מוזיקה ואנימציות. שלחו בלינק אחד בוואטסאפ.',
  openGraph: {
    title: 'Interagift — הפתעה שאי אפשר לשכוח ❤️',
    description:
      'צרו ברכה אינטראקטיבית ומותאמת אישית תוך פחות מדקה, ושלחו אותה בלינק אחד.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
