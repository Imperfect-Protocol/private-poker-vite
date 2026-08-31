export default function AccessRestricted() {
  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-8 h-px w-40 bg-gradient-to-r from-transparent via-red-700 to-transparent" />
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.45em] text-red-900">
          Private Poker
        </p>
        <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.18em] text-red-500 sm:text-5xl">
          Access Restricted
        </h1>
      </div>
    </div>
  );
}
