import { Suspense } from 'react';
import { fetchQuotes } from '@/app/actions/quotes';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '@/app/actions/watchlist';
import {
  money,
  signedMoney,
  percent,
  compactNumber,
  changeColor,
} from '@/lib/format';
import { RefreshButton } from '../refresh-button';

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-white">Watchlist</h2>
          <p className="text-slate-400 text-sm mt-1">
            Live quotes for tracked symbols
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <RefreshButton />
          <form action={addToWatchlist} className="flex gap-2">
            <input
              name="symbol"
              type="text"
              placeholder="Add symbol (e.g. TSLA)"
              autoComplete="off"
              maxLength={10}
              className="bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-md focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      <Suspense fallback={<QuotesSkeleton />}>
        <QuotesGrid />
      </Suspense>
    </div>
  );
}

async function QuotesGrid() {
  const symbols = await getWatchlist();
  const { quotes, error } = await fetchQuotes(symbols);
  const quotesBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
        <p className="font-semibold">Error loading quotes</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (symbols.length === 0) {
    return (
      <div className="p-12 bg-slate-800 border border-slate-700 rounded-lg text-center">
        <p className="text-slate-400">
          Your watchlist is empty. Add a symbol above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {symbols.map((sym) => (
        <QuoteCard key={sym} symbol={sym} quote={quotesBySymbol.get(sym)} />
      ))}
    </div>
  );
}

function QuoteCard({
  symbol,
  quote,
}: {
  symbol: string;
  quote: ReturnType<Map<string, import('@/lib/schwab-auth').SchwabQuote>['get']>;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-white font-bold text-lg">{symbol}</div>
          {quote?.description && (
            <div className="text-xs text-slate-400 truncate max-w-[180px]">
              {quote.description}
            </div>
          )}
        </div>
        <form action={removeFromWatchlist}>
          <input type="hidden" name="symbol" value={symbol} />
          <button
            type="submit"
            aria-label={`Remove ${symbol}`}
            className="text-slate-500 hover:text-red-400 transition-colors text-xs"
          >
            ✕
          </button>
        </form>
      </div>

      {quote ? (
        <>
          <div className="text-2xl font-bold text-white mb-1">
            {money(quote.lastPrice)}
          </div>
          <div className={`text-sm font-medium ${changeColor(quote.netChange)}`}>
            {signedMoney(quote.netChange)} ({percent(quote.netPercentChange)})
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Bid:</span>{' '}
              <span className="text-slate-200">{money(quote.bid)}</span>
            </div>
            <div>
              <span className="text-slate-500">Ask:</span>{' '}
              <span className="text-slate-200">{money(quote.ask)}</span>
            </div>
            <div>
              <span className="text-slate-500">High:</span>{' '}
              <span className="text-slate-200">{money(quote.high)}</span>
            </div>
            <div>
              <span className="text-slate-500">Low:</span>{' '}
              <span className="text-slate-200">{money(quote.low)}</span>
            </div>
            <div>
              <span className="text-slate-500">Open:</span>{' '}
              <span className="text-slate-200">{money(quote.open)}</span>
            </div>
            <div>
              <span className="text-slate-500">Vol:</span>{' '}
              <span className="text-slate-200">{compactNumber(quote.volume)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-slate-500 text-sm italic py-2">
          No quote data
        </div>
      )}
    </div>
  );
}

function QuotesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-44 bg-slate-800/70 border border-slate-700 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
