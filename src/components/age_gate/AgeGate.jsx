import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Splash from '@/components/splash/Component';

/**
 * Splash and age check for the landing page only. Table and lobby routes are
 * entered directly (including from their own tabs) without interrupting play.
 * Confirming once keeps the landing page open for the rest of the session.
 */
export default function AgeGate({ children }) {
  const location = useLocation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (location.pathname !== '/' || isConfirmed) return children;

  return <Splash onAdultConfirmed={() => setIsConfirmed(true)} />;
}
