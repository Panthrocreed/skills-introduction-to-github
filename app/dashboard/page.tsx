import { fetchAccountData } from '@/app/actions/account';
import { money } from '@/lib/format';

export default async function DashboardPage() {
  const { account, balance, error } = await fetchAccountData();

  return (
    <div className="grid grid-cols-1 gap-6">
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
          <p className="font-semibold">Error loading account data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {account && balance && !error && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg hover:border-slate-600 transition-colors">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">
                Account Summary
              </h2>
              <p className="text-slate-400 text-sm">
                Account {account.accountNumber}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                label="Account Balance"
                value={money(balance.accountBalance)}
                tone="white"
              />
              <MetricCard
                label="Buying Power"
                value={money(balance.buyingPower)}
                tone="green"
              />
              <MetricCard
                label="Cash Available"
                value={money(balance.cashAvailable)}
                tone="blue"
              />
            </div>

            {account.accountType && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-slate-400 text-sm">Account Type:</span>
                <span className="inline-block bg-slate-700 text-slate-100 text-xs font-semibold px-3 py-1 rounded-full">
                  {account.accountType}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'white' | 'green' | 'blue';
}) {
  const toneClass = {
    white: 'text-white',
    green: 'text-green-400',
    blue: 'text-blue-400',
  }[tone];

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
      <p className="text-slate-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
