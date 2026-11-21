import TableClient from '@/components/table/TableClient';

export default async function TablePage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const lobbyId = resolvedSearchParams?.lobbyId || "1";
  const peerId = resolvedSearchParams?.peerId || null;
  const initialIsSeated = resolvedSearchParams?.seated === '1' ? true : null;

  return (
    <TableClient
      tableId={id}
      lobbyId={lobbyId}
      peerId={peerId}
      initialIsSeated={initialIsSeated}
    />
  );
}
