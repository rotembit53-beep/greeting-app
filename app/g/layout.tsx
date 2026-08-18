import type { ReactNode } from 'react';
import { Frank_Ruhl_Libre } from 'next/font/google';
import '@/components/v2/v2.css';

/**
 * Layout for the recipient route (/g/<slug>).
 *
 * Deliberately separate from V1's pages: it only adds the V2 display face and
 * the V2 stylesheet, both scoped, so V1 renders exactly as it did before.
 */

const display = Frank_Ruhl_Libre({
  variable: '--font-v2-display',
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

export default function GreetingLayout({ children }: { children: ReactNode }) {
  return <div className={display.variable}>{children}</div>;
}
