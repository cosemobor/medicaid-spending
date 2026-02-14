'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import DotPlot, { type DotPlotDatum } from '@/components/DotPlot';
import RankedTable, { type ColumnDef } from '@/components/RankedTable';
import SearchInput from '@/components/SearchInput';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumber,
  formatRate,
} from '@/lib/formatters';
import { HCPCS_CATEGORY_COLORS, HCPCS_CATEGORY_ORDER } from '@/lib/hcpcs-categories';
import type { ProcedureSummary } from '@/types';

interface Props {
  procedures: ProcedureSummary[];
  totalCount: number;
  highestSpending: ProcedureSummary | undefined;
  highestCpb: ProcedureSummary | undefined;
}

export default function ProcedureExplorer({
  procedures,
  totalCount,
  highestSpending,
  highestCpb,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minSpending, setMinSpending] = useState(100_000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Get unique categories present in data, ordered
  const categories = useMemo(() => {
    const present = new Set(procedures.map((p) => p.category));
    return HCPCS_CATEGORY_ORDER.filter((c) => present.has(c));
  }, [procedures]);

  const filtered = useMemo(() => {
    return procedures.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.hcpcsCode.toLowerCase().includes(q) && !(p.description?.toLowerCase().includes(q))) return false;
      }
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (p.totalPaid < minSpending) return false;
      return true;
    });
  }, [procedures, search, selectedCategory, minSpending]);

  const dotData: DotPlotDatum[] = useMemo(() => {
    return filtered.map((p) => ({
      x: p.claimsPerBeneficiary ?? 0,
      y: p.avgCostPerBeneficiary ?? 0,
      label: p.hcpcsCode,
      category: p.category,
      id: p.hcpcsCode,
      description: p.description,
      size: p.totalPaid,
      totalPaid: p.totalPaid,
      avgCostPerClaim: p.avgCostPerClaim,
      medianCostPerClaim: p.medianCostPerClaim,
      providerCount: p.providerCount,
      totalClaims: p.totalClaims,
      totalBeneficiaries: p.totalBeneficiaries,
    }));
  }, [filtered]);

  const columns: ColumnDef<ProcedureSummary>[] = [
    {
      key: 'hcpcsCode',
      label: 'HCPCS Code',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-semibold text-blue-600">{r.hcpcsCode}</span>
          {r.description && <p className="text-xs text-gray-500 truncate max-w-[200px]" title={r.description}>{r.description}</p>}
        </div>
      ),
      sortValue: (r) => r.hcpcsCode,
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: HCPCS_CATEGORY_COLORS[r.category] ?? '#475569' }}
          />
          <span className="text-xs text-gray-600">{r.category}</span>
        </span>
      ),
      sortValue: (r) => r.category,
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
      label: 'Avg $/Claim',
      render: (r) => <span className="tabular-nums">{formatCurrency(r.avgCostPerClaim)}</span>,
      sortValue: (r) => r.avgCostPerClaim ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'avgCostPerBeneficiary',
      label: 'Avg $/Beneficiary',
      render: (r) => (
        <span className="tabular-nums">{formatCurrency(r.avgCostPerBeneficiary ?? 0)}</span>
      ),
      sortValue: (r) => r.avgCostPerBeneficiary ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'claimsPerBeneficiary',
      label: 'Claims/Bene',
      render: (r) => <span className="tabular-nums">{formatRate(r.claimsPerBeneficiary)}</span>,
      sortValue: (r) => r.claimsPerBeneficiary,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'providerCount',
      label: 'Providers',
      render: (r) => <span className="tabular-nums">{formatNumber(r.providerCount)}</span>,
      sortValue: (r) => r.providerCount,
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Medicaid Provider Spending Explorer
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          T-MSIS provider-level spending data, Jan 2018 – Dec 2024
        </p>
      </header>

      <PageNav activeTab="procedures" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Procedures"
          value={formatNumber(totalCount)}
          detail={`${formatNumber(filtered.length)} shown`}
        />
        <StatCard
          label="Highest Spending"
          value={highestSpending ? highestSpending.hcpcsCode : '--'}
          detail={
            highestSpending
              ? `${highestSpending.description ?? ''} ${formatCurrencyCompact(highestSpending.totalPaid)}`.trim()
              : undefined
          }
        />
        <StatCard
          label="Highest $/Beneficiary"
          value={highestCpb ? highestCpb.hcpcsCode : '--'}
          detail={
            highestCpb
              ? `${formatCurrency(highestCpb.avgCostPerBeneficiary ?? 0)} per beneficiary`
              : undefined
          }
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search code or description..."
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                selectedCategory === cat
                  ? { backgroundColor: HCPCS_CATEGORY_COLORS[cat] }
                  : undefined
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          Min spending:
          <select
            value={minSpending}
            onChange={(e) => setMinSpending(Number(e.target.value))}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs"
          >
            <option value={0}>Any</option>
            <option value={10000}>$10K+</option>
            <option value={100000}>$100K+</option>
            <option value={1000000}>$1M+</option>
            <option value={10000000}>$10M+</option>
            <option value={100000000}>$100M+</option>
          </select>
        </label>
      </div>

      {/* Dot Plot */}
      <div className="mt-6">
        <DotPlot
          data={dotData}
          xLabel="Claims per Beneficiary"
          yLabel="Avg $ / Beneficiary"
          title="Procedure Utilization vs Cost per Beneficiary"
          subtitle="Each dot is a procedure code. Size = total spending. Color = HCPCS category."
          xFormatter={(v) => v.toFixed(1)}
          yFormatter={(v) => formatCurrencyCompact(v)}
          categoryColors={HCPCS_CATEGORY_COLORS}
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
              <p className="font-mono text-sm font-bold text-gray-900">{d.label}</p>
              {d.description ? <p className="text-xs text-gray-600">{String(d.description)}</p> : null}
              <p className="text-xs text-gray-500">{d.category}</p>
              <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.totalPaid as number)}</span></p>
                <p>Avg $/Claim: <span className="font-semibold">{formatCurrency(d.avgCostPerClaim as number)}</span></p>
                <p>Avg $/Beneficiary: <span className="font-semibold">{formatCurrency(d.y)}</span></p>
                <p>Claims/Beneficiary: <span className="font-semibold">{(d.x).toFixed(1)}</span></p>
                <p>Providers: <span className="font-semibold">{formatNumber(d.providerCount as number)}</span></p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Ranked Table */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Procedure Rankings
        </h3>
        <RankedTable
          data={filtered}
          columns={columns}
          defaultSortKey="totalPaid"
          defaultSortDir="desc"
          rowKey={(r) => r.hcpcsCode}
          selectedKey={selectedId}
          onRowClick={(r) => router.push(`/procedures/${r.hcpcsCode}`)}
        />
      </div>
    </div>
  );
}
