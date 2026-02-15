'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import DotPlot, { type DotPlotDatum } from '@/components/DotPlot';
import RankedTable, { type ColumnDef } from '@/components/RankedTable';
import TrendChart from '@/components/TrendChart';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumber,
  formatNumberCompact,
  formatRate,
} from '@/lib/formatters';
import DataQualityBanner from '@/components/DataQualityBanner';
import { stateName } from '@/lib/us-states';
import type { StateSummary, StateMonthly } from '@/types';

const STATE_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed'];

interface Props {
  states: StateSummary[];
  totalCount: number;
  topStateMonthly: StateMonthly[];
  top5States: string[];
}

export default function StateExplorer({
  states,
  totalCount,
  topStateMonthly,
  top5States,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const highestSpending = states[0];
  const highestCpb = states.reduce(
    (max, s) =>
      (s.avgCostPerBeneficiary ?? 0) > (max?.avgCostPerBeneficiary ?? 0) ? s : max,
    states[0]
  );

  const dotData: DotPlotDatum[] = useMemo(() => {
    return states.map((s) => ({
      x: s.avgCostPerBeneficiary ?? 0,
      y: s.totalPaid,
      label: stateName(s.state),
      id: s.state,
      avgCostPerClaim: s.avgCostPerClaim,
      totalClaims: s.totalClaims,
      totalBeneficiaries: s.totalBeneficiaries,
      providerCount: s.providerCount,
      claimsPerBeneficiary: s.claimsPerBeneficiary,
    }));
  }, [states]);

  // Build monthly trend data for top 5 states
  const trendData = useMemo(() => {
    if (topStateMonthly.length === 0) return [];
    const monthMap = new Map<string, Record<string, unknown>>();
    for (const m of topStateMonthly) {
      if (!monthMap.has(m.month)) {
        monthMap.set(m.month, { month: m.month });
      }
      const entry = monthMap.get(m.month)!;
      entry[`paid_${m.state}`] = m.totalPaid;
      entry[`cpb_${m.state}`] = m.avgCostPerBeneficiary;
    }
    return Array.from(monthMap.values()).sort((a, b) =>
      (a.month as string).localeCompare(b.month as string)
    );
  }, [topStateMonthly]);

  const spendingLines = top5States.map((s, i) => ({
    dataKey: `paid_${s}`,
    color: STATE_COLORS[i % STATE_COLORS.length],
    label: stateName(s),
  }));

  const cpbLines = top5States.map((s, i) => ({
    dataKey: `cpb_${s}`,
    color: STATE_COLORS[i % STATE_COLORS.length],
    label: stateName(s),
  }));

  const columns: ColumnDef<StateSummary>[] = [
    {
      key: 'state',
      label: 'State',
      render: (r) => (
        <span className="text-xs font-semibold text-blue-600">{stateName(r.state)}</span>
      ),
      sortValue: (r) => stateName(r.state),
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
      key: 'totalBeneficiaries',
      label: 'Beneficiaries',
      render: (r) => <span className="tabular-nums">{formatNumberCompact(r.totalBeneficiaries)}</span>,
      sortValue: (r) => r.totalBeneficiaries,
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
      key: 'avgCostPerClaim',
      label: '$/Claim',
      render: (r) => <span className="tabular-nums">{formatCurrency(r.avgCostPerClaim ?? 0)}</span>,
      sortValue: (r) => r.avgCostPerClaim ?? 0,
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
    {
      key: 'claimsPerBeneficiary',
      label: 'Claims/Bene',
      render: (r) => <span className="tabular-nums">{formatRate(r.claimsPerBeneficiary ?? 0)}</span>,
      sortValue: (r) => r.claimsPerBeneficiary ?? 0,
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
          State totals based on NPPES-registered provider locations, Jan 2018 – Dec 2024
        </p>
      </header>

      <PageNav activeTab="states" />

      <DataQualityBanner />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="States with Data"
          value={formatNumber(totalCount)}
        />
        <StatCard
          label="Highest Spending"
          value={stateName(highestSpending?.state)}
          detail={
            highestSpending
              ? `${formatCurrencyCompact(highestSpending.totalPaid)} total`
              : undefined
          }
        />
        <StatCard
          label="Highest $/Beneficiary"
          value={stateName(highestCpb?.state)}
          detail={
            highestCpb
              ? `${formatCurrency(highestCpb.avgCostPerBeneficiary ?? 0)} per beneficiary`
              : undefined
          }
        />
      </div>

      {/* Dot Plot */}
      <div className="mt-6">
        <DotPlot
          data={dotData}
          xLabel="Avg $ / Beneficiary"
          yLabel="Total Paid ($)"
          title="State Spending vs Cost per Beneficiary"
          subtitle="Each dot is a state. X = average cost per beneficiary. Y = total spending."
          xFormatter={(v) => formatCurrencyCompact(v)}
          yFormatter={(v) => formatCurrencyCompact(v)}
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
              <p className="text-sm font-bold text-gray-900">{d.label}</p>
              <div className="mt-1.5 space-y-0.5 text-xs text-gray-700">
                <p>Total Paid: <span className="font-semibold">{formatCurrencyCompact(d.y)}</span></p>
                <p>$/Beneficiary: <span className="font-semibold">{formatCurrency(d.x)}</span></p>
                <p>$/Claim: <span className="font-semibold">{formatCurrency(d.avgCostPerClaim as number)}</span></p>
                <p>Beneficiaries: <span className="font-semibold">{formatNumber(d.totalBeneficiaries as number)}</span></p>
                <p>Providers: <span className="font-semibold">{formatNumber(d.providerCount as number)}</span></p>
                <p>Claims/Bene: <span className="font-semibold">{formatRate(d.claimsPerBeneficiary as number)}</span></p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Ranked Table */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">State Rankings</h3>
        <RankedTable
          data={states}
          columns={columns}
          defaultSortKey="totalPaid"
          defaultSortDir="desc"
          rowKey={(r) => r.state}
          selectedKey={selectedId}
          onRowClick={(r) => router.push(`/states/${r.state}`)}
        />
      </div>

      {/* Trend Charts for top 5 states */}
      {trendData.length > 0 && (
        <div className="mt-8 space-y-8">
          <TrendChart
            data={trendData}
            lines={spendingLines}
            title="Top 5 States — Monthly Spending"
            subtitle="Total provider payments per month (nominal $)"
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
          <TrendChart
            data={trendData}
            lines={cpbLines}
            title="Top 5 States — Cost per Beneficiary"
            subtitle="Average spending per beneficiary per month (nominal $)"
            yFormatter={(v) => formatCurrencyCompact(v)}
          />
        </div>
      )}
    </div>
  );
}
