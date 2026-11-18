import { useState } from 'react';
import Splash from '@/components/splash/Component';

/**
 * Splash and age check that stand between the visitor and every route. Each
 * page load starts at the splash; confirming the age check reveals the app until
 * the next full reload.
 */
export default function AgeGate({ children }) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (isConfirmed) return children;

  return <Splash onAdultConfirmed={() => setIsConfirmed(true)} />;
}
