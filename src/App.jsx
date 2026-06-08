import { BrowserRouter, Navigate, Routes, Route, Outlet, useParams, useSearchParams } from 'react-router-dom';
import AccountSignin from '@/components/account_signin/Component';
import SiteLayout from '@/components/layout/SiteLayout';
import AboutPage from '@/app/(site)/about/AboutPage';
import CreateTablePage from '@/app/tables/create/CreateTablePage';
import LeaderboardPage from '@/app/(site)/leaderboard/LeaderboardPage';
import LobbyClient from '@/components/lobby/LobbyClient';
import MainLobbyPage from '@/app/(site)/main-lobby/MainLobbyPage';
import MembersOnlyGate from '@/components/members_only/MembersOnlyGate';
import SplashPage from '@/app/SplashPage';
import TableClient from '@/components/table/TableClient';

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
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route element={<SiteRouteLayout />}>
          <Route path="/signin" element={<AccountSignin />} />
          <Route path="/main-lobby" element={<MembersOnlyRoute><MainLobbyPage /></MembersOnlyRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/lobby/:id" element={<MembersOnlyRoute><LobbyRoute /></MembersOnlyRoute>} />
        </Route>
        <Route path="/tables/:id" element={<MembersOnlyRoute><TableRoute /></MembersOnlyRoute>} />
        <Route path="/tables/create" element={<MembersOnlyRoute><CreateTablePage /></MembersOnlyRoute>} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
