// src/components/SiteLayout.jsx
import Navbar from '@/components/Navbar';
import { Outlet } from 'react-router-dom';

export default function SiteLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}