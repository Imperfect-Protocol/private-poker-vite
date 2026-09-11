"use client";

import TableDialogOverlay from '@/components/dialog/TableDialogOverlay';

function formatAddress(address) {
  const text = String(address ?? '');
  if (!text) return 'Peer';
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

export default function PeerWaitRequestDialog({ request, onAccept, onLater }) {
  const roomLabel = `Room ${request.tableId ?? '?'}`;
  const peerLabel = formatAddress(request.from);

  return (
    <TableDialogOverlay>
      <div className="border-b border-teal-500/20 bg-slate-950/50 p-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-teal-500">
          Private Poker
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
          Peer Waiting
        </h1>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <p className="text-sm leading-6 text-slate-300">
          {peerLabel} is waiting for you in {roomLabel}. Accept to reopen the table and continue the P2P connection.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onLater?.(request)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => onAccept?.(request)}
            className="rounded-lg bg-teal-400 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.25)] transition-colors hover:bg-teal-300"
          >
            Accept
          </button>
        </div>
      </div>
    </TableDialogOverlay>
  );
}
