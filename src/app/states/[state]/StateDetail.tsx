'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import DotPlot, { type DotPlotDatum } from '@/components/DotPlot';
import RankedTable, { type ColumnDef } from '@/components/RankedTable';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumber,
  formatNumberCompact,
  formatPercent,
} from '@/lib/formatters';
import type { StateSummary, StateMonthly, StateProcedure, ProviderSummary } from '@/types';

interface Props {
  state: StateSummary;
  monthly: StateMonthly[];
  procedures: StateProcedure[];
  providers: ProviderSummary[];
}

export default function StateDetail({
  state: st,
  monthly,
  procedures,
  providers,
}: Props) {
  const [selectedProcId, setSelectedProcId] = useState<string | null>(null);
  const [selectedProvId, setSelectedProvId] = useState<string | null>(null);

  // Procedure dot data
  const procDotData: DotPlotDatum[] = procedures.map((p) => ({
    x: p.avgCostPerClaim ?? 0,
    y: p.totalClaims,
    label: p.hcpcsCode,
    id: p.hcpcsCode,
    totalPaid: p.totalPaid,
    totalBeneficiaries: p.totalBeneficiaries,
    providerCount: p.providerCount,
  }));

  // Provider dot data
  const provDotData: DotPlotDatum[] = providers.map((p) => ({
    x: p.avgCostPerClaim ?? 0,
    y: p.totalPaid,
    label: p.name ?? p.npi,
    id: p.npi,
    providerName: p.name,
    npi: p.npi,
    totalClaims: p.totalClaims,
    totalBeneficiaries: p.totalBeneficiaries,
    procedureCount: p.procedureCount,
    spendingGrowthPct: p.spendingGrowthPct,
    category: (p.spendingGrowthPct ?? 0) > 0 ? 'Growing' : 'Declining',
  }));

  const procColumns: ColumnDef<StateProcedure>[] = [
    {
      key: 'hcpcsCode',
      label: 'HCPCS',
      render: (r) => (
        <Link href={`/procedures/${r.hcpcsCode}`} className="font-mono text-xs font-semibold text-blue-600 hover:underline">
          {r.hcpcsCode}
        </Link>
      ),
      sortValue: (r) => r.hcpcsCode,
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
      key: 'totalClaims',
      label: 'Claims',
      render: (r) => <span className="tabular-nums">{formatNumber(r.totalClaims)}</span>,
      sortValue: (r) => r.totalClaims,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'totalBeneficiaries',
      label: 'Beneficiaries',
      render: (r) => <span className="tabular-nums">{formatNumber(r.totalBeneficiaries)}</span>,
      sortValue: (r) => r.totalBeneficiaries,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'providerCount',
      label: 'Providers',
      render: (r) => <span className="tabular-nums">{formatNumber(r.providerCount ?? 0)}</span>,
      sortValue: (r) => r.providerCount ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  const provColumns: ColumnDef<ProviderSummary>[] = [
    {
      key: 'npi',
      label: 'Provider',
      render: (r) => (
        <div>
          <Link href={`/providers/${r.npi}`} className="font-mono text-xs text-blue-600 hover:underline">
            {r.npi}
          </Link>
          {r.name && <p className="text-xs text-gray-500 truncate max-w-[180px]" title={r.name}>{r.name}</p>}
        </div>
      ),
      sortValue: (r) => r.name ?? r.npi,
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
      render: (r) => <span className="tabular-nums">{formatCurrency(r.avgCostPerBeneficiary ?? 0)}</span>,
      sortValue: (r) => r.avgCostPerBeneficiary ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'spendingGrowthPct',
      label: 'Growth',
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
      key: 'procedureCount',
      label: 'Procedures',
      render: (r) => <span className="tabular-nums">{formatNumber(r.procedureCount)}</span>,
      sortValue: (r) => r.procedureCount,
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

      <PageNav activeTab="states" />

      <div className="mb-4">
        <Link href="/states" className="text-xs text-blue-600 hover:underline">
          &larr; All States
        </Link>
      </div>

      <h2 className="text-xl font-bold text-gray-900">{st.state}</h2>

      {/* Stat Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Paid"
          value={formatCurrencyCompact(st.totalPaid)}
          detail={formatCurrency(st.totalPaid)}
        />
        <StatCard
          label="Beneficiaries"
          value={formatNumberCompact(st.totalBeneficiaries)}
          detail={formatNumber(st.totalBeneficiaries)}
        />
        <StatCard
          label="$/Beneficiary"
          value={formatCurrency(st.avgCostPerBeneficiary ?? 0)}
          detail={`${formatCurrency(st.avgCostPerClaim ?? 0)} per claim`}
        />
        <StatCard
          label="Providers"
          value={formatNumber(st.providerCount)}
          detail={`${formatNumber(st.procedureCount)} procedures`}
        />
      </div>

      {/* Monthly Trend */}
      {monthly.length > 0 && (
        <div className="mt-8 space-y-8">
          <TrendChart
            data={monthly}
            lines={[{ dataKey: 'totalPaid', color: '#2563eb', label: 'Total Paid' }]}
            title="Monthly Spending"
            subtitle={`${st.state} — total payments per month (nominal $)`}
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
          <TrendChart
            data={monthly}
            lines={[{ dataKey: 'avgCostPerBeneficiary', color: '#059669', label: '$/Beneficiary' }]}
            title="Cost per Beneficiary"
            subtitle={`${st.state} — average spending per beneficiary per month`}
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
        </div>
      )}

      {/* Procedure Breakdown */}
      {procedures.length > 0 && (
        <div className="mt-8">
          <DotPlot
            data={procDotData}
            xLabel="Avg $/Claim"
            yLabel="Total Claims"
            title="Procedure Breakdown"
            subtitle="Each dot is a procedure. X = avg cost per claim. Y = total claims."
            xFormatter={(v) => formatCurrencyCompact(v)}
            yFormatter={(v) => formatNumberCompact(v)}
            selectedId={selectedProcId}
            onDotClick={(d) => setSelectedProcId(d.id === selectedProcId || !d.id ? null : d.id)}
            renderTooltip={(d) => (
              <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                <p className="font-mono text-sm font-bold text-gray-900">{d.label}</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                  <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.totalPaid as number)}</span></p>
                  <p>$/Claim: <span className="font-semibold">{formatCurrency(d.x)}</span></p>
                  <p>Claims: <span className="font-semibold">{formatNumber(d.y)}</span></p>
                </div>
              </div>
            )}
          />
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Procedure Rankings</h3>
            <RankedTable
              data={procedures}
              columns={procColumns}
              defaultSortKey="totalPaid"
              defaultSortDir="desc"
              rowKey={(r) => r.hcpcsCode}
              selectedKey={selectedProcId}
              onRowClick={(r) => setSelectedProcId(r.hcpcsCode === selectedProcId ? null : r.hcpcsCode)}
            />
          </div>
        </div>
      )}

      {/* Provider Breakdown */}
      {providers.length > 0 && (
        <div className="mt-8">
          <DotPlot
            data={provDotData}
            xLabel="Avg $/Claim"
            yLabel="Total Paid ($)"
            title="Top Providers in This State"
            subtitle="Each dot is a provider. Color = spending trend direction."
            xFormatter={(v) => formatCurrencyCompact(v)}
            yFormatter={(v) => formatCurrencyCompact(v)}
            categoryColors={{ Growing: '#dc2626', Declining: '#16a34a' }}
            selectedId={selectedProvId}
            onDotClick={(d) => setSelectedProvId(d.id === selectedProvId || !d.id ? null : d.id)}
            renderTooltip={(d) => (
              <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                {d.providerName ? <p className="text-sm font-semibold text-gray-900">{String(d.providerName)}</p> : null}
                <p className="font-mono text-xs text-gray-500">{d.npi as string}</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                  <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                  <p>$/Claim: <span className="font-semibold">{formatCurrency(d.x)}</span></p>
                  <p>Spending Growth: <span className="font-semibold">{formatPercent(d.spendingGrowthPct as number)}</span></p>
                </div>
              </div>
            )}
          />
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Provider Rankings</h3>
            <RankedTable
              data={providers}
              columns={provColumns}
              defaultSortKey="totalPaid"
              defaultSortDir="desc"
              rowKey={(r) => r.npi}
              selectedKey={selectedProvId}
              onRowClick={(r) => setSelectedProvId(r.npi === selectedProvId ? null : r.npi)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
