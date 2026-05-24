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

export default async function QuotesPage() {
  const symbols = await getWatchlist();
  const { quotes, error } = await fetchQuotes(symbols);

  const quotesBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-white">Watchlist</h2>
          <p className="text-slate-400 text-sm mt-1">
            Live quotes for tracked symbols
          </p>
        </div>

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

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
          <p className="font-semibold">Error loading quotes</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {symbols.length === 0 ? (
        <div className="p-12 bg-slate-800 border border-slate-700 rounded-lg text-center">
          <p className="text-slate-400">
            Your watchlist is empty. Add a symbol above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbols.map((sym) => {
            const q = quotesBySymbol.get(sym);
            return (
              <div
                key={sym}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-bold text-lg">{sym}</div>
                    {q?.description && (
                      <div className="text-xs text-slate-400 truncate max-w-[180px]">
                        {q.description}
                      </div>
                    )}
                  </div>
                  <form action={removeFromWatchlist}>
                    <input type="hidden" name="symbol" value={sym} />
                    <button
                      type="submit"
                      aria-label={`Remove ${sym}`}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </form>
                </div>

                {q ? (
                  <>
                    <div className="text-2xl font-bold text-white mb-1">
                      {money(q.lastPrice)}
                    </div>
                    <div className={`text-sm font-medium ${changeColor(q.netChange)}`}>
                      {signedMoney(q.netChange)} ({percent(q.netPercentChange)})
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500">Bid:</span>{' '}
                        <span className="text-slate-200">{money(q.bid)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ask:</span>{' '}
                        <span className="text-slate-200">{money(q.ask)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">High:</span>{' '}
                        <span className="text-slate-200">{money(q.high)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Low:</span>{' '}
                        <span className="text-slate-200">{money(q.low)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Open:</span>{' '}
                        <span className="text-slate-200">{money(q.open)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Vol:</span>{' '}
                        <span className="text-slate-200">{compactNumber(q.volume)}</span>
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
          })}
        </div>
      )}
    </div>
  );
}
