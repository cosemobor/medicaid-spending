'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import DotPlot, { type DotPlotDatum } from '@/components/DotPlot';
import RankedTable, { type ColumnDef } from '@/components/RankedTable';
import SearchInput from '@/components/SearchInput';
import ProviderMapWrapper from '@/components/map/ProviderMapWrapper';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumberCompact,
  formatNumber,
  formatPercent,
} from '@/lib/formatters';
import DataQualityBanner from '@/components/DataQualityBanner';
import type { ProviderSummary } from '@/types';

interface Props {
  providers: ProviderSummary[];
  totalCount: number;
  initialProviderNpi?: string;
  initialView?: 'map' | 'list';
}

export default function ProviderExplorer({ providers, totalCount, initialProviderNpi, initialView = 'map' }: Props) {
  const router = useRouter();
  const [view, setView] = useState<'map' | 'list'>(initialView);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return providers;
    const q = search.toLowerCase();
    return providers.filter((p) => p.npi.includes(q) || (p.name?.toLowerCase().includes(q) ?? false));
  }, [providers, search]);

  const dotData: DotPlotDatum[] = useMemo(() => {
    return filtered.map((p) => ({
      x: p.avgCostPerClaim ?? 0,
      y: p.totalPaid,
      label: p.name ?? p.npi,
      id: p.npi,
      providerName: p.name,
      npi: p.npi,
      category:
        (p.spendingGrowthPct ?? 0) > 20
          ? 'High Growth (>20%)'
          : (p.spendingGrowthPct ?? 0) > 0
          ? 'Moderate Growth'
          : (p.spendingGrowthPct ?? 0) > -20
          ? 'Moderate Decline'
          : 'Sharp Decline (<-20%)',
      state: p.state,
      totalClaims: p.totalClaims,
      totalBeneficiaries: p.totalBeneficiaries,
      procedureCount: p.procedureCount,
      spendingGrowthPct: p.spendingGrowthPct,
      costPerClaimGrowthPct: p.costPerClaimGrowthPct,
      topProcedure: p.topProcedure,
    }));
  }, [filtered]);

  const growthColors: Record<string, string> = {
    'High Growth (>20%)': '#dc2626',
    'Moderate Growth': '#f97316',
    'Moderate Decline': '#22c55e',
    'Sharp Decline (<-20%)': '#059669',
  };

  const columns: ColumnDef<ProviderSummary>[] = [
    {
      key: 'npi',
      label: 'Provider',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-600">{r.npi}</span>
          {r.name && <p className="text-xs text-gray-500 truncate max-w-[200px]" title={r.name}>{r.name}</p>}
        </div>
      ),
      sortValue: (r) => r.name ?? r.npi,
    },
    {
      key: 'state',
      label: 'State',
      render: (r) => <span className="text-xs">{r.state ?? '—'}</span>,
      sortValue: (r) => r.state ?? '',
    },
    {
      key: 'totalPaid',
      label: 'Total Paid',
      render: (r) => <span className="tabular-nums">{formatCurrencyCompact(r.totalPaid)}</span>,
      sortValue: (r) => r.totalPaid,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'avgCostPerClaim',
      label: '$/Claim',
      render: (r) => <span className="tabular-nums">{formatCurrency(r.avgCostPerClaim ?? 0)}</span>,
      sortValue: (r) => r.avgCostPerClaim ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'avgCostPerBeneficiary',
      label: '$/Beneficiary',
      render: (r) => (
        <span className="tabular-nums">{formatCurrency(r.avgCostPerBeneficiary ?? 0)}</span>
      ),
      sortValue: (r) => r.avgCostPerBeneficiary ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'spendingGrowthPct',
      label: 'Spending Growth',
      render: (r) => {
        const g = r.spendingGrowthPct;
        if (g == null) return <span className="text-gray-400">—</span>;
        const color = g > 0 ? 'text-red-600' : 'text-green-600';
        return <span className={`tabular-nums font-semibold ${color}`}>{formatPercent(g)}</span>;
      },
      sortValue: (r) => r.spendingGrowthPct ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'costPerClaimGrowthPct',
      label: '$/Claim Growth',
      render: (r) => {
        const g = r.costPerClaimGrowthPct;
        if (g == null) return <span className="text-gray-400">—</span>;
        const color = g > 0 ? 'text-red-600' : 'text-green-600';
        return <span className={`tabular-nums font-semibold ${color}`}>{formatPercent(g)}</span>;
      },
      sortValue: (r) => r.costPerClaimGrowthPct ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'procedureCount',
      label: 'Procedures',
      render: (r) => <span className="tabular-nums">{formatNumber(r.procedureCount)}</span>,
      sortValue: (r) => r.procedureCount,
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  if (view === 'map') {
    return (
      <div className="flex h-screen flex-col">
        <div className="shrink-0 px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-lg font-bold text-gray-900">
                Medicaid Provider Spending Explorer
              </h1>
              <ViewToggle view={view} onChange={setView} />
            </div>
            <PageNav activeTab="providers" />
            <DataQualityBanner />
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ProviderMapWrapper providers={providers} initialProviderNpi={initialProviderNpi} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Medicaid Provider Spending Explorer
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Top 10,000 providers by total spending (~61% of all Medicaid fee-for-service spending), Jan 2018 – Dec 2024
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </header>

      <PageNav activeTab="providers" />

      <DataQualityBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Providers Tracked"
          value={formatNumberCompact(totalCount)}
          detail={`${formatNumber(filtered.length)} shown`}
        />
        <StatCard
          label="Top Provider"
          value={providers[0]?.name ?? providers[0]?.npi ?? '--'}
          detail={
            providers[0]
              ? `${formatCurrencyCompact(providers[0].totalPaid)} total`
              : undefined
          }
          subValue={providers[0]?.state ?? undefined}
        />
        <StatCard
          label="Top 10 Spending"
          value={formatCurrencyCompact(
            providers.slice(0, 10).reduce((s, p) => s + p.totalPaid, 0)
          )}
          detail="Combined top 10 providers"
        />
      </div>

      {/* Search */}
      <div className="mt-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search NPI or name..."
        />
      </div>

      {/* Dot Plot */}
      <div className="mt-6">
        <DotPlot
          data={dotData}
          xLabel="Avg $/Claim"
          yLabel="Total Paid ($)"
          title="Provider Cost per Claim vs Total Spending"
          subtitle="Each dot is a provider. Color = spending growth trend direction."
          xFormatter={(v) => formatCurrencyCompact(v)}
          yFormatter={(v) => formatCurrencyCompact(v)}
          categoryColors={growthColors}
          selectedId={selectedId}
          onDotClick={(d) => {
            if (d.id === selectedId || !d.id) {
              setSelectedId(null);
            } else {
              setSelectedId(d.id);
            }
          }}
          renderTooltip={(d) => (
            <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
              {d.providerName ? <p className="text-sm font-semibold text-gray-900">{String(d.providerName)}</p> : null}
              <p className="font-mono text-xs text-gray-500">{d.npi as string}</p>
              {'state' in d && d.state ? <p className="text-xs text-gray-500">{String(d.state)}</p> : null}
              <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                <p>$/Claim: <span className="font-semibold">{formatCurrency(d.x)}</span></p>
                <p>Spending Growth: <span className="font-semibold">{formatPercent(d.spendingGrowthPct as number)}</span></p>
                <p>$/Claim Growth: <span className="font-semibold">{formatPercent(d.costPerClaimGrowthPct as number)}</span></p>
                <p>Top Procedure: <span className="font-semibold font-mono">{d.topProcedure as string ?? '—'}</span></p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Ranked Table */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Provider Rankings</h3>
        <RankedTable
          data={filtered}
          columns={columns}
          defaultSortKey="totalPaid"
          defaultSortDir="desc"
          rowKey={(r) => r.npi}
          selectedKey={selectedId}
          onRowClick={(r) => router.push(`/providers/${r.npi}`)}
        />
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: 'map' | 'list'; onChange: (v: 'map' | 'list') => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5">
      <button
        onClick={() => onChange('map')}
        className={`rounded-md p-1.5 transition-colors ${
          view === 'map' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'
        }`}
        title="Map view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </button>
      <button
        onClick={() => onChange('list')}
        className={`rounded-md p-1.5 transition-colors ${
          view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600'
        }`}
        title="List view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>
    </div>
  );
}
