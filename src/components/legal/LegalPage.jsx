import { ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

/**
 * Shared shell for the single-page legal notices: a compact hero, the clauses,
 * and a way back to the landing page.
 */
export default function LegalPage({ eyebrow, title, updated, intro, clauses }) {
  return (
    <main className="min-h-full px-4 py-10 md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-10 shadow-[0_40px_140px_-60px_rgba(225,29,72,0.65)] backdrop-blur md:px-10 md:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
          />

          <div className="relative">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-4 text-3xl font-black uppercase leading-[0.98] tracking-tighter text-white md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
              Last updated {updated}
            </p>
            {intro && (
              <p className="mt-5 text-sm leading-7 text-slate-300 md:text-base">
                {intro}
              </p>
            )}
          </div>
        </section>

        <article className="mt-8 space-y-7 rounded-3xl border border-white/10 bg-slate-900/50 p-6 md:p-10">
          {clauses.map((clause) => (
            <section key={clause.title}>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                {clause.title}
              </h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-slate-400">
                {clause.body}
              </div>
            </section>
          ))}
        </article>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <RouterLink
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300 transition-colors hover:text-teal-100"
          >
            <ArrowLeft size={12} aria-hidden />
            Back to the landing page
          </RouterLink>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
            Test network demonstration
          </p>
        </div>
      </div>
    </main>
  );
}
