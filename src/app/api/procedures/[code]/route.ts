import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { procedures, procedureMonthly, providerProcedures, stateProcedures } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const db = getDb();
  const { code } = await params;

  const [procedure] = await db
    .select()
    .from(procedures)
    .where(eq(procedures.hcpcsCode, code));

  if (!procedure) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [monthly, topProviders, stateBreakdown] = await Promise.all([
    db
      .select()
      .from(procedureMonthly)
      .where(eq(procedureMonthly.hcpcsCode, code))
      .orderBy(procedureMonthly.month),
    db
      .select()
      .from(providerProcedures)
      .where(eq(providerProcedures.hcpcsCode, code))
      .orderBy(desc(providerProcedures.totalPaid))
      .limit(50),
    db
      .select()
      .from(stateProcedures)
      .where(eq(stateProcedures.hcpcsCode, code))
      .orderBy(desc(stateProcedures.totalPaid)),
  ]);

  return NextResponse.json({
    procedure,
    monthly,
    topProviders,
    stateBreakdown,
  });
}
