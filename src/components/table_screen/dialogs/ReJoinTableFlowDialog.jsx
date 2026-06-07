"use client";

import { useEffect, useRef, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import FlowStepDialog from '@/components/table_screen/dialogs/FlowStepDialog';

const POKE_SEARCH_MS = 10000;

const peerConnectionStatus = (state) => {
  if (state === 'Connected') return 'connected';
  if (state === 'Disconnected' || state === 'OfferTimeout') return 'not connected';
  if (state === 'AcceptSent' || state === 'AcceptReceived') return 'Connecting';
  if (state === 'OfferSent' || state === 'Created') return 'Searching';
  return 'Searching';
};

const subscriptionStatus = (state) => {
  if (state === 'Connected') return 'peer subscribed';
  if (state === 'Disconnected' || state === 'OfferTimeout') return 'no subscribers';
  if (state === 'OfferSent' || state === 'AcceptSent' || state === 'AcceptReceived' || state === 'Created') return 'listening';
  return 'listening';
};

const isRtcConnectingState = (state) => (
  state === 'AcceptSent'
  || state === 'AcceptReceived'
);

export default function ReJoinTableFlowDialog({
  table,
  networkSnapshot,
  onEnableNetwork,
  onReady,
}) {
  const startedRef = useRef(false);
  const readyRef = useRef(false);
  const pokeSearchTimerRef = useRef(null);
  const [signatureStatus, setSignatureStatus] = useState('unverified');
  const [error, setError] = useState('');
  const [isSearchCycleActive, setIsSearchCycleActive] = useState(true);

  const startSearchCycle = () => {
    if (pokeSearchTimerRef.current) {
      clearTimeout(pokeSearchTimerRef.current);
    }
    setIsSearchCycleActive(true);
    pokeSearchTimerRef.current = setTimeout(() => {
      pokeSearchTimerRef.current = null;
      setIsSearchCycleActive(false);
    }, POKE_SEARCH_MS);
  };

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

  useEffect(() => {
    startSearchCycle();
    return () => {
      if (pokeSearchTimerRef.current) {
        clearTimeout(pokeSearchTimerRef.current);
      }
    };
  }, []);

  const inboundStatus = peerConnectionStatus(networkSnapshot?.inboundState);
  const outboundStatus = subscriptionStatus(networkSnapshot?.outboundState);
  const isInboundConnected = networkSnapshot?.inboundState === 'Connected';
  const isRtcConnecting = isRtcConnectingState(networkSnapshot?.inboundState);
  const canPokeInbound = signatureStatus === 'active'
    && !isInboundConnected
    && !isSearchCycleActive;
  const shownInboundStatus = isRtcConnecting
    ? 'Connecting'
    : isSearchCycleActive
      ? 'Searching'
      : inboundStatus;
  const isComplete = signatureStatus === 'active'
    && inboundStatus === 'connected'
    && outboundStatus === 'peer subscribed';

  useEffect(() => {
    if (!isInboundConnected) return;
    if (pokeSearchTimerRef.current) {
      clearTimeout(pokeSearchTimerRef.current);
      pokeSearchTimerRef.current = null;
    }
    setIsSearchCycleActive(false);
  }, [isInboundConnected]);

  useEffect(() => {
    if (!isComplete || readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  }, [isComplete, onReady]);

  return (
    <FlowStepDialog
      title="Joining P2P Network"
      description="We will restore your table session and connect the inbound and outbound poker channels. The table stays locked until peers are connected."
      error={error}
      isComplete={isComplete}
      showOk={false}
      steps={[
        {
          id: 'signature',
          label: 'Security',
          status: signatureStatus,
          statusTone: signatureStatus === 'active' ? 'complete' : undefined,
        },
        {
          id: 'inbound',
          label: 'Peer Connection',
          status: canPokeInbound ? '' : shownInboundStatus,
          statusTone: ['Searching', 'Connecting'].includes(shownInboundStatus) ? 'connecting' : undefined,
          action: canPokeInbound ? (
            <button
              type="button"
              onClick={async () => {
                setError('');
                startSearchCycle();
                try {
                  await table.retryInboundConnection?.();
                } catch (err) {
                  console.error(err);
                  if (pokeSearchTimerRef.current) {
                    clearTimeout(pokeSearchTimerRef.current);
                    pokeSearchTimerRef.current = null;
                  }
                  setIsSearchCycleActive(false);
                  setError(err.shortMessage || err.details || err.message || 'Poke failed.');
                }
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-yellow-300/70 bg-yellow-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-100 shadow-[0_0_16px_rgba(250,204,21,0.22)] transition-colors hover:border-yellow-200 hover:bg-yellow-300/25 hover:text-white"
            >
              <MousePointerClick size={12} strokeWidth={3} />
              Poke
            </button>
          ) : null,
        },
        { id: 'outbound', label: 'Subscriptions', status: outboundStatus },
      ]}
    />
  );
}
