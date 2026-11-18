import { Link, useNavigate } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import { LoaderCircle, LogIn, Power, UserPlus, Wallet } from 'lucide-react';
import { useConnection, useDisconnect } from 'wagmi';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import { useMemberAccess } from '@/hooks/useMemberAccess';

const BASE = 'inline-flex h-8 items-center gap-2 rounded px-6 text-[0.8em] font-bold uppercase tracking-widest transition-all active:scale-95';

const SOLID_TEAL_BUTTON = `${BASE} bg-teal-500 text-slate-950 shadow-[0_0_18px_rgba(255,56,92,0.3)] hover:bg-teal-400`;
const SIGN_UP_BUTTON = `${BASE} bg-ember-500 text-slate-950 shadow-[0_0_18px_rgba(255,165,0,0.3)] hover:bg-ember-400`;
const CHECKING_BUTTON = `${BASE} border border-white/10 bg-slate-900 text-slate-500`;

const NO_ACCOUNT = 0n;

const shortAddress = (address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

/**
 * One navbar action that follows the wallet through the funnel: connect a
 * wallet, then sign up if the wallet has no account yet, then sign in. Once a
 * session is active it turns into the address plus a power button.
 */
export default function NavAccountButton() {
  const { address, isConnected } = useConnection();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { clearSession } = useAccountSession();
  const { accountStatus, hasCurrentWalletKeypair, isChecking } = useMemberAccess();
  const navigate = useNavigate();

  if (!isConnected) {
    return (
      <button type="button" onClick={() => open()} className={SOLID_TEAL_BUTTON}>
        <Wallet size={14} aria-hidden />
        Connect Wallet
      </button>
    );
  }

  if (hasCurrentWalletKeypair) {
    const signOut = () => {
      clearSession();
      disconnect();
      navigate('/');
    };

    return (
      <div className="flex h-8 items-center rounded border border-teal-500/20 bg-slate-900 pl-3 pr-1">
        <span className="font-mono text-[0.8em] font-bold text-teal-500">
          {shortAddress(address)}
        </span>
        <span className="mx-2 text-slate-700">|</span>
        <button
          type="button"
          onClick={signOut}
          aria-label="Disconnect wallet"
          title="Disconnect"
          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <Power size={14} aria-hidden />
        </button>
      </div>
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
