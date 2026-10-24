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
        <img src="/splash.jpg" alt="Splash Background" className="w-full h-full object-cover opacity-55 filter-[grayscale(0.35)_sepia(0.4)_hue-rotate(300deg)_saturate(1.4)_brightness(0.64)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,5,6,0.28),#090506_95%),radial-gradient(circle,rgba(225,29,72,0.2),transparent_34rem)]" />
      </div>
      <div className={`relative z-10 text-center flex flex-col items-center transition-all duration-700 ease-in-out ${fadeLogo ? '-translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <h1 className="text-5xl md:text-7xl font-black text-slate-50 tracking-tighter uppercase mb-4 drop-shadow-[0_0_34px_rgba(225,29,72,0.55)]">
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
