'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumberCompact,
  formatPercent,
} from '@/lib/formatters';
import SparklineChart from '@/components/SparklineChart';
import type { ProviderSummary } from '@/types';

interface ProviderInfoPanelProps {
  provider: ProviderSummary;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function ProviderInfoPanel({ provider, onClose }: ProviderInfoPanelProps) {
  const p = provider;
  const [monthly, setMonthly] = useState<{ month: string; totalPaid: number }[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingMonthly(true);
    setMonthly([]);

    fetch(`/api/providers/${p.npi}/monthly`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMonthly(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMonthly(false);
      });

    return () => { cancelled = true; };
  }, [p.npi]);

  return (
    <div className="absolute right-2 top-3 z-20 w-64 sm:right-4 sm:top-16 sm:w-80">
      <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-white shadow-lg sm:max-h-[70vh]">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-3 py-2 sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {p.name ?? 'Unknown Provider'}
            </h3>
            <p className="text-xs text-gray-500">NPI: {p.npi}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 px-3 py-3 text-xs sm:px-4">
          {p.state && (
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {p.state}
              </span>
            </div>
          )}

          <div className="rounded bg-gray-50 px-2.5 py-2">
            <Row label="Total Spending" value={formatCurrencyCompact(p.totalPaid) ?? '—'} />
            <Row label="Cost Index" value={p.avgCostIndex != null ? `${p.avgCostIndex.toFixed(2)}x` : '—'} />
            <Row label="Avg $/Claim" value={formatCurrency(p.avgCostPerClaim) ?? '—'} />
            <Row label="Avg $/Beneficiary" value={formatCurrency(p.avgCostPerBeneficiary) ?? '—'} />
            <Row label="Beneficiaries" value={formatNumberCompact(p.totalBeneficiaries) ?? '—'} />
            <Row label="Total Claims" value={formatNumberCompact(p.totalClaims) ?? '—'} />
            <Row label="Procedures" value={String(p.procedureCount)} />
          </div>

          {/* Spending Timeline */}
          <div className="rounded bg-gray-50 px-2.5 py-2">
            <p className="mb-1 text-[10px] font-medium text-gray-500">Monthly Spending</p>
            {loadingMonthly ? (
              <div className="flex h-[80px] items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              </div>
            ) : monthly.length > 0 ? (
              <SparklineChart
                data={monthly}
                dataKey="totalPaid"
                formatter={(v) => formatCurrencyCompact(v) ?? '—'}
              />
            ) : (
              <p className="py-2 text-center text-[10px] text-gray-400">No timeline data</p>
            )}
          </div>

          {(p.spendingGrowthPct != null || p.costPerClaimGrowthPct != null) && (
            <div className="rounded bg-gray-50 px-2.5 py-2">
              <p className="mb-1 text-[10px] font-medium text-gray-500">Growth Trends</p>
              {p.spendingGrowthPct != null && (
                <Row label="Spending Growth" value={formatPercent(p.spendingGrowthPct) ?? '—'} />
              )}
              {p.costPerClaimGrowthPct != null && (
                <Row label="Cost/Claim Growth" value={formatPercent(p.costPerClaimGrowthPct) ?? '—'} />
              )}
              {p.volumeGrowthPct != null && (
                <Row label="Volume Growth" value={formatPercent(p.volumeGrowthPct) ?? '—'} />
              )}
            </div>
          )}

          <Link
            href={`/providers/${p.npi}`}
            className="block rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            View Full Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
