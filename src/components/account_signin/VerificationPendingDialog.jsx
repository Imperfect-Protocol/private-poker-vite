import { useConnection } from 'wagmi';
import { Home, Mail, Wallet } from 'lucide-react';
import { VERIFY_EMAIL } from '@/components/contact/ContactVerifyDialog';
import TableDialogOverlay from '@/components/dialog/TableDialogOverlay';
import CopyValueRow from '@/components/ui/CopyValueRow';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';

const BACK_HOME_BUTTON = 'mt-2 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-500 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.3)] transition hover:bg-teal-400';

/** Blocks the status step until the player leaves to request manual verification. */
export default function VerificationPendingDialog({ onBackHome }) {
  const { address } = useConnection();
  const emailCopy = useCopyFeedback();
  const addressCopy = useCopyFeedback();
  const walletAddress = address ?? '';

  return (
    <TableDialogOverlay>
      <div role="dialog" aria-modal="true" aria-labelledby="verification-pending-title">
        <div className="border-b border-teal-500/20 bg-slate-950/50 p-6">
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-teal-500">
            Private Poker
          </p>
          <h1 id="verification-pending-title" className="text-2xl font-black uppercase tracking-tighter text-white">
            Verification pending
          </h1>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <p className="text-sm leading-6 text-slate-300">
            Your account needs to be verified. Send an email to:
          </p>
          <CopyValueRow
            icon={<Mail size={16} aria-hidden />}
            value={VERIFY_EMAIL}
            copied={emailCopy.copied}
            onCopy={() => emailCopy.copy(VERIFY_EMAIL)}
            label="Copy email address"
          />

          <p className="text-sm leading-6 text-slate-300">
            Include your ETH address:
          </p>
          <CopyValueRow
            icon={<Wallet size={16} aria-hidden />}
            value={walletAddress}
            copied={addressCopy.copied}
            onCopy={() => addressCopy.copy(walletAddress)}
            label="Copy ETH address"
          />

          <button type="button" onClick={onBackHome} className={BACK_HOME_BUTTON}>
            <Home size={15} aria-hidden />
            Back home
          </button>
        </div>
      </div>
    </TableDialogOverlay>
  );
}
