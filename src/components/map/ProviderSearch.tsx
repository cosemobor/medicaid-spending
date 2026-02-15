'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { ProviderSummary } from '@/types';

interface ProviderSearchProps {
  providers: ProviderSummary[];
  onSelect: (provider: ProviderSummary) => void;
}

const MAX_RESULTS = 8;

export default function ProviderSearch({ providers, onSelect }: ProviderSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProviderSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build Fuse.js index once
  const fuse = useMemo(
    () =>
      new Fuse(providers, {
        keys: [
          { name: 'name', weight: 0.6 },
          { name: 'npi', weight: 0.3 },
          { name: 'state', weight: 0.1 },
        ],
        threshold: 0.35,
        includeScore: true,
      }),
    [providers],
  );

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      setHighlightIndex(-1);
      if (!value.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }
      const hits = fuse.search(value, { limit: MAX_RESULTS });
      setResults(hits.map((h) => h.item));
      setOpen(hits.length > 0);
    },
    [fuse],
  );

  const handleSelect = useCallback(
    (provider: ProviderSummary) => {
      setQuery(provider.name ?? provider.npi);
      setOpen(false);
      setResults([]);
      onSelect(provider);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-[44px] top-3 z-10 w-[calc(100%-56px)] max-w-[288px] sm:left-[50px] sm:w-72"
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search providers..."
          className="w-full rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 pl-9 text-base text-gray-900 shadow-lg backdrop-blur-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 sm:py-2 sm:text-sm"
        />
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {open && results.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg sm:max-h-60">
          {results.map((p, i) => (
            <li key={p.npi}>
              <div
                onMouseDown={() => handleSelect(p)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`cursor-pointer px-3 py-2 ${
                  i === highlightIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm">{p.name ?? p.npi}</div>
                <div className="text-[11px] text-gray-400">
                  NPI: {p.npi}{p.state ? ` · ${p.state}` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          No results found
        </div>
      )}
    </div>
  );
}
