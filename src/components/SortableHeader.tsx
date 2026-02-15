import type { SortDir } from '@/types';

interface SortableHeaderProps<K extends string> {
  label: React.ReactNode;
  sortKey: K;
  currentSortKey: K;
  currentSortDir: SortDir;
  onClick: (key: K) => void;
  className?: string;
}

export default function SortableHeader<K extends string>({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onClick,
  className = '',
}: SortableHeaderProps<K>) {
  const isActive = sortKey === currentSortKey;
  return (
    <th
      className={`cursor-pointer select-none px-2 py-2 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900 sm:px-3 sm:py-2.5 ${className}`}
      onClick={() => onClick(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-gray-900">
            {currentSortDir === 'asc' ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </span>
    </th>
  );
}
