import { getDb } from '@/lib/db';
import { procedures } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import ProcedureExplorer from './ProcedureExplorer';

export const revalidate = 3600;

export default async function ProceduresPage() {
  const db = getDb();

  const allProcedures = await db
    .select()
    .from(procedures)
    .orderBy(desc(procedures.totalPaid));

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
      totalCount={allProcedures.length}
      highestSpending={highestSpending}
      highestCpb={highestCpb}
    />
  );
}
