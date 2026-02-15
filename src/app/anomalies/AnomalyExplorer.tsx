'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import DotPlot, { type DotPlotDatum } from '@/components/DotPlot';
import RankedTable, { type ColumnDef } from '@/components/RankedTable';
import SearchInput from '@/components/SearchInput';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumber,
  formatIndex,
} from '@/lib/formatters';
import InfoTip from '@/components/InfoTip';
import type { Outlier } from '@/types';

interface Props {
  outliers: Outlier[];
  totalCount: number;
  highCount: number;
  lowCount: number;
}

export default function AnomalyExplorer({
  outliers,
  totalCount,
  highCount,
  lowCount,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return outliers.filter((o) => {
      if (search) {
        const q = search.toLowerCase();
        if (!o.npi.includes(q) && !o.hcpcsCode.toLowerCase().includes(q)
            && !(o.providerName?.toLowerCase().includes(q))
            && !(o.hcpcsDescription?.toLowerCase().includes(q))) return false;
      }
      if (filter === 'high' && (o.costIndex ?? 0) <= 2.0) return false;
      if (filter === 'low' && (o.costIndex ?? 0) >= 0.5) return false;
      return true;
    });
  }, [outliers, search, filter]);

  const dotData: DotPlotDatum[] = useMemo(() => {
    return filtered.map((o) => ({
      x: o.costIndex ?? 0,
      y: o.totalPaid,
      label: o.providerName ?? o.npi,
      id: `${o.npi}|${o.hcpcsCode}`,
      category: (o.costIndex ?? 0) > 2.0 ? 'Above 2x Median' : 'Below 0.5x Median',
      npi: o.npi,
      providerName: o.providerName,
      hcpcsCode: o.hcpcsCode,
      hcpcsDescription: o.hcpcsDescription,
      state: o.state,
      costPerClaim: o.costPerClaim,
      procedureMedian: o.procedureMedian,
      totalClaims: o.totalClaims,
      totalBeneficiaries: o.totalBeneficiaries,
    }));
  }, [filtered]);

  const anomalyColors: Record<string, string> = {
    'Above 2x Median': '#dc2626',
    'Below 0.5x Median': '#2563eb',
  };

  const columns: ColumnDef<Outlier>[] = [
    {
      key: 'npi',
      label: 'Provider',
      render: (r) => (
        <div>
          <Link href={`/providers/${r.npi}`} className="font-mono text-xs text-blue-600 hover:underline">
            {r.npi}
          </Link>
          {r.providerName && <p className="text-xs text-gray-500 truncate max-w-[150px]" title={r.providerName}>{r.providerName}</p>}
        </div>
      ),
      sortValue: (r) => r.providerName ?? r.npi,
    },
    {
      key: 'state',
      label: 'State',
      render: (r) => (
        r.state ? (
          <Link href={`/states/${r.state}`} className="text-xs text-blue-600 hover:underline">
            {r.state}
          </Link>
        ) : <span className="text-gray-400">—</span>
      ),
      sortValue: (r) => r.state ?? '',
    },
    {
      key: 'hcpcsCode',
      label: 'Procedure',
      render: (r) => (
        <div>
          <Link href={`/procedures/${r.hcpcsCode}`} className="font-mono text-xs text-blue-600 hover:underline">
            {r.hcpcsCode}
          </Link>
          {r.hcpcsDescription && <p className="text-xs text-gray-500 truncate max-w-[150px]" title={r.hcpcsDescription}>{r.hcpcsDescription}</p>}
        </div>
      ),
      sortValue: (r) => r.hcpcsCode,
    },
    {
      key: 'costPerClaim',
      label: '$/Claim',
      render: (r) => (
        <span className="tabular-nums">
          {formatCurrency(r.costPerClaim)}
        </span>
      ),
      sortValue: (r) => r.costPerClaim,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'procedureMedian',
      label: 'Proc. Median',
      render: (r) => (
        <span className="tabular-nums text-gray-500">{formatCurrency(r.procedureMedian)}</span>
      ),
      sortValue: (r) => r.procedureMedian,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'costIndex',
      label: <><span>Cost Index</span><InfoTip text="Provider's cost per claim divided by the procedure median. 1.0x = at median, 2.0x = twice the median." /></>,
      render: (r) => {
        const color = (r.costIndex ?? 0) > 2 ? 'text-red-600' : 'text-blue-600';
        return (
          <span className={`tabular-nums font-semibold ${color}`}>
            {formatIndex(r.costIndex ?? 0)}
          </span>
        );
      },
      sortValue: (r) => r.costIndex ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
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
      key: 'totalClaims',
      label: 'Claims',
      render: (r) => <span className="tabular-nums">{formatNumber(r.totalClaims)}</span>,
      sortValue: (r) => r.totalClaims,
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

      <PageNav activeTab="anomalies" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Outliers"
          value={formatNumber(totalCount)}
          detail="Providers billing >2x or <0.5x procedure median"
        />
        <StatCard
          label="Above 2x Median"
          value={formatNumber(highCount)}
          detail="Providers charging significantly above median"
          detailColor="text-red-500"
        />
        <StatCard
          label="Below 0.5x Median"
          value={formatNumber(lowCount)}
          detail="Providers charging significantly below median"
          detailColor="text-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search provider or procedure..."
        />
        <div className="flex gap-1.5">
          {([
            ['all', 'All Outliers'],
            ['high', 'Above 2x'],
            ['low', 'Below 0.5x'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dot Plot */}
      <div className="mt-6">
        <DotPlot
          data={dotData}
          xLabel="Cost Index"
          yLabel="Total Paid ($)"
          title="Cost Outliers"
          subtitle="Each dot is a provider-procedure pair. Red = above 2x median. Blue = below 0.5x median."
          xFormatter={(v) => `${v.toFixed(1)}x`}
          yFormatter={(v) => formatCurrencyCompact(v)}
          categoryColors={anomalyColors}
          xTicks={[0.1, 0.2, 0.3, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0]}
          selectedId={selectedId}
          onDotClick={(d) => setSelectedId(d.id === selectedId || !d.id ? null : d.id)}
          renderTooltip={(d) => (
            <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
              {d.providerName ? <p className="text-sm font-semibold text-gray-900">{String(d.providerName)}</p> : null}
              <p className="font-mono text-xs text-gray-500">{String(d.npi)}</p>
              {d.hcpcsDescription ? <p className="text-xs text-gray-600">{String(d.hcpcsDescription)}</p> : null}
              <p className="font-mono text-xs text-gray-500">{String(d.hcpcsCode)}</p>
              {'state' in d && d.state ? <p className="text-xs text-gray-500">{String(d.state)}</p> : null}
              <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                <p>$/Claim: <span className="font-semibold">{formatCurrency(d.costPerClaim as number)}</span> vs <span className="font-semibold">{formatCurrency(d.procedureMedian as number)}</span> median</p>
                <p>Cost Index: <span className="font-semibold">{formatIndex(d.x)}</span></p>
                <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                <p>Claims: <span className="font-semibold">{formatNumber(d.totalClaims as number)}</span></p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Ranked Table */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Outlier Rankings</h3>
        <RankedTable
          data={filtered}
          columns={columns}
          defaultSortKey="costIndex"
          defaultSortDir="desc"
          rowKey={(r) => `${r.npi}|${r.hcpcsCode}`}
          selectedKey={selectedId}
        />
      </div>
    </div>
  );
}
