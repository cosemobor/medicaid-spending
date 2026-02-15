'use client';

import { useState } from 'react';
import { type ColorMetric, METRIC_LABELS } from './colors';

interface MetricToggleProps {
  active: ColorMetric;
  onChange: (metric: ColorMetric) => void;
}

const METRICS: { key: ColorMetric; label: string }[] = [
  { key: 'avgCostIndex', label: 'Cost Index' },
  { key: 'avgCostPerClaim', label: 'Avg $/Claim' },
  { key: 'avgCostPerBeneficiary', label: 'Avg $/Beneficiary' },
  { key: 'totalPaid', label: 'Total Spending' },
  { key: 'totalBeneficiaries', label: 'Beneficiaries' },
  { key: 'spendingGrowthPct', label: 'Spending Growth' },
];

export default function MetricToggle({ active, onChange }: MetricToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:right-4 sm:top-3 sm:translate-x-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-900 shadow-lg backdrop-blur-sm transition-colors hover:bg-white sm:px-4 sm:py-2 sm:text-sm"
      >
        <span>{METRIC_LABELS[active]}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:translate-x-0">
            <ul className="min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {METRICS.map((m) => (
                <li key={m.key}>
                  <button
                    onClick={() => {
                      onChange(m.key);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors sm:text-sm ${
                      active === m.key
                        ? 'bg-gray-50 font-medium text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{m.label}</span>
                    {active === m.key && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
