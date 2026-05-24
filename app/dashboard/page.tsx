import { Suspense } from 'react';
import { fetchAccountData, fetchPositions } from '@/app/actions/account';
import { money, signedMoney, percent, changeColor } from '@/lib/format';
import { RefreshButton } from './refresh-button';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-white">Account</h2>
          <p className="text-slate-400 text-sm mt-1">
            Overview of your balances and positions
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<AccountSkeleton />}>
        <AccountSummary />
      </Suspense>

      <Suspense fallback={<PositionsSummarySkeleton />}>
        <PositionsSummary />
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
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

async function PositionsSummary() {
  const { positions, error } = await fetchPositions();
  if (error || positions.length === 0) return null;

  const totalMarketValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalDayChange = positions.reduce((s, p) => s + p.dayChange, 0);
  const totalDayChangeBasis = totalMarketValue - totalDayChange;
  const dayChangePercent =
    totalDayChangeBasis > 0 ? (totalDayChange / totalDayChangeBasis) * 100 : 0;

  const topMover = [...positions].sort(
    (a, b) => Math.abs(b.dayChange) - Math.abs(a.dayChange)
  )[0];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-1">
            Positions Summary
          </h3>
          <p className="text-slate-400 text-sm">
            {positions.length} {positions.length === 1 ? 'position' : 'positions'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Market Value"
            value={money(totalMarketValue)}
            tone="white"
          />
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
            <p className="text-slate-400 text-sm mb-2">Day Change</p>
            <p className={`text-2xl font-bold ${changeColor(totalDayChange)}`}>
              {signedMoney(totalDayChange)}
            </p>
            <p className={`text-xs mt-1 ${changeColor(totalDayChange)}`}>
              {percent(dayChangePercent)}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
            <p className="text-slate-400 text-sm mb-2">Top Mover</p>
            <p className="text-2xl font-bold text-white">{topMover.symbol}</p>
            <p className={`text-xs mt-1 ${changeColor(topMover.dayChange)}`}>
              {signedMoney(topMover.dayChange)} ({percent(topMover.dayChangePercent)})
            </p>
          </div>
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

function PositionsSummarySkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
      <div className="h-5 w-44 bg-slate-700 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-700/60 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-20 bg-slate-700/50 rounded-lg" />
        <div className="h-20 bg-slate-700/50 rounded-lg" />
        <div className="h-20 bg-slate-700/50 rounded-lg" />
      </div>
    </div>
  );
}
