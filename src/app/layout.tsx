import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medicaid Provider Spending Explorer",
  description:
    "Explore T-MSIS Medicaid provider spending data — trends, patterns, and statistical anomalies across procedures, states, and providers (Jan 2018–Dec 2024).",
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
