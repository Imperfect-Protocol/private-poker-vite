import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Coins,
  Copy,
  Droplets,
  LoaderCircle,
  Mail,
  Spade,
  TriangleAlert,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import ContactVerifyDialog from '@/components/contact/ContactVerifyDialog';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { useOnboardingPlan } from '@/hooks/useOnboardingPlan';
import { StepState } from '@/lib/onboarding';

const FAUCET_URL = '/faucet';
const BRIDGE_URL = 'https://portal.arbitrum.io/bridge?amount=0&sourceChain=sepolia&destinationChain=arbitrum-sepolia&tab=bridge&sanitized=true';

const WALLETS = [
  ['MetaMask', 'https://metamask.io/'],
  ['Rabby', 'https://rabby.io/'],
  ['Coinbase Wallet', 'https://www.coinbase.com/wallet'],
  ['Rainbow', 'https://rainbow.me/'],
];

const FAUCETS = [
  ['Alchemy Sepolia Faucet', 'https://www.alchemy.com/faucets/ethereum-sepolia'],
  ['Chainlink Faucets', 'https://faucets.chain.link/sepolia'],
  ['Google Cloud Faucet', 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia'],
  ['Arbitrum Sepolia Faucet', 'https://ethfaucet.com/networks/arbitrum'],
];

const ARBITRUM_LINKS = [
  ['Arbitrum Chain Information', 'https://docs.arbitrum.io/for-devs/dev-tools-and-resources/chain-info'],
  ['ChainList Arbitrum Sepolia', 'https://chainlist.org/chain/421614'],
];

const READY_ITEMS = [
  { icon: <Wallet size={16} strokeWidth={2} aria-hidden />, title: 'A wallet', copy: 'Any Ethereum-compatible wallet. MetaMask, Rabby, Coinbase Wallet, Rainbow.' },
  { icon: <Droplets size={16} strokeWidth={2} aria-hidden />, title: 'Sepolia ETH', copy: 'Test gas for Arbitrum Sepolia. Free from faucets, no cash value.' },
  { icon: <Coins size={16} strokeWidth={2} aria-hidden />, title: 'PPDC', copy: 'The test token used for chips. Claim it from the PPDC faucet.' },
];

const STEP_BADGE_STYLES = {
  [StepState.DONE]: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  [StepState.CURRENT]: 'border-teal-500/30 bg-teal-500/10 text-teal-200',
  [StepState.WAITING]: 'border-white/10 bg-white/[0.03] text-slate-500',
};

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

function ActionLink({ href, children, variant = 'primary', icon, internal = false, external = true }) {
  const styles = variant === 'primary'
    ? 'bg-teal-500 text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.35)] hover:bg-teal-400'
    : 'border border-white/15 text-slate-200 hover:border-teal-400/60 hover:text-white';
  const className = `inline-flex items-center gap-2 rounded-lg px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${styles}`;

  if (internal) {
    return (
      <RouterLink to={href} className={className}>
        {children}
        {icon}
      </RouterLink>
    );
  }

  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={className}
    >
      {children}
      {icon}
    </a>
  );
}

function LinkChips({ links, label }) {
  return (
    <div className="mt-4">
      {label && (
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">
          {label}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {links.map(([text, href]) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-100"
          >
            {text}
            <ArrowUpRight size={11} aria-hidden />
          </a>
        ))}
      </div>
    </div>
  );
}

function CopyField({ label, value }) {
  const { copied, copy } = useCopyFeedback();

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-left transition-colors hover:border-cyan-400/40"
    >
      <span className="min-w-0">
        <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-mono text-xs text-slate-200">
          {value}
        </span>
      </span>
      {copied
        ? <Check size={14} aria-hidden className="shrink-0 text-emerald-400" />
        : <Copy size={14} aria-hidden className="shrink-0 text-slate-500 transition-colors group-hover:text-cyan-300" />}
    </button>
  );
}

