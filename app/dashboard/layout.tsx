import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSchwabSession } from '@/lib/schwab-session';
import { isMockMode } from '@/lib/schwab-mock';
import { DashNavLink } from './nav-link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSchwabSession();
  if (!session) redirect('/login?error=session_expired');

  const mock = isMockMode();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {mock && (
        <div className="bg-amber-900/40 border-b border-amber-700/50 text-amber-200 text-xs text-center py-1.5 px-4">
          Mock mode — set <code className="font-mono bg-amber-950/40 px-1 rounded">SCHWAB_CLIENT_ID</code> in <code className="font-mono bg-amber-950/40 px-1 rounded">.env.local</code> to use the real Schwab API.
        </div>
      )}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/dashboard" className="flex-shrink-0">
            <h1 className="text-xl font-bold text-white">Nova Fox OS</h1>
            <p className="text-slate-400 text-xs">Live Trading Dashboard</p>
          </Link>

          <nav className="flex items-center gap-1 flex-1 justify-center">
            <DashNavLink href="/dashboard">Account</DashNavLink>
            <DashNavLink href="/dashboard/positions">Positions</DashNavLink>
            <DashNavLink href="/dashboard/quotes">Quotes</DashNavLink>
          </nav>

          <Link
            href="/logout"
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            Logout
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
