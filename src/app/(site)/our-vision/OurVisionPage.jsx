import {
  ArrowRight,
  Landmark,
  Lock,
  Network,
  ShieldCheck,
  Spade,
  Trophy,
  Users,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const SIGNALS = ['Mental Poker', 'Peer To Peer', 'Blockchain', 'Zero Trust'];

const IDEA_CARDS = [
  {
    eyebrow: '1979 problem',
    title: 'Mental Poker, made practical',
    copy: 'The original challenge was simple to state and hard to build: can people play a fair card game remotely without trusting a dealer? Private Poker turns that question into a modern product surface.',
  },
  {
    eyebrow: 'Competitive format',
    title: 'Structured play over open-ended wagering',
    copy: 'The experience is framed around committed tables, fixed rules, and bounded participation, so the focus stays on skill, strategy, and transparent outcomes.',
  },
  {
    eyebrow: 'Zero-trust engine',
    title: 'Fairness that does not ask for belief',
    copy: 'Cards, actions, and outcomes are designed to be checked through cryptography and settlement logic rather than hidden server authority.',
  },
];

const HAND_STEPS = [
  { title: 'Lock the deck', copy: 'Players add cryptographic layers before any card becomes meaningful.' },
  { title: 'Shuffle together', copy: 'No single participant owns the order, so no one can quietly control the table.' },
  { title: 'Reveal selectively', copy: 'Only the cards needed for the hand are opened, and private cards stay private.' },
  { title: 'Verify the result', copy: 'The final hand can be checked against the cryptographic trail and table rules.' },
];

const COMPARISON = [
  {
    label: 'Traditional online poker',
    copy: 'A central house shuffles, hosts, tracks balances, and asks players to trust the server.',
  },
  {
    label: 'Private Poker',
    copy: 'Players coordinate directly, the deck is protected cryptographically, and contracts act as referee and vault.',
  },
  {
    label: 'Why it matters',
    copy: 'The table becomes inspectable: no hidden dealer, no opaque game logic, and no server with privileged card knowledge.',
  },
];

const SKILL_CARDS = [
  {
    icon: <Spade size={16} strokeWidth={2} aria-hidden />,
    title: "Texas Hold'em first",
    copy: 'The first table experience is focused, readable, and built around the most familiar poker rhythm.',
  },
  {
    icon: <Users size={16} strokeWidth={2} aria-hidden />,
    title: 'Committed tables',
    copy: 'Players sit into a bounded session instead of drifting in and out of open-ended lobby play.',
  },
  {
    icon: <Trophy size={16} strokeWidth={2} aria-hidden />,
    title: 'Proof of skill',
    copy: 'Wins can become durable achievement signals without turning the table into a speculation surface.',
  },
];

const PRINCIPLES = [
  {
    icon: <Lock size={16} strokeWidth={2} aria-hidden />,
    title: 'Cards stay private by design',
    copy: 'The Crumble protocol uses BLS cryptography so players can shuffle, mask, reveal, and verify cards without handing trust to one operator.',
  },
  {
    icon: <Network size={16} strokeWidth={2} aria-hidden />,
    title: 'The dealer disappears',
    copy: 'Private Poker is built around peer-to-peer play. Game state moves between players instead of through a central poker server that can see the deck.',
  },
  {
    icon: <Landmark size={16} strokeWidth={2} aria-hidden />,
    title: 'Settlement, not surveillance',
    copy: 'The blockchain is the vault and stateless judge. Normal play stays fast and private; final results can be checked for fairness.',
  },
];

const BUILD_ITEMS = [
  { label: 'First game', copy: "Heads-up and tabled Texas Hold'em before Omaha and draw variants." },
  { label: 'P2P network', copy: 'Players exchange signed state directly instead of asking a house server.' },
  { label: 'Verifiable hands', copy: 'BLS masking makes the deck private while still leaving an audit trail.' },
  { label: 'Competition rails', copy: 'Lobbies, tables, tournaments, leaderboards, and achievement proofs grow from the same protocol base.' },
];

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

function Card({ icon, eyebrow, title, copy }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-colors hover:border-teal-500/40 hover:bg-slate-900/70">
      {icon && (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300">
          {icon}
        </span>
      )}
      {eyebrow && (
        <p className={`font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 ${icon ? 'mt-5' : ''}`}>
          {eyebrow}
        </p>
      )}
      <h3 className="mt-2 text-lg font-black tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {copy}
      </p>
    </article>
  );
}

