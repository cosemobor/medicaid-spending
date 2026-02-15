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
  formatNumberCompact,
  formatNumber,
  formatIndex,
  formatRate,
} from '@/lib/formatters';
import DataQualityBanner from '@/components/DataQualityBanner';
import InfoTip from '@/components/InfoTip';
import type { ProcedureSummary, ProcedureMonthly, ProviderProcedure, StateProcedure } from '@/types';

interface Props {
  procedure: ProcedureSummary;
  monthly: ProcedureMonthly[];
  topProviders: ProviderProcedure[];
  stateBreakdown: StateProcedure[];
}

export default function ProcedureDetail({
  procedure: proc,
  monthly,
  topProviders,
  stateBreakdown,
}: Props) {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Provider dot data
  const providerDotData: DotPlotDatum[] = topProviders.map((p) => ({
    x: p.costIndex ?? 0,
    y: p.totalPaid,
    label: p.providerName ?? p.npi,
    id: p.npi,
    category: p.state ?? 'Unknown',
    costPerClaim: p.costPerClaim,
    medianCpc: p.procedureMedianCostPerClaim,
    totalClaims: p.totalClaims,
    totalBeneficiaries: p.totalBeneficiaries,
    state: p.state,
    providerName: p.providerName,
    npi: p.npi,
  }));

  // State dot data
  const stateDotData: DotPlotDatum[] = stateBreakdown.map((s) => ({
    x: s.avgCostPerClaim ?? 0,
    y: s.totalPaid,
    label: s.state,
    id: s.state,
    totalClaims: s.totalClaims,
    totalBeneficiaries: s.totalBeneficiaries,
    providerCount: s.providerCount,
  }));

  const providerColumns: ColumnDef<ProviderProcedure>[] = [
    {
      key: 'npi',
      label: 'Provider',
      render: (r) => (
        <div>
          <Link href={`/providers/${r.npi}`} className="font-mono text-xs text-blue-600 hover:underline">
            {r.npi}
          </Link>
          {r.providerName && <p className="text-xs text-gray-500 truncate max-w-[180px]" title={r.providerName}>{r.providerName}</p>}
        </div>
      ),
      sortValue: (r) => r.providerName ?? r.npi,
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
      label: <><span>Cost Index</span><InfoTip text="Provider's cost per claim divided by the procedure median. 1.0x = at median, 2.0x = twice the median." /></>,
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

  const stateColumns: ColumnDef<StateProcedure>[] = [
    {
      key: 'state',
      label: 'State',
      render: (r) => (
        <Link href={`/states/${r.state}`} className="text-xs font-semibold text-blue-600 hover:underline">
          {r.state}
        </Link>
      ),
      sortValue: (r) => r.state,
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

      <DataQualityBanner />

      <div className="mb-4">
        <Link href="/procedures" className="text-xs text-blue-600 hover:underline">
          &larr; All Procedures
        </Link>
      </div>

      <h2 className="text-xl font-bold text-gray-900">
        <span className="font-mono">{proc.hcpcsCode}</span>
        <span className="ml-2 text-sm font-normal text-gray-500">{proc.category}</span>
        {proc.description && (
          <p className="mt-1 text-sm font-normal text-gray-600">{proc.description}</p>
        )}
      </h2>

      {/* Stat Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Paid"
          value={formatCurrencyCompact(proc.totalPaid)}
          detail={formatCurrency(proc.totalPaid)}
        />
        <StatCard
          label="Beneficiaries"
          value={formatNumberCompact(proc.totalBeneficiaries)}
          detail={formatNumber(proc.totalBeneficiaries)}
        />
        <StatCard
          label="Avg $/Claim"
          value={formatCurrency(proc.avgCostPerClaim ?? 0)}
          detail={
            proc.medianCostPerClaim != null
              ? `Median: ${formatCurrency(proc.medianCostPerClaim)}`
              : undefined
          }
        />
        <StatCard
          label="Utilization"
          value={`${formatRate(proc.claimsPerBeneficiary)} claims/bene`}
          detail={`${formatNumber(proc.providerCount)} providers`}
        />
      </div>

      {/* Trend Charts */}
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
            title="Cost per Claim"
            subtitle="Average cost per claim per month (nominal $)"
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
          <TrendChart
            data={monthly}
            lines={[{ dataKey: 'totalBeneficiaries', color: '#059669', label: 'Beneficiaries' }]}
            title="Beneficiaries"
            subtitle="Unique beneficiaries per month"
            yFormatter={(v) => formatNumberCompact(v)}
          />
        </div>
      )}

      {/* Provider Dot Plot + Ranked Table */}
      {topProviders.length > 0 && (
        <div className="mt-8">
          <DotPlot
            data={providerDotData}
            xLabel="Cost Index"
            yLabel="Total Paid ($)"
            title="Top Providers for This Procedure"
            subtitle="Each dot is a provider. X = cost index (vs procedure median). Y = total spending."
            xFormatter={(v) => `${v.toFixed(1)}x`}
            yFormatter={(v) => formatCurrencyCompact(v)}
            selectedId={selectedProviderId}
            onDotClick={(d) => {
              if (d.id === selectedProviderId || !d.id) {
                setSelectedProviderId(null);
              } else {
                setSelectedProviderId(d.id);
              }
            }}
            renderTooltip={(d) => (
              <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                {d.providerName ? <p className="text-sm font-semibold text-gray-900">{String(d.providerName)}</p> : null}
                <p className="font-mono text-xs text-gray-500">{d.npi as string ?? d.label}</p>
                {'state' in d && d.state ? <p className="text-xs text-gray-500">{String(d.state)}</p> : null}
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                  <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                  <p>$/Claim: <span className="font-semibold">{formatCurrency(d.costPerClaim as number)} vs {formatCurrency(d.medianCpc as number)} median</span></p>
                  <p>Cost Index: <span className="font-semibold">{formatIndex(d.x)}</span></p>
                </div>
              </div>
            )}
          />
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Provider Rankings</h3>
            <RankedTable
              data={topProviders}
              columns={providerColumns}
              defaultSortKey="totalPaid"
              defaultSortDir="desc"
              rowKey={(r) => r.npi}
              selectedKey={selectedProviderId}
              onRowClick={(r) => setSelectedProviderId(r.npi === selectedProviderId ? null : r.npi)}
            />
          </div>
        </div>
      )}

      {/* State Breakdown */}
      {stateBreakdown.length > 0 && (
        <div className="mt-8">
          <DotPlot
            data={stateDotData}
            xLabel="Avg $/Claim"
            yLabel="Total Paid ($)"
            title="State Breakdown"
            subtitle="Each dot is a state. X = average cost per claim. Y = total spending."
            xFormatter={(v) => formatCurrencyCompact(v)}
            yFormatter={(v) => formatCurrencyCompact(v)}
            renderTooltip={(d) => (
              <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-sm font-bold text-gray-900">{d.label}</p>
                <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                  <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                  <p>Avg $/Claim: <span className="font-semibold">{formatCurrency(d.x)}</span></p>
                  <p>Claims: <span className="font-semibold">{formatNumber(d.totalClaims as number)}</span></p>
                  <p>Providers: <span className="font-semibold">{formatNumber(d.providerCount as number)}</span></p>
                </div>
              </div>
            )}
          />
          <div className="mt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">State Rankings</h3>
            <RankedTable
              data={stateBreakdown}
              columns={stateColumns}
              defaultSortKey="totalPaid"
              defaultSortDir="desc"
              rowKey={(r) => r.state}
              onRowClick={(r) => window.location.href = `/states/${r.state}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
