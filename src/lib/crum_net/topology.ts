import type { PlayerIndex, SeatedPeerShape, TopologyPolicyValue } from "../crum_pkr/types.ts";

export const TopologyPolicy = Object.freeze({
  Ring: "Ring",
  Mesh: "Mesh",
  RingOneBackup: "RingOneBackup",
  RingTwoBackups: "RingTwoBackups",
} satisfies Record<TopologyPolicyValue, TopologyPolicyValue>);

export class SeatedPeer implements SeatedPeerShape {
  player_index: PlayerIndex;
  peer_id: string;

  constructor({ player_index, peer_id }: SeatedPeerShape) {
    this.player_index = player_index;
    this.peer_id = peer_id;
  }

  clone(): SeatedPeer {
    return new SeatedPeer({
      player_index: this.player_index,
      peer_id: this.peer_id,
    });
  }
}

export function expected_peers(
  topology: TopologyPolicyValue,
  self_index: PlayerIndex,
  seated: SeatedPeerShape[],
): SeatedPeer[] {
  if (seated.length < 2 || self_index >= seated.length) {
    return [];
  }

  switch (topology) {
    case TopologyPolicy.Mesh:
      return seated
        .filter((peer) => peer.player_index !== self_index)
        .map(cloneSeatedPeer);
    case TopologyPolicy.Ring:
      return ring_neighbors(self_index, seated, 1);
    case TopologyPolicy.RingOneBackup:
      return ring_neighbors(self_index, seated, 2);
    case TopologyPolicy.RingTwoBackups:
      return ring_neighbors(self_index, seated, 3);
    default:
      return [];
  }
}

export function outbound_offer_targets(
  topology: TopologyPolicyValue,
  self_index: PlayerIndex,
  seated: SeatedPeerShape[],
): SeatedPeer[] {
  return expected_peers(topology, self_index, seated)
    .filter((peer) => self_index < peer.player_index);
}

function ring_neighbors(self_index: PlayerIndex, seated: SeatedPeerShape[], backup_depth: number): SeatedPeer[] {
  const count = seated.length;
  const peers: SeatedPeer[] = [];
  const maxDistance = Math.min(backup_depth, Math.max(count - 1, 0));

  for (let distance = 1; distance <= maxDistance; distance += 1) {
    const previous = (self_index + count - distance) % count;
    const next = (self_index + distance) % count;

    push_unique_peer(peers, cloneSeatedPeer(seated[previous]));
    push_unique_peer(peers, cloneSeatedPeer(seated[next]));
  }

  return peers;
}

function push_unique_peer(peers: SeatedPeer[], peer: SeatedPeer): void {
  if (peers.some((existing) => existing.player_index === peer.player_index)) {
    return;
  }
  peers.push(peer);
}

function cloneSeatedPeer(peer: SeatedPeerShape): SeatedPeer {
  return peer instanceof SeatedPeer ? peer.clone() : new SeatedPeer(peer);
}
