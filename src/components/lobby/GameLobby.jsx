"use client";

import { useState, useMemo } from 'react';
import { Coins, Plus, Search } from 'lucide-react';
import { useLobbyRouteKeeper } from '@/hooks/useLobbyRouteKeeper';
import PeerWaitRequestDialog from '@/components/lobby/PeerWaitRequestDialog';
import Panel from '@/components/ui/Panel';

const TABLE_STATUS = {
  SEATED: 'seated',
  OPEN: 'open',
  PLAYING: 'playing',
  FULL: 'full',
};

const STATUS_BADGE = {
  [TABLE_STATUS.SEATED]: { label: 'Your seat', dot: 'bg-cyan-300 shadow-[0_0_8px_rgba(253,230,138,0.8)]', text: 'text-cyan-200' },
  [TABLE_STATUS.OPEN]: { label: 'Seating', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]', text: 'text-slate-200' },
  [TABLE_STATUS.PLAYING]: { label: 'In play', dot: 'bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(255,56,92,0.8)]', text: 'text-slate-200' },
  [TABLE_STATUS.FULL]: { label: 'Full', dot: 'bg-slate-600', text: 'text-slate-500' },
};

const ACTION_BASE = 'inline-flex h-9 min-w-[96px] items-center justify-center rounded-lg px-4 text-xs font-bold uppercase tracking-[0.14em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const TABLE_ACTION = {
  [TABLE_STATUS.SEATED]: { label: 'Return', className: 'bg-ember-600 text-slate-950 hover:brightness-110 shadow-[0_8px_24px_-8px_rgba(255,90,31,0.8)]' },
  [TABLE_STATUS.OPEN]: { label: 'Join', className: 'bg-ember-500 text-slate-950 hover:bg-ember-400 shadow-[0_8px_24px_-8px_rgba(255,165,0,0.8)]' },
  [TABLE_STATUS.PLAYING]: { label: 'Watch', className: 'border border-white/15 text-slate-200 hover:border-white/30 hover:bg-white/5' },
  [TABLE_STATUS.FULL]: { label: 'Watch', className: 'border border-white/15 text-slate-200 hover:border-white/30 hover:bg-white/5' },
};

function seatCount(value) {
  return parseInt(value, 10);
}

function tableStatus(table, isSeated) {
  if (isSeated) return TABLE_STATUS.SEATED;
  if (table.state === 'playing') return TABLE_STATUS.PLAYING;
  if (seatCount(table.current_players) >= seatCount(table.max_players)) return TABLE_STATUS.FULL;
  return TABLE_STATUS.OPEN;
}

function partitionTables(tables, userTables, searchQuery) {
  const query = searchQuery.toLowerCase().trim();

  return tables.reduce((lobby, table) => {
    if (userTables.includes(table.id.toString())) {
      lobby.myTables.push(table);
    } else if (table.name.toLowerCase().includes(query)) {
      lobby.otherTables.push(table);
    }
    return lobby;
  }, { myTables: [], otherTables: [] });
}

function openSeats(tables) {
  return tables
    .filter((table) => tableStatus(table, false) === TABLE_STATUS.OPEN)
    .reduce((seats, table) => seats + seatCount(table.max_players) - seatCount(table.current_players), 0);
}

function SectionHeading(props) {
  return (
    <div>
      <p className={`font-mono text-[11px] font-bold uppercase tracking-[0.3em] ${props.kickerClass}`}>{props.kicker}</p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-50">{props.title}</h2>
      <p className="mt-1 text-sm text-slate-400">{props.meta}</p>
    </div>
  );
}

function SeatMeter(props) {
  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: props.total }, (_, seat) => (
          <span key={seat} className={`h-1.5 w-3 rounded-full ${seat < props.taken ? 'bg-slate-200/85' : 'bg-white/10'}`} />
        ))}
      </div>
      <span className="font-mono text-[11px] text-slate-400">{props.taken} / {props.total} seats</span>
    </div>
  );
}

