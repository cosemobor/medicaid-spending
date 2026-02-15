import { redirect } from 'next/navigation';

interface MapPageProps {
  searchParams: Promise<{ provider?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const query = params.provider ? `?provider=${params.provider}` : '';
  redirect(`/providers${query}`);
}
