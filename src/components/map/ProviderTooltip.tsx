'use client';

import type { ColorMetric } from './colors';
import { METRIC_LABELS } from './colors';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumberCompact,
  formatPercent,
} from '@/lib/formatters';

export interface TooltipData {
  name: string;
  npi: string;
  state: string | null;
  value: number | null;
  metric: ColorMetric;
}

interface ProviderTooltipProps {
  data: TooltipData | null;
  x: number;
  y: number;
}

function formatMetricValue(value: number | null, metric: ColorMetric): string {
  if (value == null) return 'No data';
  switch (metric) {
    case 'avgCostIndex':
      return `${value.toFixed(2)}x`;
    case 'avgCostPerClaim':
    case 'avgCostPerBeneficiary':
      return formatCurrency(value) ?? '—';
    case 'totalPaid':
      return formatCurrencyCompact(value) ?? '—';
    case 'totalBeneficiaries':
      return formatNumberCompact(value) ?? '—';
    case 'spendingGrowthPct':
      return formatPercent(value) ?? '—';
  }
}

export default function ProviderTooltip({ data, x, y }: ProviderTooltipProps) {
  if (!data) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg"
      style={{ left: x + 12, top: y - 12 }}
    >
      <p className="text-sm font-semibold text-gray-900">
        {data.name || data.npi}
      </p>
      {data.state && (
        <p className="text-xs text-gray-500">{data.state}</p>
      )}
      <p className="mt-0.5 text-xs text-gray-600">
        {METRIC_LABELS[data.metric]}: {formatMetricValue(data.value, data.metric)}
      </p>
    </div>
  );
}
