import { BrowserRouter, Navigate, Routes, Route, Outlet, useParams, useSearchParams } from 'react-router-dom';
import AccountSignin from '@/components/account_signin/Component';
import AgeGate from '@/components/age_gate/AgeGate';
import SiteLayout from '@/components/layout/SiteLayout';
import AboutPage from '@/app/(site)/about/AboutPage';
import FaucetPage from '@/app/(site)/faucet/FaucetPage';
import GetStartedPage from '@/app/(site)/get-started/GetStartedPage';
import CreateTablePage from '@/app/tables/create/CreateTablePage';
import LeaderboardPage from '@/app/(site)/leaderboard/LeaderboardPage';
import LobbyClient from '@/components/lobby/LobbyClient';
import MainLobbyPage from '@/app/(site)/main-lobby/MainLobbyPage';
import MembersOnlyGate from '@/components/members_only/MembersOnlyGate';
import OurVisionPage from '@/app/(site)/our-vision/OurVisionPage';
import TableClient from '@/components/table/TableClient';
import WhoAreWePage from '@/app/(site)/who-are-we/WhoAreWePage';

function LobbyRoute() {
  const { id } = useParams();
  return <LobbyClient id={id ?? '1'} />;
}

function TableRoute() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  return (
    <TableClient
      tableId={id ?? '1'}
      lobbyId={searchParams.get('lobbyId') ?? '1'}
      peerId={searchParams.get('peerId')}
      initialIsSeated={searchParams.get('seated') === '1' ? true : null}
    />
  );
}

function SiteRouteLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}

function MembersOnlyRoute({ children }) {
  return (
    <MembersOnlyGate>
      {children}
    </MembersOnlyGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AgeGate>
        <Routes>
          <Route element={<SiteRouteLayout />}>
            <Route index element={<AboutPage />} />
            <Route path="/signin" element={<AccountSignin />} />
            <Route path="/main-lobby" element={<MembersOnlyRoute><MainLobbyPage /></MembersOnlyRoute>} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/faucet" element={<FaucetPage />} />
            <Route path="/our-vision" element={<OurVisionPage />} />
            <Route path="/who-are-we" element={<WhoAreWePage />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/lobby/:id" element={<MembersOnlyRoute><LobbyRoute /></MembersOnlyRoute>} />
          </Route>
          <Route path="/tables/:id" element={<MembersOnlyRoute><TableRoute /></MembersOnlyRoute>} />
          <Route path="/tables/create" element={<MembersOnlyRoute><CreateTablePage /></MembersOnlyRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AgeGate>
    </BrowserRouter>
  );
}
