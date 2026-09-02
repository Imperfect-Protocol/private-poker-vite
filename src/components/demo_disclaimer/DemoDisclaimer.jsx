import { PRIVATE_POKER_DEMO_DISCLAIMER } from 'privatepoker-hooks/lib/constants';

export default function DemoDisclaimer({ variant = 'footer', isVisible = true, isFading = false }) {
  const className = variant === 'splash'
    ? [
        'pointer-events-none absolute inset-x-0 bottom-3 z-10 mx-auto max-w-5xl px-4 text-center text-[10px] font-medium leading-tight text-slate-400/75 transition-all duration-700 md:bottom-4 md:text-xs',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        isFading ? 'translate-y-3 opacity-0' : ''
      ].filter(Boolean).join(' ')
    : 'pointer-events-none fixed inset-x-0 bottom-3 z-40 mx-auto w-full max-w-5xl px-4 text-center text-[10px] font-medium leading-tight text-slate-600 md:bottom-4 md:text-xs';

  return (
    <p className={className}>
      {PRIVATE_POKER_DEMO_DISCLAIMER}
    </p>
  );
}
