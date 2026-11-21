import NavAccountButton from '@/components/wallet/NavAccountButton'
import NavWalletStats from '@/components/wallet/NavWalletStats'
import { useMemberAccess } from '@/hooks/useMemberAccess'
import Link from 'next/link'

export default function Navbar() {
  const { hasCurrentWalletKeypair, isAccountVerified } = useMemberAccess()

  return (
    <nav className="h-[var(--navbar-height)] shrink-0 flex justify-between items-center px-6 py-2 border-b border-slate-800">
      <div className="flex items-center gap-12">
        <Link
          href="/"
          className="flex flex-col group transition-opacity hover:opacity-80"
        >
          <span className="text-xl md:text-2xl font-black text-slate-50 tracking-tighter leading-none uppercase drop-shadow-[0_0_22px_rgba(225,29,72,0.4)]">
            Private Poker
          </span>

          <div className="border-t border-teal-500/50 mt-1 pt-1">
            <span className="text-[9px] md:text-[10px] text-cyan-200/80 font-mono tracking-[0.38em] uppercase font-bold leading-none block">
              Imperfect Protocol
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex gap-8 text-[0.8em] font-bold uppercase tracking-[0.2em] text-slate-200">
          {hasCurrentWalletKeypair && isAccountVerified ? (
            <>
              <Link href="/main-lobby" className="hover:text-cyan-200 transition-colors">Lobbies</Link>
              <Link href="/peers" className="hover:text-cyan-200 transition-colors">Peers</Link>
            </>
          ) : (
            <>
              <Link href="/our-vision" className="hover:text-cyan-200 transition-colors">Our Vision</Link>
              <Link href="/who-are-we" className="hover:text-cyan-200 transition-colors">Who Are We</Link>
            </>
          )}
        </div>

      </div>

      <div className="flex items-center gap-3">
        <NavWalletStats />
        <NavAccountButton />
      </div>
    </nav>
  )
}
