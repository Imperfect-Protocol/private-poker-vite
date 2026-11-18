import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Coins,
  Landmark,
  Lock,
  Mail,
  Network,
  Rocket,
  Spade,
  Users,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import ContactVerifyDialog from '@/components/contact/ContactVerifyDialog';

const LEARN_MORE_URL = 'https://private-poker.wasmer.app';
const GET_STARTED_URL = '/get-started';
const ABOUT_US_URL = 'https://private-poker.wasmer.app/who-are-we';

const PILLARS = [
  {
    icon: <Network size={18} strokeWidth={2} aria-hidden />,
    eyebrow: 'No house edge',
    title: 'The dealer disappears',
    copy: 'Game state moves player to player. There is no central poker server holding the deck, the cards, or the balances.',
  },
  {
    icon: <Lock size={18} strokeWidth={2} aria-hidden />,
    eyebrow: 'Mental poker',
    title: 'Your cards stay yours',
    copy: 'Players shuffle, mask, reveal, and verify together with BLS cryptography. Privacy is the mechanism, not a promise.',
  },
  {
    icon: <Landmark size={18} strokeWidth={2} aria-hidden />,
    eyebrow: 'Chain as referee',
    title: 'Settlement, not surveillance',
    copy: 'Arbitrum holds the chips and checks the final hand. It never sits between you and the table.',
  },
];

const SIGNALS = ['Mental Poker', 'Peer To Peer', 'Zero Trust', "Texas Hold'em"];

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

function ExternalLink({ href, children, className = '', external = true }) {
  if (!external) {
    return (
      <RouterLink to={href} className={className}>
        {children}
      </RouterLink>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function Pillar({ icon, eyebrow, title, copy }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-colors hover:border-teal-500/40 hover:bg-slate-900/70">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300">
        {icon}
      </span>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-black tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {copy}
      </p>
    </article>
  );
}

function StoryCard({ icon, eyebrow, title, copy, href, cta, external = true }) {
  return (
    <ExternalLink
      href={href}
      external={external}
      className="group flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:-translate-y-0.5 hover:border-teal-500/40 hover:bg-slate-900/70"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          {icon}
        </span>
        <ArrowUpRight
          size={16}
          aria-hidden
          className="text-slate-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-300"
        />
      </div>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-black tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
        {copy}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300">
        {cta}
        <ArrowRight size={12} aria-hidden />
      </span>
    </ExternalLink>
  );
}

export default function AboutPage() {
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <>
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
          <Spade
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute bottom-4 right-4 hidden h-52 w-52 text-white/[0.03] md:block"
          />

          <div className="relative max-w-2xl">
            <Eyebrow>About Private Poker</Eyebrow>

            <h1 className="mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-6xl">
              Poker without
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-teal-500 bg-clip-text text-transparent">
                a dealer.
              </span>
            </h1>

            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-ember-500/50 bg-ember-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ember-200 shadow-[0_0_18px_rgba(255,165,0,0.22)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember-400" />
              Live on Arbitrum Sepolia
            </span>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
              Private Poker is a peer-to-peer card room. Players hold the game
              state, the deck is protected with BLS cryptography, and Arbitrum
              settles the result. No server ever sees your cards.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ExternalLink
                href={LEARN_MORE_URL}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors hover:border-teal-400/60 hover:text-white"
              >
                Learn more about Private Poker
                <ArrowUpRight size={14} aria-hidden />
              </ExternalLink>
              <ExternalLink
                href={GET_STARTED_URL}
                external={false}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.35)] transition-colors hover:bg-teal-400"
              >
                Get started
                <ArrowRight size={14} aria-hidden />
              </ExternalLink>
            </div>

            <RouterLink
              to="/faucet"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 transition-colors hover:text-cyan-200"
            >
              <Coins size={12} aria-hidden />
              Need test chips? Open the PPDC faucet
              <ArrowRight size={12} aria-hidden />
            </RouterLink>

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
            <Eyebrow>Our vision</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              A fair table, verifiable by anyone
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              The 1979 question was simple: can people play a fair hand remotely
              without trusting a dealer? Private Poker answers it in the
              browser &mdash; direct connections between players, cryptographic
              card masking, and a blockchain that judges instead of hosting.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <Pillar key={pillar.title} {...pillar} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border-l-2 border-teal-500 bg-gradient-to-r from-teal-500/10 to-transparent px-6 py-6">
          <p className="text-lg font-black leading-snug tracking-tight text-slate-100 md:text-2xl">
            No house edge. No hidden deck. Just players and a table anyone can
            audit.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <StoryCard
            icon={<Rocket size={16} strokeWidth={2} aria-hidden />}
            eyebrow="How to get started"
            title="Sit at your first table"
            copy="Set up a wallet, switch to Arbitrum Sepolia, top up with test ETH, and take a seat. The full walkthrough takes a few minutes."
            href={GET_STARTED_URL}
            external={false}
            cta="Read the setup guide"
          />
          <StoryCard
            icon={<Users size={16} strokeWidth={2} aria-hidden />}
            eyebrow="Who we are"
            title="Built by Imperfect Protocol"
            copy="A small, protocol-obsessed team building the table we wanted to play at: private by default and verifiable by design."
            href={ABOUT_US_URL}
            cta="Meet the builders"
          />
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-10 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <Eyebrow>Contact</Eyebrow>
              <h2 className="mt-3 text-2xl font-black tracking-tighter text-white md:text-3xl">
                Questions, tables, partnerships.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Tell us what you want to play. We read every message.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowContactDialog(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-teal-500/50 bg-teal-500/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-teal-100 transition-colors hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
            >
              Contact us
              <Mail size={14} aria-hidden />
            </button>
          </div>
        </section>
      </div>
    </main>

    {showContactDialog && (
      <ContactVerifyDialog mode="contact" onClose={() => setShowContactDialog(false)} />
    )}
    </>
  );
}
