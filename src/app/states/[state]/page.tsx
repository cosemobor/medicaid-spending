import { getDb } from '@/lib/db';
import { states, stateMonthly, stateProcedures, providers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import StateDetail from './StateDetail';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ state: string }>;
}

export default async function StateDetailPage({ params }: Props) {
  const { state } = await params;
  const decoded = decodeURIComponent(state);
  const db = getDb();

  const [stateData] = await db
    .select()
    .from(states)
    .where(eq(states.state, decoded));

  if (!stateData) notFound();

  const [monthly, procBreakdown, stateProviders] = await Promise.all([
    db
      .select()
      .from(stateMonthly)
      .where(eq(stateMonthly.state, decoded))
      .orderBy(stateMonthly.month),
    db
      .select()
      .from(stateProcedures)
      .where(eq(stateProcedures.state, decoded))
      .orderBy(desc(stateProcedures.totalPaid)),
    db
      .select()
      .from(providers)
      .where(eq(providers.state, decoded))
      .orderBy(desc(providers.totalPaid))
      .limit(100),
  ]);

  return (
    <StateDetail
      state={stateData}
      monthly={monthly}
      procedures={procBreakdown}
      providers={stateProviders}
    />
  );
}
