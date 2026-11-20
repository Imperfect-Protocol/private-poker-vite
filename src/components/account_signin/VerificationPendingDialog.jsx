import { Check, Copy, Home, Mail } from 'lucide-react';
import { VERIFY_EMAIL } from '@/components/contact/ContactVerifyDialog';
import TableDialogOverlay from '@/components/dialog/TableDialogOverlay';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';

const BACK_HOME_BUTTON = 'mt-2 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-500 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.3)] transition hover:bg-teal-400';

/** Blocks the status step until the player leaves to request manual verification. */
export default function VerificationPendingDialog({ onBackHome }) {
  const { copied, copy } = useCopyFeedback();

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
            Your account needs to be verified. Send an email to
          </p>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <Mail size={16} aria-hidden className="shrink-0 text-cyan-200" />
            <span className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-slate-100">
              {VERIFY_EMAIL}
            </span>
            <button
              type="button"
              onClick={() => copy(VERIFY_EMAIL)}
              aria-label={copied ? 'Copied' : 'Copy email address'}
              title={copied ? 'Copied' : 'Copy email address'}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                copied
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100'
              }`}
            >
              {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            </button>
          </div>

          <button type="button" onClick={onBackHome} className={BACK_HOME_BUTTON}>
            <Home size={15} aria-hidden />
            Back home
          </button>
        </div>
      </div>
    </TableDialogOverlay>
  );
}