function StatusBadge(props) {
  const badge = STATUS_BADGE[props.status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${badge.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
}

function TableRow(props) {
  const action = TABLE_ACTION[props.status];
  const cell = props.status === TABLE_STATUS.SEATED
    ? 'py-4 border-y border-cyan-400/20 bg-cyan-400/[0.04] transition-colors group-hover:bg-cyan-400/[0.07]'
    : 'py-4 border-y border-white/[0.06] bg-white/[0.02] transition-colors group-hover:border-teal-500/25 group-hover:bg-white/[0.05]';

  return (
    <tr className="group">
      <td className={`${cell} rounded-l-xl border-l pl-5 pr-4`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-teal-500/25 bg-[linear-gradient(135deg,rgba(138,18,43,0.85),rgba(9,5,6,0.9))] text-sm font-black uppercase text-slate-50">
            {props.table.name.slice(0, 2)}
          </span>
          <div>
            <div className="font-semibold text-slate-50">{props.table.name}</div>
            <div className="text-xs text-slate-500">{props.table.game}</div>
          </div>
        </div>
      </td>

      <td className={`${cell} px-4`}>
        <div className="flex items-center gap-1.5 font-mono text-base font-bold text-cyan-200">
          <Coins size={14} className="text-cyan-400" aria-hidden="true" />
          {props.table.buyin}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">Blinds {props.table.blinds}</div>
      </td>

      <td className={`${cell} px-4 text-center`}>
        <SeatMeter taken={seatCount(props.table.current_players)} total={seatCount(props.table.max_players)} />
      </td>

      <td className={`${cell} px-4 text-center`}>
        <StatusBadge status={props.status} />
      </td>

      <td className={`${cell} rounded-r-xl border-r pl-4 pr-5 text-right`}>
        <a
          href={`/tables/${props.table.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${ACTION_BASE} ${action.className}`}
        >
          {action.label}
        </a>
      </td>
    </tr>
  );
}

function TableList(props) {
  return (
    <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-left">
      {props.showHead && (
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <th scope="col" className="py-2 pl-5 pr-4 font-semibold">Table</th>
            <th scope="col" className="px-4 py-2 font-semibold">Buy-in</th>
            <th scope="col" className="px-4 py-2 text-center font-semibold">Seats</th>
            <th scope="col" className="px-4 py-2 text-center font-semibold">Status</th>
            <th scope="col" className="py-2 pl-4 pr-5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
      )}
      <tbody>
        {props.tables.map((table) => (
          <TableRow key={table.id} table={table} status={tableStatus(table, props.seated)} />
        ))}
        {props.tables.length === 0 && (
          <tr>
            <td colSpan="5" className="rounded-xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
              {props.emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default function GameLobby(props) {
  const [searchQuery, setSearchQuery] = useState('');
  const routeKeeper = useLobbyRouteKeeper(props.lobbyId);

  const acceptWaitingRequest = (request) => {
    routeKeeper.acceptWaitingRequest(request);
    window.open(`/tables/${request.tableId}?lobbyId=${request.lobbyId}`, '_blank', 'noopener,noreferrer');
  };

  const lobby = useMemo(
    () => partitionTables(props.tables ?? [], props.userTables ?? [], searchQuery),
    [props.tables, props.userTables, searchQuery],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      {routeKeeper.waitingRequest && (
        <PeerWaitRequestDialog
          request={routeKeeper.waitingRequest}
          onAccept={acceptWaitingRequest}
          onLater={routeKeeper.rejectWaitingRequest}
        />
      )}

      {lobby.myTables.length > 0 && (
        <Panel label="Your tables" accent="gold">
          <SectionHeading
            kicker="In progress"
            kickerClass="text-cyan-300"
            title="Your tables"
            meta="Hands you are seated at. Return to pick up where you left off."
          />
          <div className="mt-5 overflow-x-auto">
            <TableList tables={lobby.myTables} seated />
          </div>
        </Panel>
      )}

      <Panel label="Live tables">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            kicker="Join a game"
            kickerClass="text-teal-500"
            title="Live tables"
            meta={`${lobby.otherTables.length} tables · ${openSeats(lobby.otherTables)} open seats`}
          />

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <label className="relative block w-full sm:w-72">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search tables"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/15"
                aria-label="Search available tables"
              />
            </label>

            <a
              href={`/tables/create?lobbyId=${props.lobbyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-ember-500 px-5 text-xs font-bold uppercase tracking-[0.14em] text-slate-950 shadow-[0_10px_30px_-10px_rgba(255,165,0,0.8)] transition hover:bg-ember-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <Plus size={15} strokeWidth={3} aria-hidden="true" />
              Create table
            </a>
          </div>
        </header>

        <div className="custom-scrollbar mt-6 max-h-[440px] overflow-auto pr-1">
          <TableList
            tables={lobby.otherTables}
            showHead
            emptyText={searchQuery ? `No tables match "${searchQuery}"` : 'No tables yet. Create one to get a game going.'}
          />
        </div>
      </Panel>
    </div>
  );
}
