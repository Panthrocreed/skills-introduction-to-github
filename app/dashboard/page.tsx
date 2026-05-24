import { Suspense } from 'react';
import { fetchAccountData } from '@/app/actions/account';
import { money } from '@/lib/format';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Account</h2>
        <p className="text-slate-400 text-sm mt-1">Overview of your balances</p>
      </div>

      <Suspense fallback={<AccountSkeleton />}>
        <AccountSummary />
      </Suspense>
    </div>
  );
}

async function AccountSummary() {
  const { account, balance, error } = await fetchAccountData();

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
        <p className="font-semibold">Error loading account data</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!account || !balance) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg hover:border-slate-600 transition-colors">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Account Summary
            </h3>
            <p className="text-slate-400 text-sm">
              Account {account.accountNumber}
            </p>
          </div>
          {account.accountType && (
            <span className="inline-block bg-slate-700 text-slate-100 text-xs font-semibold px-3 py-1 rounded-full">
              {account.accountType}
            </span>
          )}
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
      </div>
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

function AccountSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
      <div className="h-5 w-40 bg-slate-700 rounded mb-2" />
      <div className="h-3 w-28 bg-slate-700/60 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-20 bg-slate-700/50 rounded-lg" />
        <div className="h-20 bg-slate-700/50 rounded-lg" />
        <div className="h-20 bg-slate-700/50 rounded-lg" />
      </div>
    </div>
  );
}
