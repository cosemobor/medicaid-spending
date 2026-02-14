export function formatCurrency(value: number | null): string {
  if (value == null) return '\u2014';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyCompact(value: number | null): string {
  if (value == null) return '\u2014';
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number | null): string {
  if (value == null) return '\u2014';
  return value.toLocaleString();
}

export function formatNumberCompact(value: number | null): string {
  if (value == null) return '\u2014';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString();
}

export function formatPercent(value: number | null): string {
  if (value == null) return '\u2014';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatIndex(value: number | null): string {
  if (value == null) return '\u2014';
  return `${value.toFixed(2)}x`;
}

export function formatCostIndex(value: number | null, nominal: number | null, median: number | null): string {
  if (value == null) return '\u2014';
  const indexStr = `${value.toFixed(2)}x`;
  if (nominal != null && median != null) {
    return `${indexStr} (${formatCurrency(nominal)} vs ${formatCurrency(median)} median)`;
  }
  return indexStr;
}

export function formatRate(value: number | null): string {
  if (value == null) return '\u2014';
  return value.toFixed(1);
}
