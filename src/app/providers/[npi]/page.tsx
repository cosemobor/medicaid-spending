import { getDb } from '@/lib/db';
import { providers, providerMonthly, providerProcedures } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProviderDetail from './ProviderDetail';

export const revalidate = 3600;

interface Props {
  params: Promise<{ npi: string }>;
}

export default async function ProviderDetailPage({ params }: Props) {
  const { npi } = await params;
  const db = getDb();

  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.npi, npi));

  if (!provider) notFound();

  const [monthly, procBreakdown] = await Promise.all([
    db
      .select()
      .from(providerMonthly)
      .where(eq(providerMonthly.npi, npi))
      .orderBy(providerMonthly.month),
    db
      .select()
      .from(providerProcedures)
      .where(eq(providerProcedures.npi, npi))
      .orderBy(desc(providerProcedures.totalPaid)),
  ]);

  return (
    <ProviderDetail
      provider={provider}
      monthly={monthly}
      procedures={procBreakdown}
    />
  );
}
