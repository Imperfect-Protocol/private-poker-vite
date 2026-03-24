// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import AboutPage from './pages/AboutPage';
import CreateTablePage from './pages/CreateTablePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LobbyPage from './pages/LobbyPage';
import MainLobbyPage from './pages/MainLobbyPage';
import SplashPage from './pages/SplashPage';
import TablePage from './pages/TablePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route element={<SiteLayout />}>
          <Route path="/main-lobby" element={<MainLobbyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/lobby/:id" element={<LobbyPage />} />
          <Route path="/tables/:id" element={<TablePage />} />
          <Route path="/tables/create" element={<CreateTablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}