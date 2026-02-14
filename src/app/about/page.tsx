import PageNav from '@/components/PageNav';

export default function AboutPage() {
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

      <div className="prose prose-sm max-w-none text-gray-700">
        <h2 className="text-lg font-bold text-gray-900">About This Project</h2>
        <p>
          This tool visualizes Medicaid provider spending data from the CMS
          Transformed Medicaid Statistical Information System (T-MSIS). The
          dataset covers <strong>January 2018 through December 2024</strong> and
          contains provider-level billing records aggregated at the Provider
          (NPI) x HCPCS Code x Month level.
        </p>

        <h3 className="mt-6 text-base font-bold text-gray-900">Data Source</h3>
        <p>
          The underlying data comes from T-MSIS Analytic Files (TAF), which CMS
          publishes to support Medicaid research. Each row represents one
          provider&apos;s billing activity for a single procedure code in a single
          month.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>BILLING_PROVIDER_NPI_NUM</strong> — National Provider Identifier</li>
          <li><strong>SERVICING_PROVIDER_NPI_NUM</strong> — Servicing provider (may differ from billing)</li>
          <li><strong>HCPCS_CODE</strong> — Healthcare Common Procedure Coding System code</li>
          <li><strong>CLAIM_FROM_MONTH</strong> — Month of service (YYYY-MM)</li>
          <li><strong>TOTAL_UNIQUE_BENEFICIARIES</strong> — Count of unique Medicaid beneficiaries</li>
          <li><strong>TOTAL_CLAIMS</strong> — Number of claims submitted</li>
          <li><strong>TOTAL_PAID</strong> — Dollar amount paid</li>
        </ul>

        <h3 className="mt-6 text-base font-bold text-gray-900">Cell Suppression</h3>
        <p>
          CMS applies cell suppression to protect beneficiary privacy. Rows
          where a provider filed fewer than 12 claims for a procedure in a month
          are dropped from the dataset. This means the data skews toward
          higher-volume billing and may undercount rare or low-volume services.
        </p>

        <h3 className="mt-6 text-base font-bold text-gray-900">Metrics & Methodology</h3>

        <h4 className="mt-4 text-sm font-bold text-gray-800">Nominal Values</h4>
        <p>
          All dollar figures are shown in <strong>nominal terms</strong> (not
          adjusted for inflation). When comparing across years, keep in mind
          that general price levels have risen — particularly during 2021–2024.
        </p>

        <h4 className="mt-4 text-sm font-bold text-gray-800">Cost Index</h4>
        <p>
          For each provider-procedure pair, we compute a{' '}
          <strong>Cost Index</strong> = (provider&apos;s cost per claim) / (procedure
          median cost per claim). A cost index of 2.0x means a provider charges
          twice the procedure median. This enables apples-to-apples comparison
          across different procedures with very different baseline costs.
        </p>

        <h4 className="mt-4 text-sm font-bold text-gray-800">Rate of Change</h4>
        <p>
          Provider growth metrics split billing history at{' '}
          <strong>July 2021</strong> (approximate midpoint). We compare the
          early period (pre-Jul 2021) total against the late period (Jul 2021+)
          to calculate spending growth %, cost-per-claim growth %, and volume
          growth %.
        </p>

        <h4 className="mt-4 text-sm font-bold text-gray-800">Outliers</h4>
        <p>
          Providers are flagged as outliers when their cost index exceeds{' '}
          <strong>2.0x</strong> (charging over twice the median) or falls below{' '}
          <strong>0.5x</strong> (charging less than half). Only provider-procedure
          pairs with at least 100 claims and $10,000 in total payments are
          considered.
        </p>

        <h4 className="mt-4 text-sm font-bold text-gray-800">State Assignment</h4>
        <p>
          The raw dataset does not include provider location. We use the{' '}
          <strong>NPPES (NPI Registry)</strong> API to look up each provider&apos;s
          state based on their NPI number. Coverage is limited to the top
          providers by spending volume.
        </p>

        <h3 className="mt-6 text-base font-bold text-gray-900">Caveats</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cell suppression means totals are underestimates</li>
          <li>NPI-to-state mapping may not reflect where services were rendered (only provider registration address)</li>
          <li>Beneficiary counts may double-count across months and providers</li>
          <li>The data covers Medicaid only — not Medicare, private insurance, or out-of-pocket spending</li>
          <li>Procedure median is computed from a sample of up to 10,000 provider cost-per-claim values</li>
        </ul>
      </div>
    </div>
  );
}
