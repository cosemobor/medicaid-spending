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
  formatIndex,
} from '@/lib/formatters';
import type { ProviderSummary, ProviderMonthly, ProviderProcedure } from '@/types';

interface Props {
  provider: ProviderSummary;
  monthly: ProviderMonthly[];
  procedures: ProviderProcedure[];
}

export default function ProviderDetail({
  provider: prov,
  monthly,
  procedures,
}: Props) {
  const [selectedProcId, setSelectedProcId] = useState<string | null>(null);

  // Procedure dot data
  const procDotData: DotPlotDatum[] = procedures.map((p) => ({
    x: p.costIndex ?? 0,
    y: p.totalPaid,
    label: p.hcpcsCode,
    id: p.hcpcsCode,
    costPerClaim: p.costPerClaim,
    medianCpc: p.procedureMedianCostPerClaim,
    totalClaims: p.totalClaims,
    totalBeneficiaries: p.totalBeneficiaries,
  }));

  const procColumns: ColumnDef<ProviderProcedure>[] = [
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
      key: 'costPerClaim',
      label: '$/Claim',
      render: (r) => (
        <span className="tabular-nums">
          {formatCurrency(r.costPerClaim)}
          <span className="ml-1 text-xs text-gray-400">
            vs {formatCurrency(r.procedureMedianCostPerClaim)} med
          </span>
        </span>
      ),
      sortValue: (r) => r.costPerClaim ?? 0,
      className: 'text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'costIndex',
      label: 'Cost Index',
      render: (r) => {
        const ci = r.costIndex ?? 0;
        const color = ci > 2 ? 'text-red-600' : ci < 0.5 ? 'text-blue-600' : 'text-gray-900';
        return <span className={`tabular-nums font-semibold ${color}`}>{formatIndex(r.costIndex)}</span>;
      },
      sortValue: (r) => r.costIndex ?? 0,
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

      <PageNav activeTab="providers" />

      <div className="mb-4">
        <Link href="/providers" className="text-xs text-blue-600 hover:underline">
          &larr; All Providers
        </Link>
      </div>

      <h2 className="text-xl font-bold text-gray-900">
        {prov.name && <span>{prov.name}</span>}
        <span className={`font-mono ${prov.name ? 'ml-2 text-sm font-normal text-gray-500' : ''}`}>{prov.npi}</span>
        {prov.state && (
          <Link
            href={`/states/${prov.state}`}
            className="ml-2 text-sm font-normal text-blue-600 hover:underline"
          >
            {prov.state}
          </Link>
        )}
      </h2>

      {/* Stat Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Paid"
          value={formatCurrencyCompact(prov.totalPaid)}
          detail={formatCurrency(prov.totalPaid)}
        />
        <StatCard
          label="Beneficiaries"
          value={formatNumberCompact(prov.totalBeneficiaries)}
          detail={formatNumber(prov.totalBeneficiaries)}
        />
        <StatCard
          label="Avg $/Claim"
          value={formatCurrency(prov.avgCostPerClaim ?? 0)}
          detail={`${formatCurrency(prov.avgCostPerBeneficiary ?? 0)} per beneficiary`}
        />
        <StatCard
          label="Spending Growth"
          value={
            prov.spendingGrowthPct != null
              ? formatPercent(prov.spendingGrowthPct)
              : '—'
          }
          detail={
            prov.costPerClaimGrowthPct != null
              ? `$/Claim: ${formatPercent(prov.costPerClaimGrowthPct)}`
              : undefined
          }
          detailColor={
            (prov.spendingGrowthPct ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
          }
        />
      </div>

      {/* Rate of Change Charts */}
      {monthly.length > 0 && (
        <div className="mt-8 space-y-8">
          <TrendChart
            data={monthly}
            lines={[{ dataKey: 'totalPaid', color: '#2563eb', label: 'Total Paid' }]}
            title="Monthly Spending"
            subtitle="Total payments per month (nominal $)"
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
          <TrendChart
            data={monthly}
            lines={[{ dataKey: 'avgCostPerClaim', color: '#dc2626', label: 'Avg $/Claim' }]}
            title="Cost per Claim Over Time"
            subtitle="How billing rate has changed (nominal $)"
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
          <TrendChart
            data={monthly}
            lines={[{ dataKey: 'totalClaims', color: '#059669', label: 'Claims' }]}
            title="Claims Volume"
            subtitle="Number of claims filed per month"
            yFormatter={(v) => formatNumberCompact(v)}
          />
        </div>
      )}

      {/* Procedure Breakdown */}
      {procedures.length > 0 && (
        <div className="mt-8">
          <DotPlot
            data={procDotData}
            xLabel="Cost Index"
            yLabel="Total Paid ($)"
            title="Procedure Breakdown"
            subtitle="Each dot is a procedure. X = cost index (vs procedure median). Y = total spending."
            xFormatter={(v) => `${v.toFixed(1)}x`}
            yFormatter={(v) => formatCurrencyCompact(v)}
            selectedId={selectedProcId}
            onDotClick={(d) => setSelectedProcId(d.id === selectedProcId || !d.id ? null : d.id)}
            renderTooltip={(d) => (
              <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                <p className="font-mono text-sm font-bold text-gray-900">{d.label}</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                  <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                  <p>$/Claim: <span className="font-semibold">{formatCurrency(d.costPerClaim as number)} vs {formatCurrency(d.medianCpc as number)} median</span></p>
                  <p>Cost Index: <span className="font-semibold">{formatIndex(d.x)}</span></p>
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
    </div>
  );
}
