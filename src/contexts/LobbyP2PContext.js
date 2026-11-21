import { createContext, useContext } from 'react';

export const LobbyP2PContext = createContext(null);

/** The tab's background lobby connection, owned by LobbyP2PProvider. */
export function useLobbyP2PSession() {
  const context = useContext(LobbyP2PContext);
  if (!context) {
    throw new Error('useLobbyP2PSession must be used inside LobbyP2PProvider');
  }
  return context;
}
