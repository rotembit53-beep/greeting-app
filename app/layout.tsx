import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "Interagift — ברכות אישיות",
  description:
    "Interagift — יוצרים ברכה אישית ומרגשת עם טקסט מותאם, מוזיקה ותמונות, ומשתפים בקליק",
  openGraph: {
    title: "Interagift — ברכות אישיות",
    description:
      "יוצרים ברכה אישית ומרגשת עם טקסט מותאם, מוזיקה ותמונות, ומשתפים בקליק",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
