import { getDb } from '@/lib/db';
import { states, stateMonthly } from '@/lib/db/schema';
import { desc, sql, inArray } from 'drizzle-orm';
import StateExplorer from './StateExplorer';

export const dynamic = 'force-dynamic';

export default async function StatesPage() {
  const db = getDb();

  const [allStates, counts] = await Promise.all([
    db.select().from(states).orderBy(desc(states.totalPaid)),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(states),
  ]);

  // Get monthly data for top 5 states
  const top5 = allStates.slice(0, 5).map((s) => s.state);
  const topStateMonthly =
    top5.length > 0
      ? await db
          .select()
          .from(stateMonthly)
          .where(inArray(stateMonthly.state, top5))
          .orderBy(stateMonthly.month)
      : [];

  return (
    <StateExplorer
      states={allStates}
      totalCount={counts[0]?.count ?? 0}
      topStateMonthly={topStateMonthly}
      top5States={top5}
    />
  );
}
