'use client';

import Link from 'next/link';

interface DataQualityBannerProps {
  message?: string;
}

export default function DataQualityBanner({
  message = 'November and December 2024 data may be incomplete due to CMS reporting delays (typically 3\u20136 months for full coverage).',
}: DataQualityBannerProps) {
  return (
    <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
      <strong>Data note:</strong> {message}{' '}
      <Link href="/about" className="font-medium text-amber-900 underline hover:text-amber-700">
        Learn more
      </Link>
    </div>
  );
}
