# PRIVATE POKER by Imperfect Protocol ♠️

Private Poker is frontend-only peer-to-peer game with results settlement on Arbitrum blockchain. 

The app implements a solution to 1979 Mental Poker problem with modern BLS cryptography.


- Check our [Crumble](https://github.com/Imperfect-Protocol/crumble) project for reference implementation in Rust, and
- our [P2P](https://github.com/Imperfect-Protocol/privatepoker-p2p) networking library.

## Run locally

Run local dev:

```bash
npm install
npm run dev
```

## Build and run the Wasmer package

The production build includes a standalone JavaScript entry that runs on Wasmer, so the whole frontend can be served as a WebAssembly package.

Build it:

```bash
npm run build-wasmer
```

Run the resulting package locally:

```bash
cd dist
wasmer run --net .
```

## Configuration

Environment variables are read at build time by Vite:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_PRIVATE_POKER_CHAIN` | `sepolia` | `sepolia` or `devnode`: RPC, contracts and gas settings. |
| `NEXT_PUBLIC_PRIVATE_POKER_MESH` | `main` | `main` or `dev`: P2P bootstrapping. |

