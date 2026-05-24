import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { fetchAccountData } from '@/app/actions/account';

export default async function DashboardPage() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('schwab_access_token')?.value;

  if (!accessToken) {
    redirect('/login');
  }

  // Fetch account data
  const { account, balance, error } = await fetchAccountData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Nova Fox OS</h1>
            <p className="text-slate-400 text-sm">Live Trading Dashboard</p>
          </div>
          <Link
            href="/logout"
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            Logout
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
            <p className="font-semibold">Error loading account data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Account Summary Card */}
          {account && balance && !error && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg hover:border-slate-600 transition-colors">
              <div className="p-6">
                {/* Card Header */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Account Summary
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Account {account.accountNumber}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Account Balance */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                    <p className="text-slate-400 text-sm mb-2">Account Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {typeof balance.accountBalance === 'number'
                        ? `$${balance.accountBalance.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : 'Loading...'}
                    </p>
                  </div>

                  {/* Buying Power */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                    <p className="text-slate-400 text-sm mb-2">Buying Power</p>
                    <p className="text-2xl font-bold text-green-400">
                      {typeof balance.buyingPower === 'number'
                        ? `$${balance.buyingPower.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : 'Loading...'}
                    </p>
                  </div>

                  {/* Cash Available */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                    <p className="text-slate-400 text-sm mb-2">Cash Available</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {typeof balance.cashAvailable === 'number'
                        ? `$${balance.cashAvailable.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : 'Loading...'}
                    </p>
                  </div>
                </div>

                {/* Account Type */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Account Type:</span>
                  <span className="inline-block bg-slate-700 text-slate-100 text-xs font-semibold px-3 py-1 rounded-full">
                    {account.accountType || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Coming Soon Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 opacity-50">
              <h3 className="text-white font-semibold mb-2">Positions</h3>
              <p className="text-slate-400 text-sm">Coming soon</p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 opacity-50">
              <h3 className="text-white font-semibold mb-2">Market Data</h3>
              <p className="text-slate-400 text-sm">Coming soon</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
