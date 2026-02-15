'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import PageNav from '@/components/PageNav';
import StatCard from '@/components/StatCard';
import TrendChart from '@/components/TrendChart';
import InsightCard from '@/components/InsightCard';
import {
  formatCurrencyCompact,
  formatCurrency,
  formatNumberCompact,
  formatNumber,
} from '@/lib/formatters';
import DataQualityBanner from '@/components/DataQualityBanner';
import type { MonthlyNational } from '@/types';

interface Props {
  monthly: MonthlyNational[];
  totalPaid: number;
  totalClaims: number;
  totalBeneficiaries: number;
  providerCount: number;
  procedureCount: number;
  stateCount: number;
  topStateName: string | null;
  topStatePaid: number;
  topProcCode: string | null;
  topProcDescription: string | null;
  topProcPaid: number;
  outlierHighCount: number;
  mappedProviderCount: number;
}

export default function OverviewDashboard({
  monthly,
  totalPaid,
  totalClaims,
  totalBeneficiaries,
  providerCount,
  procedureCount,
  stateCount,
  topStateName,
  topStatePaid,
  topProcCode,
  topProcDescription,
  topProcPaid,
  outlierHighCount,
  mappedProviderCount,
}: Props) {
  const avgCostPerBeneficiary =
    totalBeneficiaries > 0 ? totalPaid / totalBeneficiaries : 0;
  const avgCostPerClaim = totalClaims > 0 ? totalPaid / totalClaims : 0;

  const indexedData = useMemo(() => {
    if (monthly.length === 0) return [];
    return monthly.map((m) => ({
      ...m,
    }));
  }, [monthly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Medicaid Provider Spending Explorer
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          CMS T-MSIS provider-level fee-for-service spending, Jan 2018 – Dec 2024.
          {' '}Cell-suppressed rows (&lt;11 beneficiaries/month) excluded per CMS policy.
        </p>
      </header>

      <DataQualityBanner />

      <PageNav activeTab="overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Spending (2018–2024)"
          value={formatCurrencyCompact(totalPaid)}
          detail={formatCurrency(totalPaid)}
        />
        <StatCard
          label="Total Beneficiary-Months"
          value={formatNumberCompact(totalBeneficiaries)}
          detail="Sum across all months — individuals counted each month they appear"
        />
        <StatCard
          label="Avg Cost / Beneficiary-Month"
          value={formatCurrency(avgCostPerBeneficiary)}
          detail={`${formatCurrency(avgCostPerClaim)} per claim`}
        />
        <StatCard
          label="Providers Tracked"
          value={formatNumberCompact(providerCount)}
          detail={`${formatNumberCompact(procedureCount)} procedures across ${stateCount} states`}
        />
      </div>

      {/* Explore the Data */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Explore the Data</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InsightCard
            href="/providers"
            title="Provider Map"
            value={formatNumberCompact(mappedProviderCount)}
            subtitle="providers mapped with location data"
            color="purple"
          />
          {topProcCode && (
            <InsightCard
              href="/procedures"
              title="Top Procedure"
              value={topProcDescription ?? topProcCode}
              subtitle={`${formatCurrencyCompact(topProcPaid)} in total spending`}
              color="green"
            />
          )}
          <InsightCard
            href="/anomalies"
            title="Billing Anomalies"
            value={formatNumberCompact(outlierHighCount)}
            subtitle="providers charging above 2x median"
            color="red"
          />
          {topStateName && (
            <InsightCard
              href="/states"
              title="Top Spending State"
              value={topStateName}
              subtitle={`${formatCurrencyCompact(topStatePaid)} in total spending`}
              color="blue"
            />
          )}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart
          data={indexedData}
          lines={[
            { dataKey: 'totalPaid', color: '#2563eb', label: 'Total Paid' },
          ]}
          title="Monthly Medicaid Spending"
          subtitle="Total provider payments per month (nominal $)"
          yFormatter={(v) => formatCurrencyCompact(v)}
          height={240}
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
          height={240}
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
          height={240}
        />
      </div>

      <footer className="mt-12 border-t border-gray-100 pt-6 text-xs text-gray-400">
        <p>
          Data: CMS T-MSIS Medicaid provider spending, Jan 2018 – Dec 2024.
          Rows with &lt;12 claims suppressed per CMS policy.
        </p>
        <div className="mt-2 flex gap-4">
          <Link href="/about" className="hover:text-gray-600">About</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms of Use</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
