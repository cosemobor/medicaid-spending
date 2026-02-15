'use client';

import { useState } from 'react';
import { type ColorMetric, METRIC_LABELS, SCALE_COLORS } from './colors';

interface MapLegendProps {
  activeMetric: ColorMetric;
  extent: [number, number];
}

function formatLegendValue(value: number, metric: ColorMetric): string {
  switch (metric) {
    case 'avgCostIndex':
      return `${value.toFixed(1)}x`;
    case 'avgCostPerClaim':
    case 'avgCostPerBeneficiary':
      return value >= 1000 ? `$${(value / 1000).toFixed(0)}K` : `$${value.toFixed(0)}`;
    case 'totalPaid':
      if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'totalBeneficiaries':
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
      return value.toFixed(0);
    case 'spendingGrowthPct':
      return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
  }
}

export default function MapLegend({ activeMetric, extent }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  const [min, max] = extent;
  const hasData = min < max;

  return (
    <div className="absolute bottom-4 left-3 z-10 sm:bottom-6 sm:left-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-1 rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-900 shadow backdrop-blur-sm sm:hidden"
      >
        {collapsed ? 'Show Legend' : 'Hide Legend'}
      </button>

      <div
        className={`rounded-lg bg-white/90 shadow-lg backdrop-blur-sm transition-all ${
          collapsed ? 'hidden sm:block' : 'block'
        }`}
      >
        <div className="px-2 py-1.5 sm:px-3 sm:py-2">
          <p className="mb-1.5 text-[10px] font-semibold text-gray-900 sm:text-xs">
            {METRIC_LABELS[activeMetric]}
          </p>

          {hasData ? (
            <>
              {/* Color gradient bar */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-500">
                  {formatLegendValue(min, activeMetric)}
                </span>
                <div
                  className="h-3 w-24 rounded-sm"
                  style={{
                    background: `linear-gradient(to right, ${SCALE_COLORS.join(', ')})`,
                  }}
                />
                <span className="text-[9px] text-gray-500">
                  {formatLegendValue(max, activeMetric)}
                </span>
              </div>

              {/* Size scale */}
              <div className="mt-2 flex items-center gap-2 text-[9px] text-gray-500">
                <span>Size = Spending</span>
                <svg width="50" height="16" viewBox="0 0 50 16">
                  <circle cx="6" cy="8" r={3} fill="#9ca3af" opacity={0.5} />
                  <circle cx="20" cy="8" r={5} fill="#9ca3af" opacity={0.5} />
                  <circle cx="38" cy="8" r={8} fill="#9ca3af" opacity={0.5} />
                </svg>
              </div>
            </>
          ) : (
            <p className="text-[9px] text-gray-400">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
