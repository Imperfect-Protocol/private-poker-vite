"use client";

import Web3Provider from '@/components/wallet/Web3Provider';
import { AccountSessionProvider } from 'privatepoker-hooks/react/contexts/AccountSessionContext.jsx';
import { BLSProvider } from 'privatepoker-hooks/react/contexts/BLSContext.jsx';

export function Providers({ children }) {
  return (
    <Web3Provider>
      <AccountSessionProvider>
        <BLSProvider>
          {children}
        </BLSProvider>
      </AccountSessionProvider>
    </Web3Provider>
  );
}
