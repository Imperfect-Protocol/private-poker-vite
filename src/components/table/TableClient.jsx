"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTable } from '@/hooks/useTable';
import { usePokerTable } from '@/hooks/usePokerTable';
import ActiveTableView from '@/components/table/ActiveTableView';
import BuyInDialog from '@/components/table_screen/dialogs/BuyInDialog';
import JoinTableFlowDialog from '@/components/table_screen/dialogs/JoinTableFlowDialog';
import ReJoinTableFlowDialog from '@/components/table_screen/dialogs/ReJoinTableFlowDialog';
import MediaDataChannelDialog from '@/components/table_screen/dialogs/MediaDataChannelDialog';
import TerminalResultDialog from '@/components/table_screen/dialogs/TerminalResultDialog';
import TopUpOperatorGasDialog from '@/components/table_screen/dialogs/TopUpOperatorGasDialog';
import { useAccounts } from '@/hooks/useAccounts';
import { useWebcam } from '@/hooks/useWebcam';
import { submitConsoleLine } from '@/lib/crum_pkr';
import { emitLobbyTablesChanged } from '@/lib/lobbyEvents';
import { VirtualNetworkActivityBus } from 'privatepoker-p2p';

const readCreatedTableSnapshot = (tableId) => {
  if (typeof window === 'undefined') return null;

  try {
    const key = `private-poker:new-table:${tableId}`;
    const rawSnapshot = window.sessionStorage.getItem(key);
    if (!rawSnapshot) return null;

    window.sessionStorage.removeItem(key);
    return JSON.parse(rawSnapshot);
  } catch {
    return null;
  }
};

const formatSeatAddress = (address) => (address ? address.slice(2, 4).toUpperCase() : 'Peer');
const ensureHexPrefix = (value) => {
  const normalized = String(value ?? '');
  return normalized.startsWith('0x') ? normalized : `0x${normalized}`;
};

const rtcMessageLabels = (message) => {
  if (!message?.type) return ['Unknown RTC Message'];
  if (message.type === 'ChatMessage') return [message.text ?? 'Chat Message'];
  if (message.type === 'History') {
    if (message.wire?.log_lines?.length > 0) {
      return message.wire.log_lines;
    }
    const lastHistoryEntry = Array.isArray(message.hand_history)
      ? message.hand_history.at(-1)
      : null;
    if (lastHistoryEntry?.wire?.log_lines?.length > 0) {
      return lastHistoryEntry.wire.log_lines;
    }
    return [submitConsoleLine(lastHistoryEntry?.wire?.submit ?? message.wire?.submit) ?? 'History'];
  }
  if (message.type === 'SettleHand') {
    return [`Final settlement signatures: ${message.signer_seats?.length ?? message.signature_shares?.length ?? 0}`];
  }
  if (message.type === 'TableComplete') {
    return ['Table ended'];
  }
  if (message.type === 'StartHand') {
    return [`Start hand on-chain confirmed by Player ${Number(message.seat_no ?? 0) + 1}`];
  }
  if (message.type === 'TableAggregatePublicKey') {
    return [`Table aggregate public key signatures: ${message.signer_seats?.length ?? message.signature_shares?.length ?? 0}`];
  }
  return [message.type];
};

const POKER_PROTOCOL_UI_STATES = new Set([
  'Shuffling',
  'UnmaskHoleCards',
  'UnmaskCommunityCards',
  'UnmaskFlop',
  'UnmaskTurn',
  'UnmaskRiver',
  'UnmaskShowdown',
  'SubmitPublicKey',
  'FinalSettlement',
  'Finished',
  'PreFlop',
  'Flop',
  'Turn',
  'River',
]);

class DebugMessageList {
  static key(message) {
    return [
      message.sender ?? '',
      message.text ?? '',
      message.level ?? '',
    ].join(':');
  }

  static append(messages, message) {
    const key = DebugMessageList.key(message);
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && DebugMessageList.key(lastMessage) === key) return messages;
    return [...messages, message].slice(-160);
  }

  static merge(leftMessages, rightMessages) {
    const seen = new Set();
    const merged = [];
    [...leftMessages, ...rightMessages].forEach((message) => {
      const key = DebugMessageList.key(message);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(message);
    });
    return merged.slice(-160);
  }
}

class DebugConsoleLogger {
  static log(message) {
    console.debug('[PrivatePoker debug]', {
      sender: message.sender,
      text: message.text,
      level: message.level ?? 'info',
    });
  }
}

class DebugActivityScope {
  constructor(fields) {
    this.lobbyId = String(fields.lobbyId ?? '');
    this.tableId = String(fields.tableId ?? '');
  }

