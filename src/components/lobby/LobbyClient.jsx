"use client";

import DemoDisclaimer from '@/components/demo_disclaimer/DemoDisclaimer';
import GameLobby from '@/components/lobby/GameLobby';
import { useLobby } from '@/hooks/useLobby';

export default function LobbyClient({ id }) {
  const { tables, lobbyInfo, userTables, isLoading } = useLobby(id);

  return (
    <main className="min-h-full bg-slate-950 px-4 pt-4 pb-20 md:px-24 md:pt-8 md:pb-16 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl">

        <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-2">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              {lobbyInfo.name}
            </h1>
          </div>

          <div className="hidden md:block text-right">
            <p className="text-slate-500 text-[10px] font-mono leading-none">STATUS: CONNECTED</p>
            <p className="text-teal-400 text-xs font-mono">ACTIVE_TABLES: {tables.length}</p>
          </div>
        </div>

        {isLoading ? (
          <div/>
        ) : (
          <GameLobby
            tables={tables}
            lobbyId={id}
            lobbyName={lobbyInfo.name}
            gameType={lobbyInfo.gameType}
            userTables={userTables}
          />
        )}
      </div>
      <DemoDisclaimer />
    </main>
  );
}
