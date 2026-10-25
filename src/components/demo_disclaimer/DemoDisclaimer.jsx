import { PRIVATE_POKER_DEMO_DISCLAIMER } from '@/lib/constants';

export default function DemoDisclaimer({ variant = 'footer', isVisible = true, isFading = false }) {
  if (variant === 'splash') {
    const className = [
      'pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto max-w-5xl px-4 text-center text-[10px] font-medium leading-tight text-slate-400/75 transition-all duration-700 md:bottom-4 md:text-xs',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      isFading ? 'translate-y-3 opacity-0' : ''
    ].filter(Boolean).join(' ');

    return <p className={className}>{PRIVATE_POKER_DEMO_DISCLAIMER}</p>;
  }

  return (
    <footer className="shrink-0 border-t border-white/[0.06] bg-slate-950/60 px-4 py-4 backdrop-blur-sm">
      <p className="mx-auto max-w-5xl text-center text-[10px] font-medium leading-tight text-slate-500 md:text-xs">
        {PRIVATE_POKER_DEMO_DISCLAIMER}
      </p>
    </footer>
  );
}
