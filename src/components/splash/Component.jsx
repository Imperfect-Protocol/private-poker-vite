"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccessRestricted from '@/components/age_gate/AccessRestricted';
import AgeGateDialog from '@/components/age_gate/AgeGateDialog';
import DemoDisclaimer from '@/components/demo_disclaimer/DemoDisclaimer';

export default function Splash() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [fadeLogo, setFadeLogo] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [fadeAgeGate, setFadeAgeGate] = useState(false);
  const [fadeDisclaimer, setFadeDisclaimer] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const disclaimerTimer = setTimeout(() => setShowDisclaimer(true), 900);
    const logoTimer = setTimeout(() => setFadeLogo(true), 2200);
    const ageGateTimer = setTimeout(() => setShowAgeGate(true), 2800);

    return () => {
      clearTimeout(disclaimerTimer);
      clearTimeout(logoTimer);
      clearTimeout(ageGateTimer);
    };
  }, []);

  function handleAdultConfirmed() {
    setFadeAgeGate(true);
    setFadeDisclaimer(true);
    setTimeout(() => router.push('/signin'), 800);
  }

  function handleUnderage() {
    setIsRestricted(true);
  }

  if (isRestricted) {
    return <AccessRestricted />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950">
      <div className="absolute inset-0 z-0">
        <img src="/splash.jpg" alt="Splash Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30" />
      </div>
      <div className={`relative z-10 text-center flex flex-col items-center transition-all duration-700 ease-in-out ${fadeLogo ? '-translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 tracking-tighter uppercase mb-4 drop-shadow-[0_0_25px_rgba(20,184,166,0.6)]">
          Private Poker
        </h1>
        <div className="border-t border-teal-500/50 pt-3 px-8">
          <p className="text-teal-600 font-mono text-xs md:text-sm tracking-[0.5em] uppercase font-bold">Imperfect Protocol</p>
        </div>
      </div>
      {showAgeGate ? (
        <AgeGateDialog
          isFading={fadeAgeGate}
          onAdultConfirmed={handleAdultConfirmed}
          onUnderage={handleUnderage}
        />
      ) : null}
      <DemoDisclaimer
        variant="splash"
        isVisible={showDisclaimer}
        isFading={fadeDisclaimer}
      />
    </div>
  );
}
