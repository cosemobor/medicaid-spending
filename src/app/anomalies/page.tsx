import { getDb } from '@/lib/db';
import { outliers } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import AnomalyExplorer from './AnomalyExplorer';

export const dynamic = 'force-dynamic';

export default async function AnomaliesPage() {
  const db = getDb();

  const [allOutliers, counts] = await Promise.all([
    db.select().from(outliers).orderBy(desc(outliers.totalPaid)).limit(2000),
    db
      .select({
        count: sql<number>`count(*)`,
        highCount: sql<number>`count(case when ${outliers.costIndex} > 2.0 then 1 end)`,
        lowCount: sql<number>`count(case when ${outliers.costIndex} < 0.5 then 1 end)`,
      })
      .from(outliers),
  ]);

  return (
    <AnomalyExplorer
      outliers={allOutliers}
      totalCount={counts[0]?.count ?? 0}
      highCount={counts[0]?.highCount ?? 0}
      lowCount={counts[0]?.lowCount ?? 0}
    />
  );
}
