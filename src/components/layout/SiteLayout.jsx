import DemoDisclaimer from '@/components/demo_disclaimer/DemoDisclaimer';
import Navbar from '@/components/layout/Navbar';

export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-lobby [--navbar-height:4rem]">
      <Navbar />
      <main className="flex min-h-0 h-[calc(100vh-var(--navbar-height))] flex-col overflow-auto">
        <div className="flex-1">
          {children}
        </div>
        <DemoDisclaimer />
      </main>
    </div>
  );
}
