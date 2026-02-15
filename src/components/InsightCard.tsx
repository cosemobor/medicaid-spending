import Link from 'next/link';

const COLOR_MAP = {
  blue: 'border-l-blue-500 bg-blue-50/50',
  red: 'border-l-red-500 bg-red-50/50',
  green: 'border-l-green-500 bg-green-50/50',
  purple: 'border-l-purple-500 bg-purple-50/50',
} as const;

interface InsightCardProps {
  href: string;
  title: string;
  value: string;
  subtitle: string;
  color: keyof typeof COLOR_MAP;
}

export default function InsightCard({ href, title, value, subtitle, color }: InsightCardProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-lg border border-l-4 border-gray-100 px-4 py-3 shadow-sm transition-shadow hover:shadow-md ${COLOR_MAP[color]}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="mt-0.5 truncate text-lg font-bold text-gray-900">{value}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
      </div>
      <svg
        className="ml-3 h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
