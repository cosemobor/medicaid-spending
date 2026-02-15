import { getDb } from '@/lib/db';
import { procedures, procedureMonthly, providerProcedures, stateProcedures } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProcedureDetail from './ProcedureDetail';

export const revalidate = 3600;

interface Props {
  params: Promise<{ hcpcsCode: string }>;
}

export default async function ProcedureDetailPage({ params }: Props) {
  const { hcpcsCode } = await params;
  const db = getDb();

  const [procedure] = await db
    .select()
    .from(procedures)
    .where(eq(procedures.hcpcsCode, hcpcsCode));

  if (!procedure) notFound();

  const [monthly, topProviders, stateBreakdown] = await Promise.all([
    db
      .select()
      .from(procedureMonthly)
      .where(eq(procedureMonthly.hcpcsCode, hcpcsCode))
      .orderBy(procedureMonthly.month),
    db
      .select()
      .from(providerProcedures)
      .where(eq(providerProcedures.hcpcsCode, hcpcsCode))
      .orderBy(desc(providerProcedures.totalPaid))
      .limit(50),
    db
      .select()
      .from(stateProcedures)
      .where(eq(stateProcedures.hcpcsCode, hcpcsCode))
      .orderBy(desc(stateProcedures.totalPaid)),
  ]);

  return (
    <ProcedureDetail
      procedure={procedure}
      monthly={monthly}
      topProviders={topProviders}
      stateBreakdown={stateBreakdown}
    />
  );
}
