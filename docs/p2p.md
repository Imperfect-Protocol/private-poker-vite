The Vite P2P connection flow is mostly here:

1. Table decides who to connect to:
[useTable.js](../src/hooks/useTable.js#L110)

It selects the previous occupied seat in the ring, then calls `subscribeToPreviousSeat()`:
[useTable.js](../src/hooks/useTable.js#L131)

2. Network hook owns the `PokerRtcSession`:
[useNetwork.js](../src/hooks/useNetwork.js#L100)

It wires callbacks into the session:
[useNetwork.js](../src/hooks/useNetwork.js#L184)

It listens for incoming mesh signals:
[useNetwork.js](../src/hooks/useNetwork.js#L226)

And exposes `subscribeTo()` which starts the RTC offer:
[useNetwork.js](../src/hooks/useNetwork.js#L255)

3. WebRTC offer creation:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1132)

Important lines:
- creates `RTCPeerConnection`: [PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1012)
- creates data channel: [PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1054)
- creates SDP offer: [PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1164)
- sends encrypted offer via local pool or Private Mesh fallback: [PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1173)

4. Signal encryption:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1069)

This wraps the SDP signal with sender address/pubkey, encrypts to peer announce public key, then sends opaque hex:
[crypto.js](../src/lib/crypto.js#L34)

Actual BLS-ish ephemeral encryption primitive:
[signal_crypto.js](../src/lib/crum_bls/signal_crypto.js#L23)

5. Private Mesh publishing/listening:
[usePrivatePokerSignal.js](../src/hooks/usePrivatePokerSignal.js#L27)

Incoming mesh subscription:
[usePrivatePokerSignal.js](../src/hooks/usePrivatePokerSignal.js#L78)

Long-poll implementation:
[privateMesh.js](../src/lib/privateMesh.js#L182)

Sending bootstrap messages:
[privateMesh.js](../src/lib/privateMesh.js#L219)

Receiving messages and emitting them to listeners:
[privateMesh.js](../src/lib/privateMesh.js#L188)

6. Incoming offer/answer handling:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1351)

It decrypts the mesh payload:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1370)

Then dispatches to:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1309)

Offer path creates answer:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1263)

Answer path applies remote description:
[PokerRtcSession.js](../src/lib/PokerRtcSession.js#L1340)

7. Mesh endpoint config:
[index.js](../src/lib/mesh/index.js#L9)

Main:
[main.js](../src/lib/mesh/main.js#L1)

Dev localhost:
[dev.js](../src/lib/mesh/dev.js#L1)

So the short protocol is:

`useTable` picks previous ring peer -> `useNetwork.subscribeTo()` -> `PokerRtcSession.sendOffer()` -> encrypt SDP offer to peer announce pubkey -> try local `RtcSessionPool` route -> fallback to Private Mesh long-poll `/mesh` -> peer receives encrypted payload -> decrypts -> creates SDP answer -> sends encrypted accept back -> original peer applies remote answer -> data channel opens.