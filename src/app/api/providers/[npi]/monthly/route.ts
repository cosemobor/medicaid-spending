import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { providerMonthly } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ npi: string }> }
) {
  const db = getDb();
  const { npi } = await params;

  const rows = await db
    .select({
      month: providerMonthly.month,
      totalPaid: providerMonthly.totalPaid,
    })
    .from(providerMonthly)
    .where(eq(providerMonthly.npi, npi))
    .orderBy(providerMonthly.month);

  return NextResponse.json(rows);
}
