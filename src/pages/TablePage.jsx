// src/pages/TablePage.jsx
import { useParams, useSearchParams } from 'react-router-dom';
import TableClient from '@/components/TableClient';

export default function TablePage() {
  // 1. Get the table ID directly from the URL path (/tables/:id)
  const { id: tableId } = useParams();

  // 2. Get the lobby ID from the query string (?lobbyId=5)
  const [searchParams] = useSearchParams();
  
  // Grab the value, and keep your fallback to "1" just like before
  const lobbyId = searchParams.get('lobbyId') || "1"; 

  return <TableClient tableId={tableId} lobbyId={lobbyId} />;
}