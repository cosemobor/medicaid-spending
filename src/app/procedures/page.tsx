import { getDb } from '@/lib/db';
import { procedures } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';
import ProcedureExplorer from './ProcedureExplorer';

export const dynamic = 'force-dynamic';

export default async function ProceduresPage() {
  const db = getDb();

  const [allProcedures, counts] = await Promise.all([
    db.select().from(procedures).orderBy(desc(procedures.totalPaid)),
    db
      .select({
        count: sql<number>`count(*)`,
        maxPaid: sql<number>`max(${procedures.totalPaid})`,
        maxCpb: sql<number>`max(${procedures.avgCostPerBeneficiary})`,
      })
      .from(procedures),
  ]);

  const stats = counts[0];

  // Find procedure with highest spending and highest cost per beneficiary
  const highestSpending = allProcedures[0];
  const highestCpb = allProcedures.reduce(
    (max, p) =>
      (p.avgCostPerBeneficiary ?? 0) > (max?.avgCostPerBeneficiary ?? 0) ? p : max,
    allProcedures[0]
  );

  return (
    <ProcedureExplorer
      procedures={allProcedures}
      totalCount={stats?.count ?? 0}
      highestSpending={highestSpending}
      highestCpb={highestCpb}
    />
  );
}
