export const chainConfig = {
  key: 'sepolia',
  chainId: 421_614,
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  ppdcContractAddress: '0x3f06bd3d00aec246eb4111d564b4f10d131e7362',
  privatePokerContractAddress: '0x123f231477b5aa2dfc17fc34bd04bed087e8e189',
  settlerFacetAddress: '0x0a45bb50c7e08c7e2018d73f8d14d1a7eb250d85',
  aggregatePubKeyFacetAddress: '0x284ce388dfd030f14ddb82e82338897dc6a6a97f',
  hashToCurveAddress: '0x32b618f51447d24e1107caadf5844bc60f9033b8',
  verifySignatureAddress: '0x8f006f3c83238290f5a9feec7a3f1f473109c132',
  maxGas: {
    privatePoker: {
      default: 5_000_000n,
      functions: {
        setTableAggregatePublicKey: 10_000_000n,
        settleHand: 50_000_000n,
      },
    },
  },
  pollingInterval: 6000,
  staleTime: 10000,
  lastModified: '20260522T161800Z',
};
