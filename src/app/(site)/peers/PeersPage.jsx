import { ArrowRight, Network, Users } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useLobbyP2PSession } from '@/contexts/LobbyP2PContext.js';

const shortAddress = (address) => {
  const text = String(address ?? '');
  return text ? `${text.slice(0, 6)}...${text.slice(-4)}` : '—';
};

const shortId = (value) => (value == null ? '—' : String(value));

const clock = (at) => (at ? new Date(at).toLocaleTimeString() : '—');

function Eyebrow({ children }) {
  return (
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-teal-400">
      {children}
    </p>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tighter text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{hint}</p>
    </div>
  );
}

function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

export default function PeersPage() {
  const lobbyP2P = useLobbyP2PSession();
  const hasLobby = Boolean(lobbyP2P.lobbyId);

  return (
    <main className="min-h-full px-4 py-10 md:px-10 md:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-10 shadow-[0_40px_140px_-60px_rgba(225,29,72,0.65)] backdrop-blur md:px-12 md:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <Eyebrow>Peers</Eyebrow>
            <h1 className="mt-4 text-3xl font-black uppercase leading-[0.98] tracking-tighter text-white md:text-5xl">
              The network around your table
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Background lobby connections and the table tabs this browser has
              announced. Connections live with this tab, so moving between pages
              does not drop them.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
              <span>Lobby {shortId(lobbyP2P.lobbyId)}</span>
              <span>Peer {shortAddress(lobbyP2P.peerId)}</span>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <Stat
            label="Connected peers"
            value={lobbyP2P.peers.length}
            hint={hasLobby ? 'Live background routes held by this tab.' : 'Open a lobby to start the background network.'}
          />
          <Stat
            label="Table tabs"
            value={lobbyP2P.tableTabs.length}
            hint="Table tabs this browser has announced in the last few minutes."
          />
        </section>

        {!hasLobby && (
          <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/50 p-8 text-center">
            <Network size={22} aria-hidden className="mx-auto text-teal-300" />
            <p className="mt-4 text-sm font-bold text-white">No lobby connection yet</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Enter a lobby once and its network stays attached to this tab.
            </p>
            <RouterLink
              to="/main-lobby"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 shadow-[0_0_24px_rgba(255,56,92,0.35)] transition-colors hover:bg-teal-400"
            >
              Open lobbies
              <ArrowRight size={14} aria-hidden />
            </RouterLink>
          </section>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Users size={16} aria-hidden className="text-teal-300" />
            <h2 className="text-lg font-black tracking-tight text-white">Connected peers</h2>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="font-mono text-[9px] uppercase tracking-[0.24em] text-slate-500">
                  <th className="pb-3 pr-4 font-normal">Peer</th>
                  <th className="pb-3 pr-4 font-normal">Lobby</th>
                  <th className="pb-3 pr-4 font-normal">Table</th>
                  <th className="pb-3 font-normal">Connected</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs text-slate-300">
                {lobbyP2P.peers.length === 0 && (
                  <EmptyRow colSpan={4}>
                    No peers connected right now.
                  </EmptyRow>
                )}
                {lobbyP2P.peers.map((peer) => (
                  <tr key={peer.address} className="border-t border-white/[0.06]">
                    <td className="py-3 pr-4 font-bold text-cyan-200" title={peer.address}>
                      {shortAddress(peer.address)}
                    </td>
                    <td className="py-3 pr-4">{shortId(peer.lobbyId)}</td>
                    <td className="py-3 pr-4">{shortId(peer.tableId)}</td>
                    <td className="py-3 text-slate-400">{clock(peer.connectedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Network size={16} aria-hidden className="text-cyan-200" />
            <h2 className="text-lg font-black tracking-tight text-white">Table tabs</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Table tabs in this browser that have announced activity, including
            tabs opened in their own window.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="font-mono text-[9px] uppercase tracking-[0.24em] text-slate-500">
                  <th className="pb-3 pr-4 font-normal">Table</th>
                  <th className="pb-3 pr-4 font-normal">Lobby</th>
                  <th className="pb-3 pr-4 font-normal">Owner</th>
                  <th className="pb-3 font-normal">Last activity</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs text-slate-300">
                {lobbyP2P.tableTabs.length === 0 && (
                  <EmptyRow colSpan={4}>
                    No table tabs seen yet.
                  </EmptyRow>
                )}
                {lobbyP2P.tableTabs.map((tab) => (
                  <tr key={`${tab.lobbyId}:${tab.tableId}`} className="border-t border-white/[0.06]">
                    <td className="py-3 pr-4 font-bold text-cyan-200">{shortId(tab.tableId)}</td>
                    <td className="py-3 pr-4">{shortId(tab.lobbyId)}</td>
                    <td className="py-3 pr-4" title={tab.ownerAddress ?? undefined}>
                      {shortAddress(tab.ownerAddress)}
                    </td>
                    <td className="py-3 text-slate-400">{clock(tab.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
