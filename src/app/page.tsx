import { getDb } from '@/lib/db';
import { monthlyNational, procedures, providers, states } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import OverviewDashboard from './OverviewDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();

  const [monthly, totals] = await Promise.all([
    db.select().from(monthlyNational).orderBy(monthlyNational.month),
    db
      .select({
        totalPaid: sql<number>`sum(${monthlyNational.totalPaid})`,
        totalClaims: sql<number>`sum(${monthlyNational.totalClaims})`,
        totalBeneficiaries: sql<number>`sum(${monthlyNational.totalBeneficiaries})`,
      })
      .from(monthlyNational),
  ]);

  const [procCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(procedures);
  const [provCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(providers);
  const [stateCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(states);

  const total = totals[0];

  return (
    <OverviewDashboard
      monthly={monthly}
      totalPaid={total?.totalPaid ?? 0}
      totalClaims={total?.totalClaims ?? 0}
      totalBeneficiaries={total?.totalBeneficiaries ?? 0}
      providerCount={provCount?.count ?? 0}
      procedureCount={procCount?.count ?? 0}
      stateCount={stateCount?.count ?? 0}
    />
  );
}
