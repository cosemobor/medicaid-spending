'use client';

import { useMemo } from 'react';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumberCompact,
  formatNumber,
} from '@/lib/formatters';
import type { MonthlyNational } from '@/types';

interface Props {
  monthly: MonthlyNational[];
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  providerCount: number;
  procedureCount: number;
  stateCount: number;
}

export default function OverviewDashboard({
  monthly,
  totalPaid,
  totalClaims,
  totalBeneficiaries,
  providerCount,
  procedureCount,
  stateCount,
}: Props) {
  const avgCostPerBeneficiary =
    totalBeneficiaries > 0 ? totalPaid / totalBeneficiaries : 0;
  const avgCostPerClaim = totalClaims > 0 ? totalPaid / totalClaims : 0;

  // Spending Growth Index: normalize to first month = 100
  const indexedData = useMemo(() => {
    if (monthly.length === 0) return [];
    const basePaid = monthly[0].totalPaid;
    const baseCpb = monthly[0].avgCostPerBeneficiary ?? 1;
    return monthly.map((m) => ({
      ...m,
      spendingIndex: basePaid > 0 ? Math.round((m.totalPaid / basePaid) * 100) : 100,
      cpbIndex: baseCpb > 0
        ? Math.round(((m.avgCostPerBeneficiary ?? 0) / baseCpb) * 100)
        : 100,
      claimsPerBeneficiary:
        (m.totalBeneficiaries ?? 0) > 0
          ? Math.round((m.totalClaims / (m.totalBeneficiaries ?? 1)) * 100) / 100
          : 0,
    }));
  }, [monthly]);

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

      <PageNav activeTab="overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Spending"
          value={formatCurrencyCompact(totalPaid)}
          detail={formatCurrency(totalPaid)}
        />
        <StatCard
          label="Total Beneficiaries"
          value={formatNumberCompact(totalBeneficiaries)}
          detail={formatNumber(totalBeneficiaries)}
        />
        <StatCard
          label="Avg Cost / Beneficiary"
          value={formatCurrency(avgCostPerBeneficiary)}
          detail={`${formatCurrency(avgCostPerClaim)} per claim`}
        />
        <StatCard
          label="Providers Tracked"
          value={formatNumberCompact(providerCount)}
          detail={`${formatNumberCompact(procedureCount)} procedures across ${stateCount} states`}
        />
      </div>

      {/* Trend Charts */}
      <div className="mt-8 space-y-8">
        <TrendChart
          data={indexedData}
          lines={[
            { dataKey: 'totalPaid', color: '#2563eb', label: 'Total Paid' },
          ]}
          title="Monthly Medicaid Spending"
          subtitle="Total provider payments per month (nominal $)"
          yFormatter={(v) => formatCurrencyCompact(v)}
        />

        <TrendChart
          data={indexedData}
          lines={[
            { dataKey: 'spendingIndex', color: '#7c3aed', label: 'Spending Index' },
          ]}
          title="Spending Growth Index"
          subtitle={`Indexed to ${monthly[0]?.month ?? 'Jan 2018'} = 100`}
          yFormatter={(v) => `${v}`}
        />

        <TrendChart
          data={indexedData}
          lines={[
            {
              dataKey: 'avgCostPerBeneficiary',
              color: '#059669',
              label: 'Avg Cost / Beneficiary',
            },
          ]}
          title="Cost per Beneficiary"
          subtitle="Average monthly spending per unique beneficiary (nominal $)"
          yFormatter={(v) => formatCurrencyCompact(v)}
        />

        <TrendChart
          data={indexedData}
          lines={[
            {
              dataKey: 'claimsPerBeneficiary',
              color: '#d97706',
              label: 'Claims / Beneficiary',
            },
          ]}
          title="Claims per Beneficiary"
          subtitle="Average claims filed per unique beneficiary per month"
          yFormatter={(v) => v.toFixed(1)}
        />

        <TrendChart
          data={indexedData}
          lines={[
            {
              dataKey: 'avgCostPerClaim',
              color: '#dc2626',
              label: 'Avg Cost / Claim',
            },
          ]}
          title="Cost per Claim"
          subtitle="Average cost per claim (nominal $)"
          yFormatter={(v) => formatCurrencyCompact(v)}
        />
      </div>

      <footer className="mt-12 border-t border-gray-100 pt-6 text-xs text-gray-400">
        <p>
          Data: CMS T-MSIS Medicaid provider spending, Jan 2018 – Dec 2024.
          Rows with &lt;12 claims suppressed per CMS policy.
        </p>
      </footer>
    </div>
  );
}
