import { Link as RouterLink } from 'react-router-dom';
import { PRIVATE_POKER_DEMO_DISCLAIMER } from '@/lib/constants';

const LINK = 'text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200';

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
      <p className="mx-auto max-w-5xl text-center text-[10px] font-medium leading-normal text-slate-500 md:text-xs">
        Private Poker (18+) is a private, invitation-only technology
        demonstration for partners, collaborators, developers, testers and
        evaluators.
        No real-money gambling, wagering, prizes or payouts. Poker
        chips and test tokens have no monetary value.
        Games are peer-to-peer and protected by cryptography; hands are verified
        on-chain. 
        Connection data is processed in accordance with our{' '}
        <RouterLink to="/privacy" className={LINK}>Privacy Policy</RouterLink>.
        By continuing, you agree to our{' '}
        <RouterLink to="/terms" className={LINK}>Terms</RouterLink>.
        Success at this demonstration does not imply future success at real-money gambling.
        If gambling is causing a problem for you or someone you know, support is
        available at{' '}
        <a
          href="https://www.begambleaware.org"
          target="_blank"
          rel="noreferrer"
          className={LINK}
        >
          BeGambleAware
        </a>
        .
        <br />
        © 2026 Private Poker by Imperfect Protocol, {' '}
        <a href="https://github.com/Imperfect-Protocol"
          target="_blank"
          rel="noreferrer"
          className={LINK}
        >github.com/Imperfect-Protocol</a>.
      </p>
    </footer>
  );
}