import { getDb } from '@/lib/db';
import { states, stateMonthly } from '@/lib/db/schema';
import { desc, inArray } from 'drizzle-orm';
import StateExplorer from './StateExplorer';
import { VALID_STATE_CODES } from '@/lib/us-states';

export const revalidate = 3600;

export default async function StatesPage() {
  const db = getDb();

  const allStates = await db
    .select()
    .from(states)
    .where(inArray(states.state, [...VALID_STATE_CODES]))
    .orderBy(desc(states.totalPaid));

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
      totalCount={allStates.length}
      topStateMonthly={topStateMonthly}
      top5States={top5}
    />
  );
}
