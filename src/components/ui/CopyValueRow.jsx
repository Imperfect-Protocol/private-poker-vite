import { Check, Copy } from 'lucide-react';

/** Read-only value with its own copy-to-clipboard control and copied feedback. */
export default function CopyValueRow({ icon, value, copied, onCopy, label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <span className="shrink-0 text-cyan-200">{icon}</span>
      <span className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-slate-100">
        {value}
      </span>
      <button
        type="button"
        onClick={onCopy}
        disabled={!value}
        aria-label={copied ? 'Copied' : label}
        title={copied ? 'Copied' : label}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          copied
            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
            : 'border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100'
        }`}
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </button>
    </div>
  );
}
