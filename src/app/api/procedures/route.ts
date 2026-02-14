import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { procedures } from '@/lib/db/schema';
import { desc, asc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const db = getDb();
  const params = req.nextUrl.searchParams;

  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') ?? '25', 10)));
  const offset = (page - 1) * limit;
  const sortBy = params.get('sort') ?? 'totalPaid';
  const sortDir = params.get('dir') === 'asc' ? 'asc' : 'desc';
  const search = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const minSpending = parseFloat(params.get('minSpending') ?? '0') || 0;

  // Valid sort columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortColumns: Record<string, any> = {
    totalPaid: procedures.totalPaid,
    totalClaims: procedures.totalClaims,
    totalBeneficiaries: procedures.totalBeneficiaries,
    providerCount: procedures.providerCount,
    avgCostPerClaim: procedures.avgCostPerClaim,
    avgCostPerBeneficiary: procedures.avgCostPerBeneficiary,
    claimsPerBeneficiary: procedures.claimsPerBeneficiary,
    medianCostPerClaim: procedures.medianCostPerClaim,
  };

  const sortCol = sortColumns[sortBy] ?? procedures.totalPaid;
  const orderFn = sortDir === 'asc' ? asc : desc;

  const conditions: ReturnType<typeof sql>[] = [];
  if (search) {
    conditions.push(sql`${procedures.hcpcsCode} LIKE ${'%' + search + '%'}`);
  }
  if (category) {
    conditions.push(sql`${procedures.category} = ${category}`);
  }
  if (minSpending > 0) {
    conditions.push(sql`${procedures.totalPaid} >= ${minSpending}`);
  }

  const whereClause =
    conditions.length > 0
      ? sql.join(conditions, sql` AND `)
      : undefined;

  const [rows, countResult] = await Promise.all([
    whereClause
      ? db
          .select()
          .from(procedures)
          .where(whereClause)
          .orderBy(orderFn(sortCol))
          .limit(limit)
          .offset(offset)
      : db
          .select()
          .from(procedures)
          .orderBy(orderFn(sortCol))
          .limit(limit)
          .offset(offset),
    whereClause
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(procedures)
          .where(whereClause)
      : db.select({ count: sql<number>`count(*)` }).from(procedures),
  ]);

  return NextResponse.json({
    data: rows,
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
}
