# Plan: Migrate private-poker-vite to the library-owned Lobby/Table P2P architecture

## Problem

`private-poker-vite` still uses the retired P2P architecture from `privatepoker-p2p`:
`VirtualNetwork` with a `routeOracle`, `RouteBus`, `RouteStore`, `LinkDirection`,
and `LobbyRouteKeeper`. Those classes were deleted from `privatepoker-p2p`. The app
also stores state in `sessionStorage` and `localStorage`, violating the "NO BROWSER
STORAGE" requirement. It cannot connect with the current library.

## Reference implementation

`privatepoker-p2p-testapp/src/main.jsx` is the canonical migration target:

- `LobbyP2PSession` — Lobby tab facade. Generates a random `peerId`, owns all neural
  routing, mesh fallback, and background edges.
- `TableP2PSession` — Table tab facade. Takes a required `peerId` inherited from the
  parent Lobby's URL. Asks the Lobby over `BroadcastChannel`; never runs mesh or
  neural directly.
- `BackgroundConnectionKeeper` — keyed by peer address only; answers table find-peer
  requests.
- `TableTunnelServer` — Lobby relays table signalling over its background edge.
- Zero browser storage. All state is in-memory and dies with the tab.

## Changes

### 1. Replace `useLobbyRouteKeeper.js` with `useLobbyP2PSession.js`

**File:** `src/hooks/useLobbyRouteKeeper.js` (delete, add `useLobbyP2PSession.js`)

- Remove `LobbyRouteKeeper` import (class no longer exists).
- Create the hook around `new LobbyP2PSession({...})`.
- Pass `handler`, `address`, `privateKey`, `lobbyId`, `meshUrls`, `iceServers`,
  `broadcastPrefix`.
- Expose `session` (for `.peerId`, `.acceptWaitingRequest`, `.rejectWaitingRequest`).
- Expose `peerId`, `waitingRequest`, `acceptWaitingRequest`, `rejectWaitingRequest`.
- Remove `timeoutMs`, `liveRouteTtlMs` options (library-owned now).
- Keep the existing activity logging (publish to `VirtualNetworkActivityBus`).

### 2. Rewrite `PokerRtcSession` table networking

**File:** `src/lib/PokerRtcSession.js`

- Replace `new VirtualNetwork(handler, address, privateKey, config)` with
  `new TableP2PSession({ handler, address, privateKey, peerId, lobbyId, tableId })`.
- Remove imports: `LinkDirection`, `RouteBus`, `RouteStore`.
- Delete `this.routeBus`, `this.routeStore`, the `routeOracle` callback, and
  `routeBus.publishKeepRoute(...)` calls.
- `ensureNetwork()` now returns a `TableP2PSession` keyed by
  `(address, lobbyId, tableId, peerId, privateKey-ready)`.
- `subscribeTo()` calls `session.subscribe(peerAddress, lobbyId, tableId)`.
- `sendTransportMessage()` calls `session.send(message)`.
- `setLocalMediaStream()` calls `session.setLocalStream(stream)`.
- `destroy()` calls `session.close()`.
- Add required `peerId` field to the session config, populated from the table tab's
  URL parameter.
- All BLS sign/verify, disagreement, and message-cache logic stays unchanged —
  it runs above the transport.

### 3. Pass the Lobby `peerId` into Table tab URLs

**Files:** `src/components/lobby/GameLobby.jsx`, `src/hooks/useLobbyP2PSession.js`

- The Lobby hook captures `session.peerId` in React state.
- `GameLobby` reads it from the hook.
- Every table URL the Lobby opens includes `?peerId=<lobby-peerId>`:
  - `<a href={`/tables/${table.id}?lobbyId=${lobbyId}&peerId=${peerId}`}>`
  - Waiting-request acceptance: `window.open(`/tables/${tableId}?lobbyId=${lobbyId}&peerId=${peerId}`)`
- `sessionStorage` hand-off (`readCreatedTableSnapshot`) is removed; pass data
  through the URL instead.

### 4. Read `peerId` in the Table page and thread it to `PokerRtcSession`

**Files:** `src/app/tables/[id]/page.js`, `src/hooks/useTable.js`,
`src/hooks/useNetwork.js`, `src/lib/PokerRtcSession.js`

- `TableClient` reads `new URLSearchParams(window.location.search).get('peerId')`
  on mount (or from the route's `searchParams`).
- Thread `peerId` through `useTable → useTokenRing → useNetwork → PokerRtcSession`.
- `PokerRtcSession.update({ peerId })` stores it; `ensureNetwork()` passes it to
  `new TableP2PSession({ ..., peerId })`.
- A missing `peerId` (direct-URL navigation without a Lobby parent) logs an error
  and the table skips P2P setup.

### 5. Remove all browser storage

**Files:**
- `src/lib/PokerRtcSession.js` — delete `RouteStore` (uses `localStorage`).
- `src/components/table/TableClient.jsx` — delete `readCreatedTableSnapshot`
  (uses `sessionStorage`).
- `src/components/create_table_screen/Component.jsx` — replace the
  `sessionStorage.setItem(...)` hand-off with URL params.
- `src/lib/lobbyEvents.js` — remove the `localStorage.setItem` fallback and the
  `storage` event listener. Keep the `BroadcastChannel` path only.

### 6. Rename `LinkDirection` references

**File:** `src/lib/PokerRtcSession.js`

- Replace `LinkDirection.INBOUND` / `LinkDirection.OUTBOUND` with the
  `TableP2PSession` equivalents: `inboundLabel` (`'inbound'`) and
  `outboundLabel` (`'outbound'`).

### 7. Update the `routeOracle` removal

**File:** `src/lib/PokerRtcSession.js`

- Delete the `routeOracle` callback and the `routeStore.hasLivePeerRoute(...)`
  check entirely. The `TableP2PSession` asks the Lobby over `BroadcastChannel`;
  there is no local route cache.

### 8. `useNetwork.js` — accept `peerId`

**File:** `src/hooks/useNetwork.js`

- Add `peerId` to the `useNetwork({...})` parameter list.
- Thread it into `session.update({ peerId })`.

### 9. Verification

- `npm install` (updates the `privatepoker-p2p` symlink).
- Run the dev server.
- Manual test: open a Lobby, join a Table, confirm the Lobby establishes a
  background P2P edge and the Table connects through it.
- `grep -rn 'localStorage\|sessionStorage\|indexedDB\|RouteBus\|RouteStore\|LobbyRouteKeeper\|LinkDirection' src/`
  returns zero hits.