function StepAction({ onClick, children, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-teal-100 transition-colors hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
    >
      {children}
      {icon}
    </button>
  );
}

function Step({ number, title, state, body, why, expanded, onToggle, children }) {
  const isDone = state === StepState.DONE;
  const isWaiting = state === StepState.WAITING;

  return (
    <li
      className={`rounded-2xl border bg-slate-900/45 transition-colors ${
        isDone ? 'border-emerald-400/25' : 'border-white/10'
      } ${isWaiting ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-4 p-6 text-left md:p-7"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-black ${STEP_BADGE_STYLES[state]}`}>
          {isDone ? <Check size={16} strokeWidth={3} aria-hidden /> : String(number).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`text-lg font-black tracking-tight ${isWaiting ? 'text-slate-300' : 'text-white'}`}>
              {title}
            </span>
            {isDone && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">
                <Check size={10} strokeWidth={3} aria-hidden />
                Done
              </span>
            )}
            {isWaiting && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                Not needed yet
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`mt-1 shrink-0 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 md:px-7 md:pb-7 md:pl-[5.25rem]">
          <p className="text-sm leading-6 text-slate-300">{body}</p>
          <p className="mt-3 border-l-2 border-white/10 pl-3 font-mono text-[11px] leading-5 text-slate-500">
            {why}
          </p>
          {children}
        </div>
      )}
    </li>
  );
}

function JoinCard({ icon, title, copy, done = false, children }) {
  return (
    <li className={`rounded-2xl border p-5 ${done ? 'border-emerald-400/25 bg-emerald-400/[0.04]' : 'border-white/10 bg-slate-900/60'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
          done
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
            : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
        }`}>
          {icon}
        </span>
        {done && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">
            <Check size={11} strokeWidth={3} aria-hidden />
            Done
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p>
      {children}
    </li>
  );
}

function JoinCardAction({ children }) {
  return (
    <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300 transition-colors hover:text-teal-100">
      {children}
    </span>
  );
}

export default function GetStartedPage() {
  const [dialogMode, setDialogMode] = useState(null);
  const [stepOverrides, setStepOverrides] = useState({});
  const onboarding = useOnboardingPlan();
  const plan = onboarding.plan;

  const isExpanded = (id) => stepOverrides[id] ?? (plan.steps[id] === StepState.CURRENT);
  const toggleStep = (id) => {
    setStepOverrides((current) => ({ ...current, [id]: !isExpanded(id) }));
  };

  const accountKnown = !onboarding.isConnected || !onboarding.isCheckingAccount;

  return (
    <>
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
              <Eyebrow>Get started</Eyebrow>

              <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-6xl">
                Four steps to
                <br />
                <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-teal-500 bg-clip-text text-transparent">
                  the table.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
                Private Poker is a technology demo on Arbitrum Sepolia. Set up a
                test wallet once, collect a little test ETH and PPDC, and you are
                ready to take a seat. No real money is involved.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ActionLink href="#setup" external={false} icon={<ArrowRight size={14} aria-hidden />}>
                  Start setup
                </ActionLink>
                <ActionLink
                  href={FAUCET_URL}
                  variant="secondary"
                  internal
                  icon={<ArrowRight size={14} aria-hidden />}
                >
                  PPDC faucet
                </ActionLink>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                {['About 10 minutes', 'Test network only', 'No real money'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-teal-500/70" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Before you sit down
              </p>
              <ul className="mt-4 space-y-4">
                {READY_ITEMS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{item.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-400">{item.copy}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section id="setup" className="mt-14 scroll-mt-8">
          <div className="max-w-2xl">
            <Eyebrow>Setup</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              From empty wallet to seated player
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              Work through the steps in order. Anything your wallet already covers
              is ticked and collapsed; open a step to see its details.
            </p>
          </div>

          <ol className="mt-8 space-y-4">
            <Step
              number={1}
              title="Install a wallet"
              state={plan.steps.install}
              expanded={isExpanded('install')}
              onToggle={() => toggleStep('install')}
              body="Install an Ethereum-compatible wallet. MetaMask is the most common starting point, but Rabby, Coinbase Wallet, and Rainbow all work."
              why="The wallet is your test identity. It holds your test ETH, receives PPDC, and signs actions when you play."
            >
              <div className="mt-4">
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/50 bg-teal-500/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-teal-100 transition-colors hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
                >
                  Get MetaMask
                  <ArrowUpRight size={12} aria-hidden />
                </a>
              </div>
              <LinkChips links={WALLETS} label="Or another wallet" />
            </Step>

            <Step
              number={2}
              title="Add the Arbitrum Sepolia network"
              state={plan.steps.network}
              expanded={isExpanded('network')}
              onToggle={() => toggleStep('network')}
              body={onboarding.isConnected
                ? 'Your wallet needs Arbitrum Sepolia selected before it can show balances or connect to a table.'
                : 'Connect the wallet you want to play with, then add Arbitrum Sepolia or let ChainList add it for you. The values below are all you need.'}
              why="Private Poker runs on Arbitrum Sepolia, so your wallet needs that network before it can show balances or connect."
            >
              {!onboarding.isConnected && onboarding.hasWallet && (
                <div className="mt-4">
                  <StepAction onClick={onboarding.openWallet} icon={<Wallet size={12} aria-hidden />}>
                    Connect wallet
                  </StepAction>
                </div>
              )}
              {onboarding.isConnected && !onboarding.onArbitrum && (
                <div className="mt-4">
                  <StepAction onClick={onboarding.openNetworks} icon={<ArrowRight size={12} aria-hidden />}>
                    Switch to Arbitrum Sepolia
                  </StepAction>
                </div>
              )}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <CopyField label="Chain ID" value="421614" />
                <CopyField label="RPC URL" value="https://sepolia-rollup.arbitrum.io/rpc" />
              </div>
              <LinkChips links={ARBITRUM_LINKS} label="Network details" />
            </Step>

            <Step
              number={3}
              title="Top up Sepolia ETH"
              state={plan.steps.topUp}
              expanded={isExpanded('topUp')}
              onToggle={() => toggleStep('topUp')}
              body="Use a Sepolia faucet to get test ETH. Some faucets fund Ethereum Sepolia, while Arbitrum faucets can fund Arbitrum Sepolia directly."
              why="Test ETH pays the small gas fees for moving test tokens and interacting with the test network. It has no cash value."
            >
              <div className="mt-4">
                <a
                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/50 bg-teal-500/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-teal-100 transition-colors hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
                >
                  Google Sepolia faucet
                  <ArrowUpRight size={12} aria-hidden />
                </a>
              </div>
              <LinkChips links={FAUCETS} label="Or another faucet" />
            </Step>

            <Step
              number={4}
              title="Bridge to Arbitrum Sepolia"
              state={plan.steps.bridge}
              expanded={isExpanded('bridge')}
              onToggle={() => toggleStep('bridge')}
              body="Your ETH is on Ethereum Sepolia. Bridge it to Arbitrum Sepolia with the Arbitrum Portal. Skip this step if you used an Arbitrum Sepolia faucet such as ethfaucet.com."
              why="The bridge moves your test ETH onto the network where Private Poker testing happens."
            >
              <div className="mt-4">
                <a
                  href={BRIDGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 transition-colors hover:border-teal-400/60 hover:text-white"
                >
                  Open Arbitrum Bridge
                  <ArrowUpRight size={12} aria-hidden />
                </a>
              </div>
            </Step>
          </ol>
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-10 md:px-10">
          <div className="max-w-2xl">
            <Eyebrow>Join testing</Eyebrow>
            <h2 className="mt-3 text-2xl font-black tracking-tighter text-white md:text-3xl">
              Three moves and you are in
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Claim test chips, create an unverified account, then ask us to
              verify it.
            </p>
          </div>

          {onboarding.isConnected && (
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              <JoinCard
                icon={<Coins size={16} strokeWidth={2} aria-hidden />}
                title="Claim PPDC"
                done={plan.ppdcReady}
                copy={plan.ppdcReady
                  ? 'Your wallet already holds more than 1,000 PPDC, which is plenty for a table.'
                  : 'Get the test token from our faucet.'}
              >
                {plan.ppdcReady ? (
                  <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                    <Check size={12} strokeWidth={3} aria-hidden />
                    Ready to play
                  </span>
                ) : (
                  <RouterLink to={FAUCET_URL}>
                    <JoinCardAction>
                      PPDC faucet
                      <ArrowRight size={12} aria-hidden />
                    </JoinCardAction>
                  </RouterLink>
              )}
            </JoinCard>

            {!accountKnown && (
              <JoinCard
                icon={<LoaderCircle size={16} strokeWidth={2} aria-hidden className="animate-spin" />}
                title="Checking your account"
                copy="Reading your account status from Arbitrum Sepolia."
              />
            )}

            {accountKnown && !plan.hasAccount && (
              <JoinCard
                icon={<UserPlus size={16} strokeWidth={2} aria-hidden />}
                title="Create an account"
                copy="Sign up with your wallet. Your account starts unverified."
              >
                <RouterLink to="/signin">
                  <JoinCardAction>
                    Sign up
                    <ArrowRight size={12} aria-hidden />
                  </JoinCardAction>
                </RouterLink>
              </JoinCard>
            )}

            {accountKnown && plan.hasAccount && !plan.isVerified && (
              <JoinCard
                icon={<BadgeCheck size={16} strokeWidth={2} aria-hidden />}
                title="Get verified"
                copy="Email us your wallet address and we enable your table access."
              >
                <button type="button" onClick={() => setDialogMode('verify')}>
                  <JoinCardAction>
                    Verify by email
                    <Mail size={12} aria-hidden />
                  </JoinCardAction>
                </button>
              </JoinCard>
            )}

            {accountKnown && plan.isVerified && (
              <JoinCard
                icon={<Spade size={16} strokeWidth={2} aria-hidden />}
                title={onboarding.isSignedIn ? 'Join a game' : 'Sign in'}
                done
                copy={onboarding.isSignedIn
                  ? 'Your account is verified. Pick a lobby and take a seat.'
                  : 'Your account is verified. Sign in with your wallet to take a seat.'}
              >
                <RouterLink to={onboarding.isSignedIn ? '/main-lobby' : '/signin'}>
                  <JoinCardAction>
                    {onboarding.isSignedIn ? 'Find a table' : 'Sign in'}
                    <ArrowRight size={12} aria-hidden />
                  </JoinCardAction>
                </RouterLink>
              </JoinCard>
            )}
          </ol>
          )}

          <div className="mt-8 flex gap-3 border-t border-white/10 pt-6">
            <TriangleAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-ember-300" />
            <p className="font-mono text-[11px] uppercase leading-6 tracking-wide text-ember-100/80">
              Test network product only. No real money is involved. Verification
              requires 18+ and a jurisdiction check. Passing the age dialog does
              not guarantee access. Smart contracts may be redeployed and state
              will be lost.
            </p>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-8 backdrop-blur md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <Eyebrow>Need a hand?</Eyebrow>
              <h2 className="mt-3 text-2xl font-black tracking-tighter text-white md:text-3xl">
                Stuck on a step?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Tell us where you got to and we will walk you through it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDialogMode('contact')}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-teal-100 transition-colors hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
            >
              <Mail size={14} aria-hidden />
              Contact us
            </button>
          </div>
        </section>
      </div>
    </main>

    {dialogMode && (
      <ContactVerifyDialog mode={dialogMode} onClose={() => setDialogMode(null)} />
    )}
    </>
  );
}
