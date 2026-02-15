'use client';

import Link from 'next/link';
import type { ViewTab } from '@/types';

const TABS: { key: ViewTab; label: string; href: string }[] = [
  { key: 'overview', label: 'Overview', href: '/' },
  { key: 'providers', label: 'Providers', href: '/providers' },
  { key: 'procedures', label: 'Procedures', href: '/procedures' },
  { key: 'anomalies', label: 'Anomalies', href: '/anomalies' },
  { key: 'states', label: 'States', href: '/states' },
];

interface PageNavProps {
  activeTab: ViewTab;
}

export default function PageNav({ activeTab }: PageNavProps) {
  return (
    <nav className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-gray-100 pb-3 scrollbar-hide">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
        className="ml-auto shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        About
      </Link>
    </nav>
  );
}
