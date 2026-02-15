// Color utilities for the provider map, adapted from HAM's lib/utils/colors.ts

export type ColorMetric = 'avgCostIndex' | 'avgCostPerClaim' | 'avgCostPerBeneficiary' | 'totalPaid' | 'totalBeneficiaries' | 'spendingGrowthPct';

export const METRIC_LABELS: Record<ColorMetric, string> = {
  avgCostIndex: 'Cost Index',
  avgCostPerClaim: 'Avg $/Claim',
  avgCostPerBeneficiary: 'Avg $/Beneficiary',
  totalPaid: 'Total Spending',
  totalBeneficiaries: 'Beneficiaries',
  spendingGrowthPct: 'Spending Growth',
};

// 5-stop color scale: blue (low) → teal → yellow → orange → red (high)
export const SCALE_COLORS = [
  '#2563eb', // blue-600
  '#0d9488', // teal-600
  '#eab308', // yellow-500
  '#ea580c', // orange-600
  '#dc2626', // red-600
];

const NO_DATA_COLOR = '#d1d5db'; // gray-300

/**
 * Build a linear interpolation color expression for MapLibre paint properties.
 * Returns a data-driven expression: ['interpolate', ['linear'], ['get', property], stop1, color1, ...]
 */
export function buildColorExpression(
  metric: ColorMetric,
  extent: [number, number],
): unknown[] {
  const [min, max] = extent;
  if (min >= max) return NO_DATA_COLOR as unknown as unknown[];

  const step = (max - min) / 4;
  return [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', metric], min],
    min, SCALE_COLORS[0],
    min + step, SCALE_COLORS[1],
    min + step * 2, SCALE_COLORS[2],
    min + step * 3, SCALE_COLORS[3],
    max, SCALE_COLORS[4],
  ];
}

/**
 * Get a color for a single value given an extent (for legend / tooltip display).
 */
export function getColorForValue(value: number | null, extent: [number, number]): string {
  if (value == null) return NO_DATA_COLOR;
  const [min, max] = extent;
  if (min >= max) return NO_DATA_COLOR;

  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const idx = t * (SCALE_COLORS.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.min(lower + 1, SCALE_COLORS.length - 1);
  const frac = idx - lower;

  const lc = hexToRgb(SCALE_COLORS[lower]);
  const uc = hexToRgb(SCALE_COLORS[upper]);
  const r = Math.round(lc[0] + (uc[0] - lc[0]) * frac);
  const g = Math.round(lc[1] + (uc[1] - lc[1]) * frac);
  const b = Math.round(lc[2] + (uc[2] - lc[2]) * frac);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export { NO_DATA_COLOR };
