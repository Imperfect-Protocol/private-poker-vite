import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Coins,
  Copy,
  Droplets,
  Fuel,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { usePpdcFaucet } from '@/hooks/usePpdcFaucet';
import { PPDC_FAUCET_MAX_REFILL, formatPpdc } from '@/lib/ppdcFaucet';

const QUICK_AMOUNTS = ['25', '50'];

const ALLOWANCE_TEXT = {
  ok: 'text-white',
  low: 'text-ember-200',
  empty: 'text-red-300',
};

const ALLOWANCE_TILE = {
  ok: 'border-white/10 bg-slate-950/60',
  low: 'border-ember-500/40 bg-ember-500/5',
  empty: 'border-red-500/40 bg-red-500/5',
};

const RULES = [
  { icon: <Coins size={16} strokeWidth={2} aria-hidden />, title: '100 PPDC per refill', copy: 'The cap resets on a timer. No stacking, no infinite minting.' },
  { icon: <RefreshCw size={16} strokeWidth={2} aria-hidden />, title: 'One wallet at a time', copy: 'The faucet funds the wallet you connect. Nothing else.' },
  { icon: <ShieldCheck size={16} strokeWidth={2} aria-hidden />, title: 'Test token only', copy: 'PPDC has no cash value. It exists to move test chips.' },
];

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

function StatTile({ label, children, hint, tone = 'ok' }) {
  return (
    <div className={`rounded-xl border p-4 ${ALLOWANCE_TILE[tone]}`}>
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-xl font-black tracking-tight">
        {children}
      </div>
      {hint && (
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function FaucetPage() {
  const faucet = usePpdcFaucet();
  const { copied, copy } = useCopyFeedback();

  const amountLabel = faucet.isLoading
    ? 'Loading...'
    : faucet.allowance == null
      ? '—'
      : `${formatPpdc(faucet.allowance)} PPDC`;

  return (
    <main className="min-h-full px-4 py-10 md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-10 shadow-[0_40px_140px_-60px_rgba(225,29,72,0.65)] backdrop-blur md:px-12 md:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
          />

          <div className="relative grid gap-10 md:grid-cols-[1.35fr_0.9fr] md:items-center">
            <div>
              <Eyebrow>PPDC faucet</Eyebrow>

              <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-6xl">
                Claim PPDC.
                <br />
                <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-teal-500 bg-clip-text text-transparent">
                  Take a seat.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
                PPDC is the test token behind every chip. Connect the wallet you
                play with, claim up to 100 PPDC, and the faucet sends it straight
                to you on Arbitrum Sepolia.
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-teal-500/70" aria-hidden />
                  Arbitrum Sepolia
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-teal-500/70" aria-hidden />
                  6 decimals
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-teal-500/70" aria-hidden />
                  No real money
                </li>
              </ul>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Faucet rules
              </p>
              <ul className="mt-4 space-y-4">
                {RULES.map((rule) => (
                  <li key={rule.title} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      {rule.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{rule.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-400">{rule.copy}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Eyebrow>Your claim</Eyebrow>
              <h2 className="mt-2 text-2xl font-black tracking-tighter text-white">
                Test funds, straight to your wallet
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden />
              Arbitrum Sepolia
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">
                Wallet
              </p>
              {faucet.isConnected && (
                <button
                  type="button"
                  onClick={() => copy(faucet.address)}
                  aria-label={copied ? 'Copied' : 'Copy wallet address'}
                  title={copied ? 'Copied' : 'Copy wallet address'}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                    copied
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                      : 'border-white/10 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-100'
                  }`}
                >
                  {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
                </button>
              )}
            </div>
            <p className="mt-1 break-all font-mono text-sm text-slate-100">
              {faucet.address ?? 'Not connected'}
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <StatTile
              label="Remaining allowance"
              tone={faucet.allowanceTone}
              hint={faucet.isConnected ? 'Caps at 100 PPDC per refill period.' : 'Connect a wallet to check your allowance.'}
            >
              <span className={ALLOWANCE_TEXT[faucet.allowanceTone]}>
                {amountLabel}
              </span>
            </StatTile>
            <StatTile
              label="Next refill"
              hint={faucet.isConnected ? 'Allowance refills automatically.' : 'No wallet connected.'}
            >
              <span className="text-base font-bold text-slate-200">
                {faucet.isConnected ? faucet.nextRefill : '—'}
              </span>
            </StatTile>
          </div>

          <div className="mt-6">
            <label htmlFor="ppdc-amount" className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">
              Amount of PPDC to claim
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                id="ppdc-amount"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                value={faucet.amount}
                onChange={(event) => faucet.setAmount(event.target.value)}
                disabled={!faucet.isConnected || faucet.isFunding}
                className="w-40 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 font-mono text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:text-slate-500"
              />
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => faucet.setAmount(value)}
                  disabled={!faucet.isConnected || faucet.isFunding}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-600"
                >
                  {value}
                </button>
              ))}
              <button
                type="button"
                onClick={() => faucet.setAmount(formatPpdc(PPDC_FAUCET_MAX_REFILL).replace(/,/g, ''))}
                disabled={!faucet.isConnected || faucet.isFunding}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                Max
              </button>
            </div>
            {faucet.requestedAmount != null
              && faucet.allowance != null
              && faucet.requestedAmount > faucet.allowance && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ember-200/80">
                  Your claim will be capped to {formatPpdc(faucet.claimAmount)} PPDC.
                </p>
              )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Current balance{' '}
              <span className="ml-1 text-sm font-bold tracking-normal text-slate-200">
                {faucet.balance == null ? '—' : `${formatPpdc(faucet.balance)} PPDC`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {faucet.isConnected ? (
                <button
                  type="button"
                  onClick={faucet.fund}
                  disabled={!faucet.canClaim}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.3)] transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  <Wallet size={14} aria-hidden />
                  {faucet.isFunding ? 'Funding...' : 'Claim PPDC'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => faucet.open()}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.3)] transition-colors hover:bg-teal-400"
                >
                  <Wallet size={14} aria-hidden />
                  Connect wallet
                </button>
              )}
              <Link
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors hover:border-teal-400/60 hover:text-white"
              >
                Next step
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          </div>

          {faucet.message && (
            <p className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs leading-5 text-emerald-200">
              {faucet.message}
            </p>
          )}
          {faucet.error && (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-200">
              {faucet.error}
            </p>
          )}
          {faucet.isConnected && faucet.allowance === 0n && (
            <p className="mt-4 rounded-lg border border-ember-500/30 bg-ember-500/5 px-4 py-3 font-mono text-[10px] uppercase leading-5 tracking-[0.16em] text-ember-100/80">
              This wallet has used its allowance for now. Check back at the next refill.
            </p>
          )}
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-slate-900/45 p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/10 text-teal-200">
              <Fuel size={16} strokeWidth={2} aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-black tracking-tight text-white">
              Keep some gas ready
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The claim is a transaction, so the wallet pays a small gas fee in
              Arbitrum Sepolia ETH. Any faucet ETH covers it.
            </p>
            <Link
              to="/get-started"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300 transition-colors hover:text-teal-100"
            >
              <Droplets size={12} aria-hidden />
              Get test ETH
            </Link>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/45 p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
              <Coins size={16} strokeWidth={2} aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-black tracking-tight text-white">
              PPDC is not money
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              It is a test token used for chips on a test deployment. Contracts
              may be redeployed and balances can be reset.
            </p>
            <Link
              to="/get-started"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300 transition-colors hover:text-teal-100"
            >
              <ShieldCheck size={12} aria-hidden />
              Read the setup guide
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
