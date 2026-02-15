'use client';

import dynamic from 'next/dynamic';
import type { ProviderSummary } from '@/types';

const ProviderMapGL = dynamic(() => import('./ProviderMapGL'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

interface Props {
  providers: ProviderSummary[];
  initialProviderNpi?: string;
}

export default function ProviderMapWrapper({ providers, initialProviderNpi }: Props) {
  return <ProviderMapGL providers={providers} initialProviderNpi={initialProviderNpi} />;
}
