import { useEffect, useState } from 'react';
import { useMemberAccess } from '@/hooks/useMemberAccess';
import MembersOnlyArea from '@/components/members_only/MembersOnlyArea';

function MembershipPending() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 333);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-16 text-left font-mono text-3xl font-black tracking-[0.2em] text-teal-900/70">
        {'.'.repeat(dotCount)}
      </div>
    </div>
  );
}

export default function MembersOnlyGate({ children }) {
  const { accountStatus, isAccessPending, isMember } = useMemberAccess();

  if (isAccessPending) {
    return <MembershipPending />;
  }

  if (!isMember) {
    return (
      <div className="animate-[membership-fade-in_320ms_ease-out_both]">
        <MembersOnlyArea accountStatus={accountStatus} />
      </div>
    );
  }

  return (
    <div className="animate-[membership-fade-in_320ms_ease-out_both]">
      {children}
    </div>
  );
}
