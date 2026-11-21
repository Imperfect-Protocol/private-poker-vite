const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Tracks the table tabs this browser has announced on the P2P activity bus.
 * Table tabs publish their own lobby/table identity, so the lobby tab can show
 * which tables the player currently has open.
 */
export class TableTabDirectory {
  constructor({ maxAgeMs = DEFAULT_MAX_AGE_MS } = {}) {
    this.maxAgeMs = maxAgeMs;
    this.tabs = new Map();
  }

  observe(activity, now = Date.now()) {
    if (activity?.source !== 'table') return false;

    const tableId = activity.tableId == null ? null : String(activity.tableId);
    if (!tableId || tableId === '0') return false;

    const lobbyId = activity.lobbyId == null ? null : String(activity.lobbyId);
    const key = `${lobbyId ?? '?'}:${tableId}`;
    const tab = this.tabs.get(key) ?? { lobbyId, tableId, firstSeenAt: now };
    tab.lastSeenAt = now;
    tab.ownerAddress = activity.ownerAddress ?? tab.ownerAddress ?? null;
    this.tabs.set(key, tab);
    return true;
  }

  list(now = Date.now()) {
    return [...this.tabs.values()]
      .filter((tab) => now - tab.lastSeenAt <= this.maxAgeMs)
      .sort((left, right) => right.lastSeenAt - left.lastSeenAt);
  }

  clear() {
    this.tabs.clear();
  }
}
