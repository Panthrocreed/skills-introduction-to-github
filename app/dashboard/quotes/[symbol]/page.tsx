import Link from 'next/link';
import { Suspense } from 'react';
import { fetchQuotes, fetchPriceHistory } from '@/app/actions/quotes';
import {
  money,
  signedMoney,
  percent,
  compactNumber,
  changeColor,
} from '@/lib/format';
import { RefreshButton } from '../../refresh-button';
import { Sparkline } from './sparkline';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export default async function SymbolDetailPage({ params }: PageProps) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <Link
            href="/dashboard/quotes"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Watchlist
          </Link>
          <h2 className="text-3xl font-bold text-white mt-1">{symbol}</h2>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<DetailSkeleton />}>
        <SymbolDetail symbol={symbol} />
      </Suspense>
    </div>
  );
}

async function SymbolDetail({ symbol }: { symbol: string }) {
  const [quoteResult, historyResult] = await Promise.all([
    fetchQuotes([symbol]),
    fetchPriceHistory(symbol, {
      periodType: 'day',
      period: 10,
      frequencyType: 'minute',
      frequency: 30,
    }),
  ]);

  const quote = quoteResult.quotes[0];
  const error = quoteResult.error ?? historyResult.error;

  if (error && !quote) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
        <p className="font-semibold">Error loading {symbol}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-12 bg-slate-800 border border-slate-700 rounded-lg text-center">
        <p className="text-slate-400">No quote data for {symbol}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            {quote.description && (
              <p className="text-slate-400 text-sm">{quote.description}</p>
            )}
            <div className="text-4xl font-bold text-white mt-1">
              {money(quote.lastPrice)}
            </div>
            <div className={`text-base font-medium mt-1 ${changeColor(quote.netChange)}`}>
              {signedMoney(quote.netChange)} ({percent(quote.netPercentChange)})
            </div>
          </div>
        </div>

        <Sparkline candles={historyResult.candles} />

        {historyResult.error && (
          <p className="text-xs text-red-400 mt-2">
            Price history error: {historyResult.error}
          </p>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quote Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <DetailField label="Bid" value={money(quote.bid)} />
          <DetailField label="Ask" value={money(quote.ask)} />
          <DetailField label="Open" value={money(quote.open)} />
          <DetailField label="Prev Close" value={money(quote.previousClose)} />
          <DetailField label="Day High" value={money(quote.high)} />
          <DetailField label="Day Low" value={money(quote.low)} />
          <DetailField label="Volume" value={compactNumber(quote.volume)} />
          <DetailField label="Spread" value={money(quote.ask - quote.bid)} />
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-slate-100 text-base font-medium mt-0.5">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="h-3 w-32 bg-slate-700/60 rounded mb-2" />
        <div className="h-10 w-40 bg-slate-700 rounded mb-2" />
        <div className="h-4 w-24 bg-slate-700/60 rounded mb-4" />
        <div className="h-60 bg-slate-700/40 rounded" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="h-5 w-32 bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-12 bg-slate-700/60 rounded mb-1" />
              <div className="h-5 w-20 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
