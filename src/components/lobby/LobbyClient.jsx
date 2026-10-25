"use client";

import GameLobby from '@/components/lobby/GameLobby';
import { useLobby } from '@/hooks/useLobby';

export default function LobbyClient({ id }) {
  const { tables, lobbyInfo, userTables, isLoading } = useLobby(id);

  return (
    <main className="min-h-full px-4 pt-4 pb-8 md:px-24 md:pt-8 md:pb-10 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl">

        <header className="mb-8 px-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-teal-500">Lobby</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-50 drop-shadow-[0_0_28px_rgba(225,29,72,0.35)] md:text-4xl">
            {lobbyInfo.name}
          </h1>
        </header>

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
    </main>
  );
}
