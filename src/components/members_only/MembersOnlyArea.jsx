import { useNavigate } from 'react-router-dom';

export default function MembersOnlyArea() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-8 h-px w-40 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.45em] text-red-900">
          Private Poker
        </p>
        <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.18em] text-red-500 sm:text-5xl">
          Members Only
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm font-semibold leading-7 text-red-200/60">
          Connect a funded member wallet to enter this area.
        </p>
        <button
          type="button"
          onClick={() => navigate('/signin')}
          className="mt-10 rounded border border-red-700/60 bg-red-950/30 px-8 py-3 font-mono text-xs font-black uppercase tracking-[0.28em] text-red-200 transition-colors hover:border-red-500 hover:bg-red-900/40 hover:text-white"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
