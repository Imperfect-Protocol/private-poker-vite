import { ArrowRight, Sparkles } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const SIGNALS = ['Systems engineer', 'Protocol designer', 'Founder'];

const CHAPTERS = [
  {
    title: 'Games came first',
    copy: 'Sonia began by building tools for game teams: C++ frameworks, graphics layers, GUI systems, scripting bridges, and the kind of reusable foundations that let other developers ship actual games. That early work shaped a lasting instinct: make difficult systems understandable enough for people to build with them.',
  },
  {
    title: 'Poker was never just a theme',
    copy: 'Later, in online poker, she designed a simulated-player system that could drive huge test tournaments and help engineers stress real poker servers. Years after that, she worked again with live poker hand data, parsing and analysing game streams. Private Poker is not a random detour; it sits on a long-running fascination with cards, fairness, testing, and hidden state.',
  },
  {
    title: 'Performance under pressure',
    copy: 'In high-frequency trading she worked on FPGA-backed trading systems, risk controls, low-latency paths, reconciliation, and live analysis. That world has very little patience for hand-waving: correctness, latency, failure modes, and operational clarity all matter at once.',
  },
  {
    title: 'Security and systems work',
    copy: 'Her later systems work moved through Windows endpoint protection, browser security, ARM64 platform constraints, WebAssembly runtimes, POSIX compatibility, Rust, C++, and runtime integration. These are the kinds of environments where small details become real bugs, and where architecture has to survive contact with the machine.',
  },
  {
    title: 'Blockchain as engineering material',
    copy: 'Before Private Poker, Sonia worked as a CTO and protocol engineer on Arbitrum-based smart-contract systems, including Rust Stylus contracts, upgrade patterns, access control, and liquidity-aware on-chain allocation. Private Poker grew from that same practical question: what should be on-chain, what should stay peer-to-peer, and how do we make the result usable?',
  },
  {
    title: 'A creative engineer',
    copy: 'The thread through all of this is not one industry, but a character: curiosity, stubbornness, and a taste for building the missing layer. Sonia has written graphics engines, poker robots, trading infrastructure, endpoint protection, WebAssembly runtime pieces, smart contracts, and cryptographic game protocols. Private Poker is where those lives meet.',
  },
];

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

export default function WhoAreWePage() {
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
          <Sparkles
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute bottom-4 right-4 hidden h-52 w-52 text-white/[0.03] md:block"
          />

          <div className="relative max-w-2xl">
            <Eyebrow>Who are we?</Eyebrow>

            <h1 className="mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tighter text-white md:text-6xl">
              We are
              <br />
              <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-teal-500 bg-clip-text text-transparent">
                the builders.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 md:text-lg md:leading-8">
              Private Poker by Imperfect Protocol is led by Sonia: systems
              engineer, protocol designer, and founder who has spent more than
              two decades turning strange, hard technical problems into working
              software.
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
                to="/our-vision"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors hover:border-teal-400/60 hover:text-white"
              >
                Our vision
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
          <div className="max-w-3xl space-y-4 text-sm leading-7 text-slate-400 md:text-base md:leading-8">
            <p>
              Sonia's career has moved through places that look unrelated at
              first glance: PC games, online poker, financial trading, computer
              graphics, cloud workflow systems, endpoint protection, WebAssembly,
              and blockchain protocols. The common pattern is hidden machinery.
              She is drawn to systems where there is a lot happening below the
              surface, where correctness matters, and where the best interface is
              the one that lets other people do difficult work without having to
              hold the whole machine in their head.
            </p>
            <p>
              Private Poker comes from that same place. It is not just a poker
              skin on top of crypto. It is an attempt to make mental poker feel
              real: peer-to-peer gameplay, cryptographic card protection,
              verifiable fairness, and blockchain settlement arranged into
              something people can actually use.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <div className="max-w-2xl">
            <Eyebrow>The path here</Eyebrow>
            <h2 className="mt-3 text-3xl font-black tracking-tighter text-white md:text-4xl">
              Hidden machinery, one layer at a time
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {CHAPTERS.map((chapter, index) => (
              <article key={chapter.title} className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition-colors hover:border-teal-500/40 hover:bg-slate-900/70">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 text-lg font-black tracking-tight text-white">
                  {chapter.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {chapter.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-10 md:px-10">
          <div className="max-w-2xl">
            <Eyebrow>Why it matters</Eyebrow>
            <h2 className="mt-3 text-2xl font-black tracking-tighter text-white md:text-3xl">
              Private Poker is built by someone who likes the hard parts.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              The project combines old mental-poker ideas with modern peer
              networking, BLS cryptography, Arbitrum contracts, and a product
              instinct shaped by games, trading systems, and security
              engineering.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <RouterLink
                to="/"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-200 transition-colors hover:border-teal-400/60 hover:text-white"
              >
                Back home
                <ArrowRight size={14} aria-hidden />
              </RouterLink>
              <RouterLink
                to="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.35)] transition-colors hover:bg-teal-400"
              >
                Get started
                <ArrowRight size={14} aria-hidden />
              </RouterLink>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
