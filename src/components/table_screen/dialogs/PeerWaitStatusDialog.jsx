"use client";

import TableDialogOverlay from '@/components/dialog/TableDialogOverlay';

function formatAddress(address) {
  const text = String(address ?? '');
  if (!text) return 'Peer';
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function copyForStatus(status, peerAddress) {
  const peerLabel = formatAddress(peerAddress);

  if (status === 'PeerRejected') {
    return {
      title: 'Peer Rejected',
      body: `${peerLabel} rejected your offer.`,
    };
  }

  return {
    title: 'Peer Notified',
    body: `${peerLabel} was notified in the lobby. Waiting for them to accept.`,
  };
}

export default function PeerWaitStatusDialog({ status, peerAddress, onClose }) {
  const copy = copyForStatus(status, peerAddress);

  return (
    <TableDialogOverlay>
      <div className="border-b border-yellow-500/20 bg-slate-950/50 p-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-yellow-500">
          Private Poker
        </p>
        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
          {copy.title}
        </h1>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <p className="text-sm leading-6 text-slate-300">
          {copy.body}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-yellow-400 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_20px_rgba(250,204,21,0.28)] transition-colors hover:bg-yellow-300"
        >
          Close
        </button>
      </div>
    </TableDialogOverlay>
  );
}
