import { getDb } from '@/lib/db';
import { monthlyNational, procedures, providers, states, outliers } from '@/lib/db/schema';
import { sql, desc, inArray } from 'drizzle-orm';
import OverviewDashboard from './OverviewDashboard';
import { VALID_STATE_CODES } from '@/lib/us-states';

export const revalidate = 3600;

export default async function HomePage() {
  const db = getDb();

  const [monthly, totals, procCountRow, provCountRow, stateCountRow, topStateRow, topProcRow, outlierCounts, mappedRow] = await Promise.all([
    db.select().from(monthlyNational).orderBy(monthlyNational.month),
    db
      .select({
        totalPaid: sql<number>`sum(${monthlyNational.totalPaid})`,
        totalClaims: sql<number>`sum(${monthlyNational.totalClaims})`,
        totalBeneficiaries: sql<number>`sum(${monthlyNational.totalBeneficiaries})`,
      })
      .from(monthlyNational),
    db.select({ count: sql<number>`count(*)` }).from(procedures),
    db.select({ count: sql<number>`count(*)` }).from(providers),
    db.select({ count: sql<number>`count(*)` }).from(states).where(inArray(states.state, [...VALID_STATE_CODES])),
    db.select({ state: states.state, totalPaid: states.totalPaid }).from(states).where(inArray(states.state, [...VALID_STATE_CODES])).orderBy(desc(states.totalPaid)).limit(1),
    db.select({ hcpcsCode: procedures.hcpcsCode, description: procedures.description, totalPaid: procedures.totalPaid }).from(procedures).orderBy(desc(procedures.totalPaid)).limit(1),
    db.select({ highCount: sql<number>`count(case when ${outliers.costIndex} > 2.0 then 1 end)` }).from(outliers),
    db.select({ count: sql<number>`count(case when ${providers.lat} is not null then 1 end)` }).from(providers),
  ]);

  const total = totals[0];
  const topState = topStateRow[0] ?? null;
  const topProc = topProcRow[0] ?? null;

  return (
    <OverviewDashboard
      monthly={monthly}
      totalPaid={total?.totalPaid ?? 0}
      totalClaims={total?.totalClaims ?? 0}
      totalBeneficiaries={total?.totalBeneficiaries ?? 0}
      providerCount={provCountRow[0]?.count ?? 0}
      procedureCount={procCountRow[0]?.count ?? 0}
      stateCount={stateCountRow[0]?.count ?? 0}
      topStateName={topState?.state ?? null}
      topStatePaid={topState?.totalPaid ?? 0}
      topProcCode={topProc?.hcpcsCode ?? null}
      topProcDescription={topProc?.description ?? null}
      topProcPaid={topProc?.totalPaid ?? 0}
      outlierHighCount={outlierCounts[0]?.highCount ?? 0}
      mappedProviderCount={mappedRow[0]?.count ?? 0}
    />
  );
}
