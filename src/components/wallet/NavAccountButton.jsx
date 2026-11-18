import { Link } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import { LoaderCircle, LogIn, UserPlus, Wallet } from 'lucide-react';
import { useConnection } from 'wagmi';
import { useMemberAccess } from '@/hooks/useMemberAccess';

const BASE = 'inline-flex h-8 items-center gap-2 rounded px-6 text-[0.8em] font-bold uppercase tracking-widest transition-all active:scale-95';

const SOLID_TEAL_BUTTON = `${BASE} bg-teal-500 text-slate-950 shadow-[0_0_18px_rgba(255,56,92,0.3)] hover:bg-teal-400`;
const SIGN_UP_BUTTON = `${BASE} bg-ember-500 text-slate-950 shadow-[0_0_18px_rgba(255,165,0,0.3)] hover:bg-ember-400`;
const CHECKING_BUTTON = `${BASE} border border-white/10 bg-slate-900 text-slate-500`;

const NO_ACCOUNT = 0n;

/**
 * One navbar action that follows the wallet through the funnel: connect a
 * wallet, then sign up if the wallet has no account yet, then sign in.
 */
export default function NavAccountButton() {
  const { isConnected } = useConnection();
  const { open } = useAppKit();
  const { accountStatus, isChecking } = useMemberAccess();

  if (!isConnected) {
    return (
      <button type="button" onClick={() => open()} className={SOLID_TEAL_BUTTON}>
        <Wallet size={14} aria-hidden />
        Connect Wallet
      </button>
    );
  }

  if (isChecking) {
    return (
      <span className={CHECKING_BUTTON}>
        <LoaderCircle size={14} aria-hidden className="animate-spin" />
        Checking
      </span>
    );
  }

  const hasAccount = accountStatus !== NO_ACCOUNT;

  return (
    <Link to="/signin" className={hasAccount ? SOLID_TEAL_BUTTON : SIGN_UP_BUTTON}>
      {hasAccount
        ? <LogIn size={14} aria-hidden />
        : <UserPlus size={14} aria-hidden />}
      {hasAccount ? 'Sign In' : 'Sign Up'}
    </Link>
  );
}
