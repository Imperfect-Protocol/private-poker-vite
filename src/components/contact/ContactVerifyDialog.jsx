import { useEffect } from 'react';
import { Check, Copy, Mail, X } from 'lucide-react';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';

export const CONTACT_EMAIL = 'info@contact.imperfectprotocol.ie';
export const VERIFY_EMAIL = 'verify@contact.imperfectprotocol.ie';

const COPY_BY_MODE = {
  contact: {
    eyebrow: 'Contact',
    title: 'Talk to us',
    body: 'Questions, partnerships, or something that is not working? Send us an email and we will get back to you.',
    email: CONTACT_EMAIL,
    note: 'Include your wallet address if your question is about a table or an account.',
  },
  verify: {
    eyebrow: 'Verify account',
    title: 'Get verified',
    body: 'Your account starts unverified. Send us an email using the wallet address you signed in with, and we will review the request.',
    email: VERIFY_EMAIL,
    note: 'Verification is manual and requires 18+ and a jurisdiction check.',
  },
};

export default function ContactVerifyDialog({ mode = 'contact', onClose }) {
  const copy = COPY_BY_MODE[mode] ?? COPY_BY_MODE.contact;
  const { copied, copy: copyEmail } = useCopyFeedback();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-verify-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-900/95 shadow-[0_0_50px_rgba(225,29,72,0.18)] backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950/50 p-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400">
              {copy.eyebrow}
            </p>
            <h2
              id="contact-verify-title"
              className="mt-2 text-2xl font-black uppercase tracking-tighter text-white"
            >
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <p className="text-sm leading-6 text-slate-300">
            {copy.body}
          </p>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <Mail size={16} aria-hidden className="shrink-0 text-cyan-200" />
            <span className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-slate-100">
              {copy.email}
            </span>
            <button
              type="button"
              onClick={() => copyEmail(copy.email)}
              aria-label={copied ? 'Copied' : 'Copy email address'}
              title={copied ? 'Copied' : 'Copy email address'}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                copied
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100'
              }`}
            >
              {copied
                ? <Check size={16} aria-hidden />
                : <Copy size={16} aria-hidden />}
            </button>
          </div>

          <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.18em] text-slate-500">
            {copy.note}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-teal-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.3)] transition-colors hover:bg-teal-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
