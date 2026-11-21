"use client";

import { useEffect, useRef, useState } from 'react';
import { MousePointerClick, Spade } from 'lucide-react';
import FlowStepDialog from '@/components/table_screen/dialogs/FlowStepDialog';

const StepTone = Object.freeze({
  WAITING: 'waiting',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
});

const securityTone = (status) => {
  if (status === 'active') return StepTone.SUCCESS;
  if (status === 'error') return StepTone.FAILED;
  if (status === 'verifying') return StepTone.PENDING;
  return StepTone.WAITING;
};

const lobbyTone = (state) => {
  if (state === 'Connected') return StepTone.SUCCESS;
  if (state === 'Failed') return StepTone.FAILED;
  if (state === 'Searching') return StepTone.PENDING;
  return StepTone.WAITING;
};

const isConnectionFailure = (state) => (
  state === 'PeerRejected'
  || state === 'OfferTimeout'
  || state === 'ConnectionTimeout'
  || state === 'Disconnected'
  || state === 'Failed'
);

const connectionTone = (state) => {
  if (state === 'Connected') return StepTone.SUCCESS;
  if (isConnectionFailure(state)) return StepTone.FAILED;
  if (
    state === 'PeerWaiting'
    || state === 'Created'
    || state === 'OfferSent'
    || state === 'AcceptSent'
    || state === 'AcceptReceived'
  ) return StepTone.PENDING;
  return StepTone.WAITING;
};

const lobbyStatusText = (state) => {
  if (state === 'Connected') return 'connected';
  if (state === 'Failed') return 'failed';
  if (state === 'Searching') return 'searching';
  return '';
};

const inboundStatusText = (state) => {
  if (state === 'Connected') return 'connected';
  if (state === 'PeerWaiting') return 'peer found, waiting';
  if (state === 'PeerRejected') return 'rejected';
  if (state === 'Disconnected' || state === 'OfferTimeout' || state === 'ConnectionTimeout') return 'not connected';
  if (state === 'AcceptSent' || state === 'AcceptReceived') return 'connecting';
  if (state === 'OfferSent' || state === 'Created') return 'searching';
  return '';
};

const outboundStatusText = (state) => {
  if (state === 'Connected') return 'connected';
  if (state === 'PeerWaiting') return 'peer waiting';
  if (state === 'PeerRejected' || state === 'Disconnected' || state === 'OfferTimeout' || state === 'ConnectionTimeout') return 'not connected';
  if (state === 'OfferSent' || state === 'AcceptSent' || state === 'AcceptReceived' || state === 'Created') return 'pending';
  return '';
};

function RetryAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-yellow-300/70 bg-yellow-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-100 shadow-[0_0_16px_rgba(250,204,21,0.22)] transition-colors hover:border-yellow-200 hover:bg-yellow-300/25 hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

export default function ReJoinTableFlowDialog({
  table,
  networkSnapshot,
  onEnableNetwork,
  onReady,
}) {
  const startedRef = useRef(false);
  const readyRef = useRef(false);
  const [signatureStatus, setSignatureStatus] = useState('unverified');
  const [error, setError] = useState('');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        setSignatureStatus('verifying');
        await table.prepareNetworkSession();
        setSignatureStatus('active');
        onEnableNetwork?.();
      } catch (err) {
        console.error(err);
        setSignatureStatus('error');
        setError(err.shortMessage || err.details || err.message || 'Table session authorization failed.');
      }
    };

    run();
  }, [onEnableNetwork, table]);

  const lobbyState = networkSnapshot?.lobbyState ?? 'Waiting';
  const inboundState = networkSnapshot?.inboundState ?? 'None';
  const outboundState = networkSnapshot?.outboundState ?? 'None';
  const isLobbyConnected = lobbyState === 'Connected';
  const isLobbyFailed = lobbyState === 'Failed';
  const isInboundConnected = inboundState === 'Connected';
  const isOutboundConnected = outboundState === 'Connected';
  const isPeerWaiting = inboundState === 'PeerWaiting';
  const isPeerRejected = inboundState === 'PeerRejected';
  const canPokeNetwork = signatureStatus === 'active' && isLobbyFailed && !isInboundConnected;
  // Poke is a retry, not a head start: only offer it once the attempt has
  // actually failed or timed out.
  const canPokeEvents = signatureStatus === 'active'
    && isLobbyConnected
    && !isInboundConnected
    && !isPeerWaiting
    && !isPeerRejected
    && isConnectionFailure(inboundState);
  const eventsTone = isLobbyConnected ? connectionTone(inboundState) : StepTone.WAITING;
  const eventsStatus = isLobbyConnected ? inboundStatusText(inboundState) : '';
  const actionsTone = isLobbyConnected ? connectionTone(outboundState) : StepTone.WAITING;
  const actionsStatus = isLobbyConnected ? outboundStatusText(outboundState) : '';
  const isComplete = signatureStatus === 'active'
    && isLobbyConnected
    && isInboundConnected
    && isOutboundConnected;
  const title = isLobbyFailed ? 'Lobby Offline' : 'Joining P2P Network';
  const description = isLobbyFailed
    ? 'The Lobby tab did not answer. Keep the Lobby tab open and Poke to retry the background connection.'
    : 'We will restore your table session, connect through the Lobby, and open the inbound and outbound poker channels. The table stays locked until every channel is ready.';

  useEffect(() => {
    if (!isComplete || readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  }, [isComplete, onReady]);

  const retryConnection = async () => {
    setError('');
    try {
      await table.retryInboundConnection?.();
    } catch (err) {
      console.error(err);
      setError(err.shortMessage || err.details || err.message || 'Connection retry failed.');
    }
  };

  return (
    <FlowStepDialog
      title={title}
      description={description}
      error={error}
      isComplete={isComplete}
      showOk={false}
      steps={[
        {
          id: 'security',
          label: 'Security',
          status: signatureStatus,
          tone: securityTone(signatureStatus),
        },
        {
          id: 'network',
          label: 'Network',
          status: lobbyStatusText(lobbyState),
          tone: lobbyTone(lobbyState),
          action: canPokeNetwork ? (
            <RetryAction
              icon={<MousePointerClick size={12} strokeWidth={3} />}
              label="Poke"
              onClick={retryConnection}
            />
          ) : null,
        },
        {
          id: 'events',
          label: 'Events',
          status: eventsStatus,
          tone: eventsTone,
          action: canPokeEvents ? (
            <RetryAction
              icon={<Spade size={12} strokeWidth={3} />}
              label="Poke"
              onClick={retryConnection}
            />
          ) : null,
        },
        {
          id: 'actions',
          label: 'Actions',
          status: actionsStatus,
          tone: actionsTone,
        },
      ]}
    />
  );
}