export default function OurVisionPage() {
  return (
    <main className="min-h-full px-4 py-10 md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-12 shadow-[0_40px_140px_-60px_rgba(225,29,72,0.65)] backdrop-blur md:px-14 md:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
          />
          <ShieldCheck
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute bottom-4 right-4 hidden h-52 w-52 text-white/[0.03] md:block"
          />

          <div className="relative max-w-2xl">
            <Eyebrow>Our vision</Eyebrow>

            <h1 className="mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-6xl">
              Peer to peer.
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-teal-500 bg-clip-text text-transparent">
                On blockchain.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
              P2P technology for seamless gameplay protected by advanced
              cryptography. Blockchain settles the balances.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <RouterLink
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.35)] transition-colors hover:bg-teal-400"
              >
                Get started
                <ArrowRight size={14} aria-hidden />
              </RouterLink>
              <RouterLink
                to="/who-are-we"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors hover:border-teal-400/60 hover:text-white"
              >
                Who are we
                <ArrowRight size={14} aria-hidden />
              </RouterLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              {SIGNALS.map((signal) => (
                <li key={signal} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-teal-500/70" aria-hidden />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-2xl">
            <Eyebrow>The idea</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              Privacy as the table stakes
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              Private Poker takes the old mental-poker question seriously: can
              people play a fair hand over a communications channel without a
              trusted third party? The answer here is a frontend-first poker
              experience powered by peer networking, BLS card masking, and
              verifiable settlement.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {IDEA_CARDS.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <Eyebrow>How a hand works</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              Zero trust collaborative shuffle
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              Private Poker is designed around selective revelation: enough
              information to play and verify the hand, never more than the table
              should know.
            </p>
          </div>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HAND_STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 font-mono text-xs font-black text-teal-200">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-sm font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <Eyebrow>Experience poker like never before</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              Fully decentralised gameplay
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              A fully decentralized, serverless table where players coordinate
              directly and the house is replaced by verifiable protocol logic.
            </p>
          </div>

          <dl className="mt-8 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
            {COMPARISON.map((row) => (
              <div key={row.label} className="grid gap-2 p-6 md:grid-cols-[14rem_1fr] md:items-start md:gap-8">
                <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">
                  {row.label}
                </dt>
                <dd className="text-sm leading-6 text-slate-300">{row.copy}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <Eyebrow>Competitive arena</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              Test your skills
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              A house that is a protocol has to be a fair arena before it is
              anything else. The first tables are built around skill, not
              speculation.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SKILL_CARDS.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <Eyebrow>The principles</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              The house as a protocol
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <Eyebrow>What we are building</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              Trust no one. Verify.
            </h2>
          </div>

          <dl className="mt-8 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50">
            {BUILD_ITEMS.map((item) => (
              <div key={item.label} className="grid gap-2 p-6 md:grid-cols-[14rem_1fr] md:items-start md:gap-8">
                <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">
                  {item.label}
                </dt>
                <dd className="text-sm leading-6 text-slate-300">{item.copy}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10 rounded-2xl border-l-2 border-teal-500 bg-gradient-to-r from-teal-500/10 to-transparent px-6 py-6">
          <Eyebrow>Core philosophy</Eyebrow>
          <p className="mt-3 text-lg font-black leading-snug tracking-tight text-slate-100 md:text-2xl">
            Private Poker is not trying to make the house more honest. It is
            trying to remove the house from the critical path.
          </p>
        </section>
      </div>
    </main>
  );
}
