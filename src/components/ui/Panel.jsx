const PANEL_ACCENT = {
  crimson: 'border-white/[0.08] before:via-teal-500/60',
  gold: 'border-cyan-400/20 before:via-cyan-300/60',
};

export default function Panel(props) {
  return (
    <section
      aria-label={props.label}
      className={`relative rounded-2xl border bg-slate-950/75 p-6 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent md:p-8 ${PANEL_ACCENT[props.accent ?? 'crimson']} ${props.className ?? ''}`}
    >
      {props.children}
    </section>
  );
}
