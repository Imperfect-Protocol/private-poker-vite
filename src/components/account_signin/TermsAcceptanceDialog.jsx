import TableDialogOverlay from '@/components/dialog/TableDialogOverlay';
import { TERMS_CLAUSES } from '@/components/legal/TermsClauses';

const REJECT_BUTTON = 'inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-white/15 text-sm font-black uppercase tracking-[0.16em] text-slate-200 transition hover:border-white/30 hover:bg-white/5';
const ACCEPT_BUTTON = 'inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg bg-teal-500 text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.35)] transition hover:bg-teal-400';

/**
 * Shown once before a new account is written on chain. The terms live in a
 * scrollable panel so the wallet signature dialog only appears after consent.
 */
export default function TermsAcceptanceDialog({ onAccept, onReject }) {
  return (
    <TableDialogOverlay>
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-b border-teal-500/20 bg-slate-950/50 p-6">
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.3em] text-teal-500">
            Private Poker
          </p>
          <h1 className="text-xl font-black uppercase tracking-tighter text-white md:text-2xl">
            Acceptance of terms and conditions
          </h1>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="text-sm leading-6 text-slate-400">
            Creating an account means you accept these terms.
          </p>
          <ol className="mt-5 grid gap-5">
            {TERMS_CLAUSES.map((clause, index) => (
              <li key={clause.title}>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-teal-400">
                  {String(index + 1).padStart(2, '0')} · {clause.title}
                </p>
                <div className="mt-1.5 text-sm leading-6 text-slate-300">
                  {clause.body}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-3 border-t border-teal-500/20 bg-slate-950/50 p-4">
          <button type="button" onClick={onReject} className={REJECT_BUTTON}>
            Reject
          </button>
          <button type="button" onClick={onAccept} className={ACCEPT_BUTTON}>
            Accept
          </button>
        </div>
      </div>
    </TableDialogOverlay>
  );
}