  accepts(activity) {
    if (!activity?.text) return false;
    if (activity.source === 'table') return false;
    if (activity.lobbyId !== undefined && String(activity.lobbyId) !== this.lobbyId) return false;
    if (activity.tableId === undefined) return true;
    return String(activity.tableId) === this.tableId || String(activity.tableId) === '0';
  }
}

class DebugActivitySubscriber {
  constructor(fields) {
    this.scope = new DebugActivityScope(fields);
    this.onMessage = fields.onMessage;
    this.bus = new VirtualNetworkActivityBus({ channelName: 'private-poker:debug' });
  }

  start() {
    this.bus.listen((activity) => this.accept(activity));
  }

  stop() {
    this.bus.close();
  }

  accept(activity) {
    if (!this.scope.accepts(activity)) return;
    this.onMessage?.({
      text: activity.text,
      sender: activity.sender ?? 'RTC',
      level: activity.level ?? 'info',
    });
  }
}

export default function TableClient({ tableId, lobbyId, initialTableData = null, initialIsSeated = null }) {
  const [initialSnapshot] = useState(() => readCreatedTableSnapshot(tableId));

  const bootTableData = initialTableData ?? initialSnapshot?.tableData ?? null;
  const bootIsSeated = initialIsSeated ?? initialSnapshot?.isSeated ?? null;

  const tableRef = useRef(null);
  const pokerTableRef = useRef(null);
  const lastProtocolActionKeyRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showBuyInDialog, setShowBuyInDialog] = useState(true);
  const [buyInDialogReady, setBuyInDialogReady] = useState(false);
  const [joinRequest, setJoinRequest] = useState(null);
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [showReJoinDialog, setShowReJoinDialog] = useState(false);
  const [forceHideReJoinDialog, setForceHideReJoinDialog] = useState(false);
  const [reJoinDismissed, setReJoinDismissed] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [topUpRequest, setTopUpRequest] = useState(null);
  const [showMediaDataChannelDialog, setShowMediaDataChannelDialog] = useState(false);
  const webcam = useWebcam();

  const addDebugMessage = useCallback((message) => {
    DebugConsoleLogger.log(message);
    setMessages((prev) => DebugMessageList.append(prev, message));
  }, []);

  useEffect(() => {
    const subscriber = new DebugActivitySubscriber({
      lobbyId,
      tableId,
      onMessage: addDebugMessage,
    });
    subscriber.start();
    return () => subscriber.stop();
  }, [addDebugMessage, lobbyId, tableId]);

  const handleRtcActivity = useCallback((activity) => {
    if (activity.details?.kind === 'media-data-channel-required') {
      setShowMediaDataChannelDialog(true);
    }

    if (!activity.display) return;

    addDebugMessage({
      text: activity.text,
      sender: 'RTC',
      level: /failed|error|invalid signature/i.test(activity.text ?? '') ? 'error' : 'info',
    });
  }, [addDebugMessage]);

  const handleRtcMessage = useCallback((incoming, playerAddress) => {
    const sender = formatSeatAddress(playerAddress);
    const messageLabels = rtcMessageLabels(incoming);

    const isPokerProtocolMessage = (
      incoming?.type === 'History'
      || incoming?.type === 'ChatMessage'
      || incoming?.type === 'StartHand'
      || incoming?.type === 'TableAggregatePublicKey'
      || incoming?.type === 'TableComplete'
      || incoming?.type === 'SettleHand'
    );

    messageLabels.forEach((text) => addDebugMessage({ text, sender }));

    if (isPokerProtocolMessage) {
      pokerTableRef.current?.handleNetworkMessage(incoming, playerAddress);
      return;
    }
  }, [addDebugMessage]);

  const handleSeatEvent = useCallback((seatNo, seatEvent) => {
    if (seatEvent.kind !== 'network') return;
    const networkEvent = seatEvent.event;
    if (networkEvent?.kind === 'message') {
      handleRtcMessage(networkEvent.message, networkEvent.playerAddress);
      return;
    }
  }, [handleRtcMessage]);

  const handleOperatorTopUp = useCallback(({ operator, requiredAmount }) => {
    return new Promise((resolve) => {
      setTopUpRequest({
        operator,
        requiredAmount,
        resolve: (amount) => {
          setTopUpRequest(null);
          resolve(amount);
        },
      });
    });
  }, []);

  const table = useTable({
    tableId,
    lobbyId,
    initialTableData: bootTableData,
    initialIsSeated: bootIsSeated,
    onActivity: handleRtcActivity,
    onSeat: handleSeatEvent,
    networkEnabled,
    onOperatorTopUp: handleOperatorTopUp,
    localMediaStream: webcam.stream,
  });

  const [pokerTableState, pokerTableActions] = usePokerTable({
    table,
    onOperatorTopUp: handleOperatorTopUp,
  });
  const playerAddresses = useMemo(() => (
    table.tableData?.players?.map((player) => player.playerAddress).filter(Boolean) ?? []
  ), [table.tableData?.players]);
  const { getPlayerDisplayname } = useAccounts({ playerAddresses });

  const displayTable = useMemo(() => ({
    ...table,
    tableData: table.tableData
      ? {
        ...table.tableData,
        current_hand: {
          ...table.tableData.current_hand,
          ...pokerTableState.viewPatch,
          current_pot: pokerTableState.currentGameState?.pot?.toString?.()
            ?? pokerTableState.viewPatch?.current_pot
            ?? table.tableData.current_hand?.current_pot,
        },
      }
      : table.tableData,
  }), [pokerTableState.currentGameState, pokerTableState.viewPatch, table]);

  const currentGameState = pokerTableState.currentGameState;
  const protocolActionState = pokerTableState.protocolActionState;
  const submitProtocolAction = pokerTableActions.submitProtocolAction;
  const debugMessages = useMemo(() => (
    DebugMessageList.merge(messages, pokerTableState.gameMessages)
  ), [messages, pokerTableState.gameMessages]);
  const p2pEstablished = table.networkSnapshot?.status === 'connected';
  const consoleIdentity = useMemo(() => {
    const playerAddress = table.currentSeat?.playerAddress;
    const displayName = getPlayerDisplayname(playerAddress) || 'Console';
    const currentSeat = table.seats?.find((seat) => (
      seat.seatNo === table.currentSeat?.seatNo
      || seat.playerAddress?.toLowerCase() === playerAddress?.toLowerCase()
    ));
    const announceKey = currentSeat?.announcePublicKey;
    return {
      label: displayName,
      detail: playerAddress && announceKey
        ? `${ensureHexPrefix(playerAddress)}:${ensureHexPrefix(announceKey)}`
        : '',
    };
  }, [getPlayerDisplayname, table.currentSeat?.playerAddress, table.currentSeat?.seatNo, table.seats]);
  const terminalResult = useMemo(() => {
    const result = pokerTableState.terminalResult;
    if (result?.type !== 'cheated') return result;

    const cheaterAddress = table.tableData?.players?.[result.cheat?.player]?.playerAddress;
    const cheaterName = getPlayerDisplayname(cheaterAddress)
      || (cheaterAddress ? cheaterAddress.slice(2, 4).toUpperCase() : 'Player');
    const kind = result.cheat?.kind ?? 'CHEATING';
    return {
      ...result,
      title: result.cheat?.isViewerCheater ? 'CHEATER' : 'GAME CHEATED',
      subtitle: result.cheat?.isViewerCheater
        ? `CHEATED ${kind}`
        : `${cheaterName.toUpperCase()} CHEATED ${kind}`,
    };
  }, [getPlayerDisplayname, pokerTableState.terminalResult, table.tableData?.players]);
  const webcamView = useMemo(() => ({
    ...webcam,
    remoteStreams: table.networkSnapshot?.remoteMediaStreams ?? {},
  }), [table.networkSnapshot?.remoteMediaStreams, webcam]);

  useEffect(() => {
    if (!protocolActionState) return;
    if (protocolActionState.seat !== table.currentSeat?.seatNo) return;
    if (!POKER_PROTOCOL_UI_STATES.has(protocolActionState.state)) return;

    const actionKey = [
      protocolActionState.state,
      protocolActionState.seat,
      currentGameState?.pot,
      currentGameState?.minBet,
      currentGameState?.maxBet,
      currentGameState?.step,
    ].join(':');
    if (lastProtocolActionKeyRef.current === actionKey) return;
    lastProtocolActionKeyRef.current = actionKey;

    submitProtocolAction();
  }, [
    currentGameState?.state,
    currentGameState?.pot,
    currentGameState?.minBet,
    currentGameState?.maxBet,
    currentGameState?.step,
    protocolActionState?.state,
    protocolActionState?.seat,
    submitProtocolAction,
    table.currentSeat?.seatNo,
  ]);

  useEffect(() => {
    tableRef.current = table;
    pokerTableRef.current = pokerTableActions;
  }, [pokerTableActions, table]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!event.ctrlKey || event.repeat) return;
      if (event.key !== '`' && event.key !== '~' && event.code !== 'Backquote') return;

      event.preventDefault();
      setShowDebugConsole((current) => !current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentPlayerAddress = table.currentSeat?.playerAddress ?? null;

  useEffect(() => {
    setShowBuyInDialog(true);
    setBuyInDialogReady(false);
    setJoinRequest(null);
    setNetworkEnabled(false);
    setShowReJoinDialog(false);
    setForceHideReJoinDialog(false);
    setReJoinDismissed(false);
  }, [lobbyId, tableId, currentPlayerAddress]);

  useEffect(() => {
    setBuyInDialogReady(false);
    if (!table.tableData || table.isSeated !== false || !showBuyInDialog) return;

    const timer = setTimeout(() => {
      setBuyInDialogReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [showBuyInDialog, table.isSeated, table.tableData]);

  useEffect(() => {
    if (!table.hasJoinedTable || joinRequest || reJoinDismissed || forceHideReJoinDialog) return;
    setShowReJoinDialog(true);
  }, [forceHideReJoinDialog, joinRequest, reJoinDismissed, table.hasJoinedTable]);

  useEffect(() => {
    if (!table.hasJoinedTable || joinRequest || showReJoinDialog || forceHideReJoinDialog) return;
    if (p2pEstablished) return;

    setReJoinDismissed(false);
    setShowReJoinDialog(true);
  }, [forceHideReJoinDialog, joinRequest, p2pEstablished, showReJoinDialog, table.hasJoinedTable]);

  if (table.isLoading || !table.tableData) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div />
      </main>
    );
  }

  const handleSend = (e) => {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    switch (command.toLowerCase()) {
      case '/badsig':
        table.armBadSignatureOnce?.();
        setInput('');
        return;
      case '/dropnext':
        table.armDropNextMessage?.();
        setInput('');
        return;
      case '/dupenext':
        table.armDuplicateNextMessage?.();
        setInput('');
        return;
      case '/showtable':
        setForceHideReJoinDialog(true);
        setShowReJoinDialog(false);
        addDebugMessage({ sender: 'Game', text: 'P2P connection dialog hidden' });
        setInput('');
        return;
      case '/connect':
        setForceHideReJoinDialog(false);
        setReJoinDismissed(false);
        setShowReJoinDialog(true);
        addDebugMessage({ sender: 'Game', text: 'P2P connection dialog shown' });
        setInput('');
        return;
      case '/badshuffle':
        pokerTableActions.armPokerDebugCheat?.('badshuffle');
        setInput('');
        return;
      case '/badunmask':
        pokerTableActions.armPokerDebugCheat?.('badunmask');
        setInput('');
        return;
      case '/badpk':
        pokerTableActions.armPokerDebugCheat?.('badpk');
        setInput('');
        return;
      default:
        break;
    }

    if (pokerTableActions.submitChat(input)) {
      setInput('');
    }
  };

  const handleCloseTab = () => {
    if (terminalResult?.tableComplete === true) {
      emitLobbyTablesChanged({ lobbyId, tableId, reason: 'table-completed' });
    }
    window.close();
  };

  return (
    <ActiveTableView
      table={displayTable}
      debugConsole={showDebugConsole
        ? {
          consoleIdentity,
          messages: debugMessages,
          input,
          onInputChange: setInput,
          onSubmit: handleSend,
        }
        : null}
      actionBarProps={pokerTableState.actionBarProps}
      gameState={currentGameState}
      webcam={webcamView}
      onNextHandCountdownComplete={
        currentGameState?.cheat
          ? pokerTableActions.completeCheatCountdown
          : pokerTableActions.startNextHand
      }
    >
      {!table.hasJoinedTable && buyInDialogReady && (
        <BuyInDialog
          tableData={table.tableData}
          lobbyId={lobbyId}
          onClose={() => setShowBuyInDialog(false)}
          onJoinRequest={(request) => {
            setShowBuyInDialog(false);
            setJoinRequest(request);
          }}
        />
      )}

      {joinRequest && (
        <JoinTableFlowDialog
          request={joinRequest}
          onOperatorTopUp={handleOperatorTopUp}
          onComplete={() => {
            table.setIsSeated(true);
            setJoinRequest(null);
            setReJoinDismissed(false);
            setShowReJoinDialog(true);
            table.refresh();
          }}
        />
      )}

      {table.hasJoinedTable && showReJoinDialog && !forceHideReJoinDialog && !joinRequest && !p2pEstablished && (
        <ReJoinTableFlowDialog
          table={table}
          networkSnapshot={table.networkSnapshot}
          onEnableNetwork={() => setNetworkEnabled(true)}
          onReady={() => {
            setShowReJoinDialog(false);
            setReJoinDismissed(true);
          }}
        />
      )}

      {topUpRequest && (
        <TopUpOperatorGasDialog
          operator={topUpRequest.operator}
          requiredAmount={topUpRequest.requiredAmount}
          onConfirm={topUpRequest.resolve}
        />
      )}

      {showMediaDataChannelDialog && (
        <MediaDataChannelDialog
          onClose={() => setShowMediaDataChannelDialog(false)}
        />
      )}

      {terminalResult && (
        <TerminalResultDialog
          result={terminalResult}
          onCloseTab={handleCloseTab}
        />
      )}
    </ActiveTableView>
  );
}
