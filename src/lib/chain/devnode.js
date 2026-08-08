export const chainConfig = {
  key: 'devnode',
  chainId: 412_346,
  rpcUrl: '/local-rpc',
  ppdcContractAddress: '0xab8e440727a38bbb180f7032ca4a8009e7b52b80',
  privatePokerContractAddress: '0xc464c03bfe7efa388457b8b392454b99fa18b124',
  settlerFacetAddress: '0x1b9cbdc65a7bebb0be7f18d93a1896ea1fd46d7a',
  aggregatePubKeyFacetAddress: '0x841118047f42754332d0ad4db8a2893761dd7f5d',
  maxGas: {
    privatePoker: {
      default: 5_000_000n,
      functions: {
        settleHand: 25_000_000n,
      },
    },
  },
  pollingInterval: 3000,
  staleTime: 5000,
  lastModified: '20260522T161800Z',
};
