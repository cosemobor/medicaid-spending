import { getDb } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import ProviderExplorer from './ProviderExplorer';

export const dynamic = 'force-dynamic';

export default async function ProvidersPage() {
  const db = getDb();

  const [allProviders, counts] = await Promise.all([
    db.select().from(providers).orderBy(desc(providers.totalPaid)).limit(5000),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(providers),
  ]);

  return (
    <ProviderExplorer
      providers={allProviders}
      totalCount={counts[0]?.count ?? 0}
    />
  );
}
