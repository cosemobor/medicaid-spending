'use client';

import Link from 'next/link';
import type { ViewTab } from '@/types';

const TABS: { key: ViewTab; label: string; href: string }[] = [
  { key: 'overview', label: 'Overview', href: '/' },
  { key: 'procedures', label: 'Procedures', href: '/procedures' },
  { key: 'states', label: 'States', href: '/states' },
  { key: 'providers', label: 'Providers', href: '/providers' },
  { key: 'anomalies', label: 'Anomalies', href: '/anomalies' },
];

interface PageNavProps {
  activeTab: ViewTab;
}

export default function PageNav({ activeTab }: PageNavProps) {
  return (
    <nav className="mb-6 flex items-center gap-1 border-b border-gray-100 pb-3">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </Link>
      ))}
      <Link
        href="/about"
        className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        About
      </Link>
    </nav>
  );
}
