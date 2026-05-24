import { Suspense } from 'react';
import { fetchPositions } from '@/app/actions/account';
import { money, signedMoney, percent, changeColor } from '@/lib/format';

export default function PositionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Positions</h2>
        <p className="text-slate-400 text-sm mt-1">
          Current holdings with day change and total P&amp;L
        </p>
      </div>

      <Suspense fallback={<PositionsSkeleton />}>
        <PositionsTable />
      </Suspense>
    </div>
  );
}

async function PositionsTable() {
  const { account, positions, error } = await fetchPositions();

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
        <p className="font-semibold">Error loading positions</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="p-12 bg-slate-800 border border-slate-700 rounded-lg text-center">
        <p className="text-slate-400">No open positions.</p>
      </div>
    );
  }

  const totalMarketValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalDayChange = positions.reduce((s, p) => s + p.dayChange, 0);
  const totalGainLoss = positions.reduce((s, p) => s + p.totalGainLoss, 0);

  return (
    <div className="space-y-3">
      {account && (
        <p className="text-slate-400 text-sm">
          Account {account.accountNumber}
        </p>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium text-right">Avg Price</th>
              <th className="px-4 py-3 font-medium text-right">Market Value</th>
              <th className="px-4 py-3 font-medium text-right">Day Change</th>
              <th className="px-4 py-3 font-medium text-right">Day %</th>
              <th className="px-4 py-3 font-medium text-right">Total P&amp;L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {positions.map((p) => (
              <tr key={p.symbol} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{p.symbol}</div>
                  {p.description && (
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">
                      {p.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-200">{p.quantity}</td>
                <td className="px-4 py-3 text-slate-200 text-right">
                  {money(p.averagePrice)}
                </td>
                <td className="px-4 py-3 text-white text-right font-medium">
                  {money(p.marketValue)}
                </td>
                <td className={`px-4 py-3 text-right ${changeColor(p.dayChange)}`}>
                  {signedMoney(p.dayChange)}
                </td>
                <td className={`px-4 py-3 text-right ${changeColor(p.dayChangePercent)}`}>
                  {percent(p.dayChangePercent)}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${changeColor(p.totalGainLoss)}`}>
                  {signedMoney(p.totalGainLoss)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900/50 border-t border-slate-700">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-slate-400 text-sm font-medium">
                Total ({positions.length} {positions.length === 1 ? 'position' : 'positions'})
              </td>
              <td className="px-4 py-3 text-white text-right font-semibold">
                {money(totalMarketValue)}
              </td>
              <td className={`px-4 py-3 text-right font-medium ${changeColor(totalDayChange)}`}>
                {signedMoney(totalDayChange)}
              </td>
              <td></td>
              <td className={`px-4 py-3 text-right font-semibold ${changeColor(totalGainLoss)}`}>
                {signedMoney(totalGainLoss)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function PositionsSkeleton() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-900/50 border-b border-slate-700" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 border-b border-slate-700/50 last:border-b-0" />
      ))}
    </div>
  );
}
