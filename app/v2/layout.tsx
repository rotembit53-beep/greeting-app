import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Frank_Ruhl_Libre } from 'next/font/google';
import '@/components/v2/v2.css';

/**
 * V2 layout. Scoped to /v2/* only — V1's pages keep rendering through the
 * root layout exactly as before, with none of these styles or fonts.
 */

const display = Frank_Ruhl_Libre({
  variable: '--font-v2-display',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Interagift — הפתעה שאי אפשר לשכוח',
  description:
    'צרו ברכה אינטראקטיבית ומותאמת אישית תוך פחות מדקה — עם AI, תמונות, מוזיקה ואנימציות. שלחו בלינק אחד בוואטסאפ.',
  openGraph: {
    title: 'Interagift — הפתעה שאי אפשר לשכוח ❤️',
    description:
      'צרו ברכה אינטראקטיבית ומותאמת אישית תוך פחות מדקה, ושלחו בלינק אחד.',
    type: 'website',
  },
};

export default function V2Layout({ children }: { children: ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
