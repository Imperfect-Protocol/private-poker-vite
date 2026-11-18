import { useMemberAccess } from '@/hooks/useMemberAccess';
import MembersOnlyArea from '@/components/members_only/MembersOnlyArea';
import LoadingSplash from '@/components/splash/LoadingSplash';

export default function MembersOnlyGate({ children }) {
  const { accountStatus, hasCurrentWalletKeypair, isAccessPending, isMember } = useMemberAccess();

  // A restored session means the player is very likely a member, so start
  // loading the page underneath the splash while the chain checks finish.
  const shouldPreload = isAccessPending && hasCurrentWalletKeypair;

  return (
    <>
      {(isMember || shouldPreload) && (
        <div
          aria-hidden={shouldPreload || undefined}
          className={isMember
            ? 'animate-[membership-fade-in_320ms_ease-out_both]'
            : 'invisible'}
        >
          {children}
        </div>
      )}

      {!isAccessPending && !isMember && (
        <div className="animate-[membership-fade-in_320ms_ease-out_both]">
          <MembersOnlyArea accountStatus={accountStatus} />
        </div>
      )}

      {isAccessPending && <LoadingSplash />}
    </>
  );
}
