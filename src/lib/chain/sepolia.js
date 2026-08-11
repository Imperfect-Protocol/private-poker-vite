export const chainConfig = {
  key: 'sepolia',
  chainId: 421_614,
  rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  ppdcContractAddress: '0x8c249811feabf60ffcee34730a48072e27c89c23',
  privatePokerContractAddress: '0xa069bfcb7472fb6ea73d5a88b7c1f6d2bf65a871',
  settlerFacetAddress: '0x1bfbd2f9de51a3c27fe498ff594418a4cd8fca34',
  aggregatePubKeyFacetAddress: '0xdf30c8df93e1c52506d77289b94dd129e093c169',
  hashToCurveAddress: '0x6c52cf275a9de1f1483d4085cb00f1a3fe54ea64',
  verifySignatureAddress: '0xe098f424072d6f156d08e691f1160e8043082a9f',
  maxGas: {
    privatePoker: {
      functions: {
        startHand: 2_000_000n,
      },
    },
  },
  pollingInterval: 6000,
  staleTime: 10000,
  lastModified: '20260522T161800Z',
};
