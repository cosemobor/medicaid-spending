'use client';

import { useState, useMemo, useCallback } from 'react';
import type { SortDir } from '@/types';
import SortableHeader from './SortableHeader';

export interface ColumnDef<T> {
  key: string;
  label: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  sortValue?: (row: T) => number | string | null;
  className?: string;
  headerClassName?: string;
}

interface RankedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  defaultSortKey?: string;
  defaultSortDir?: SortDir;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  selectedKey?: string | null;
}

export default function RankedTable<T>({
  data,
  columns,
  pageSize = 25,
  defaultSortKey,
  defaultSortDir = 'desc',
  onRowClick,
  rowKey,
  selectedKey,
}: RankedTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? columns[0]?.key ?? '');
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [page, setPage] = useState(1);

  const handleSort = useCallback((key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }, [sortKey]);

  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortValue) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const aVal = col.sortValue!(a);
      const bVal = col.sortValue!(b);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div>
      <div className="-mx-4 overflow-x-auto sm:mx-0 sm:rounded-lg sm:border sm:border-gray-100">
        <table className="w-full min-w-[600px] text-left">
          <thead className="border-b border-gray-100 bg-gray-50/50">
            <tr>
              <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 w-8 sm:px-3 sm:py-2.5 sm:w-10">#</th>
              {columns.map((col) => (
                col.sortValue ? (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onClick={handleSort}
                    className={col.headerClassName ?? ''}
                  />
                ) : (
                  <th key={col.key} className={`px-2 py-2 text-xs font-semibold text-gray-500 sm:px-3 sm:py-2.5 ${col.headerClassName ?? ''}`}>
                    {col.label}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-gray-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    selectedKey === key
                      ? 'bg-blue-50'
                      : onRowClick ? 'hover:bg-gray-50' : ''
                  }`}
                >
                  <td className="px-2 py-2 text-right text-xs tabular-nums text-gray-500 w-8 sm:px-3 sm:py-2.5 sm:w-10">
                    {(currentPage - 1) * pageSize + i + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-2 py-2 text-sm sm:px-3 sm:py-2.5 ${col.className ?? ''}`}>
                      {col.render(row, (currentPage - 1) * pageSize + i)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-8 text-center text-sm text-gray-500">
                  No data matches your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex flex-col items-center gap-2 px-2 sm:flex-row sm:justify-between sm:px-0">
          <p className="text-xs text-gray-500">
            {sorted.length.toLocaleString()} rows &middot; Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-md px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>
            {pageNumbers[0] > 1 && (
              <>
                <button
                  onClick={() => setPage(1)}
                  className="rounded-md px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                >
                  1
                </button>
                {pageNumbers[0] > 2 && (
                  <span className="px-1 text-xs text-gray-500">&hellip;</span>
                )}
              </>
            )}
            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  n === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {n}
              </button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-xs text-gray-500">&hellip;</span>
                )}
                <button
                  onClick={() => setPage(totalPages)}
                  className="rounded-md px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-md px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
