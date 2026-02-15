import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://medicaid-spending.vercel.app'),
  title: 'Medicaid Provider Spending Explorer',
  description:
    'Explore T-MSIS Medicaid provider spending data — trends, patterns, and statistical anomalies across procedures, states, and providers (Jan 2018–Dec 2024).',
  openGraph: {
    title: 'Medicaid Provider Spending Explorer',
    description:
      'Explore T-MSIS Medicaid provider spending data — trends, patterns, and statistical anomalies across procedures, states, and providers (Jan 2018–Dec 2024).',
    siteName: 'Medicaid Provider Spending Explorer',
    url: 'https://medicaid-spending.vercel.app',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Medicaid Provider Spending Explorer — Explore T-MSIS spending data across procedures, states, and providers',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medicaid Provider Spending Explorer',
    description:
      'Explore CMS T-MSIS Medicaid provider spending data across 57 states & territories.',
    creator: '@calebosemobor',
    images: [
      {
        url: '/twitter-image',
        width: 1200,
        height: 630,
        alt: 'Medicaid Provider Spending Explorer — Explore T-MSIS spending data across procedures, states, and providers',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
