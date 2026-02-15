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
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medicaid Provider Spending Explorer',
    description:
      'Explore CMS T-MSIS Medicaid provider spending data across 57 states & territories.',
    creator: '@calebosemobor',
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
