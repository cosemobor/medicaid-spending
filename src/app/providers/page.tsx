import { getDb } from '@/lib/db';
import { providers, providerProcedures } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import ProviderExplorer from './ProviderExplorer';

export const revalidate = 3600;

interface ProvidersPageProps {
  searchParams: Promise<{ provider?: string; view?: string }>;
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const db = getDb();
  const params = await searchParams;

  const [allProviders, counts, costIndices] = await Promise.all([
    db.select().from(providers).orderBy(desc(providers.totalPaid)).limit(10000),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(providers),
    // Weighted average cost index per provider (weighted by spending per procedure)
    db
      .select({
        npi: providerProcedures.npi,
        avgCostIndex: sql<number>`SUM(cost_index * total_paid) / NULLIF(SUM(total_paid), 0)`,
      })
      .from(providerProcedures)
      .where(sql`cost_index IS NOT NULL`)
      .groupBy(providerProcedures.npi),
  ]);

  // Merge cost indices into provider records
  const ciMap = new Map(costIndices.map((r) => [r.npi, r.avgCostIndex]));
  const providersWithCI = allProviders.map((p) => ({
    ...p,
    avgCostIndex: ciMap.get(p.npi) ?? null,
  }));

  return (
    <ProviderExplorer
      providers={providersWithCI}
      totalCount={counts[0]?.count ?? 0}
      initialProviderNpi={params.provider}
      initialView={params.view === 'list' ? 'list' : 'map'}
    />
  );
}
