# Nova Fox OS

A live financial trading dashboard / "operating system" for managing brokerage activity. Connect your Schwab account via OAuth2 to access real-time portfolio insights and market data in a sleek, cockpit-inspired interface.

## Features

- **Schwab OAuth2 authentication** with proactive token refresh
- **Account summary**: balance, buying power, cash available
- **Positions summary**: market value, day change, top mover at a glance
- **Positions table**: full holdings with day change and total P&L
- **Watchlist**: live quotes for tracked symbols with bid/ask/volume detail
- **Symbol detail page**: full quote + inline SVG price-history sparkline
- **Orders**: 30-day order history with status, side, and fill detail
- **Mock mode**: runs end-to-end without real Schwab credentials so the UI
  is immediately explorable in local development
- **Streaming UI**: each dashboard card renders its static shell instantly
  and streams data behind a Suspense fallback
- **Dark cockpit-inspired UI** with persistent navigation and per-page refresh
- **Secure session handling**: tokens stored in httpOnly cookies, never exposed to the client

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **TypeScript** with strict typing on the Schwab API surface
- **Tailwind CSS 4** for styling
- **Schwab Trader API + Market Data API** via OAuth2
- **Server Actions** for all data access (secrets stay server-side)
- **Vercel** deployment-ready

## Getting Started

### Prerequisites

1. **Schwab Developer Account**: register at <https://developer.schwab.com>
2. **OAuth2 Credentials**:
   - `SCHWAB_CLIENT_ID`
   - `SCHWAB_CLIENT_SECRET`
   - `NEXT_PUBLIC_SCHWAB_REDIRECT_URI`

### Local Setup

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click "Connect Schwab Account".

**No credentials? No problem.** With no `.env.local` (or with `SCHWAB_CLIENT_ID=mock`), the app boots in **mock mode**: the OAuth round-trip is skipped and the dashboard is populated with realistic fixtures so you can explore the UI immediately. An amber banner reminds you that you're in mock mode.

To switch to live Schwab data, copy `.env.example` to `.env.local` and fill in:

```bash
SCHWAB_CLIENT_ID=your_client_id
SCHWAB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_SCHWAB_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Deployment to Vercel

1. Push to GitHub
2. Connect the repository to Vercel
3. Add environment variables in Vercel settings:
   - `SCHWAB_CLIENT_ID`
   - `SCHWAB_CLIENT_SECRET`
   - `NEXT_PUBLIC_SCHWAB_REDIRECT_URI=https://your-domain.com/auth/callback`
4. Update your Schwab app's redirect URI to match the production URL
5. Deploy

## Project Structure

```
app/
├── page.tsx                            Root redirect (auth → dashboard or login)
├── layout.tsx                          Global layout / metadata
├── login/page.tsx                      Login page with Schwab connect button
├── auth/callback/route.ts              OAuth callback (code → tokens)
├── logout/route.ts                     Clears session cookies
├── dashboard/
│   ├── layout.tsx                      Shared chrome + auth gate + mock banner
│   ├── nav-link.tsx                    Client nav link with active state
│   ├── refresh-button.tsx              router.refresh() with spinner
│   ├── loading.tsx                     Per-route skeleton
│   ├── page.tsx                        Account + positions summary
│   ├── positions/page.tsx              Positions table with P&L
│   ├── orders/page.tsx                 30-day order history
│   └── quotes/
│       ├── page.tsx                    Watchlist grid + add/remove forms
│       └── [symbol]/
│           ├── page.tsx                Symbol detail (quote + sparkline)
│           └── sparkline.tsx           Inline SVG price-history chart
└── actions/
    ├── account.ts                      fetchAccountData, fetchPositions
    ├── orders.ts                       fetchOrders
    ├── quotes.ts                       fetchQuotes, fetchPriceHistory
    └── watchlist.ts                    getWatchlist, add/remove (cookie-backed)

lib/
├── schwab-auth.ts                      Schwab API client (OAuth, accounts, positions, quotes, history, orders)
├── schwab-session.ts                   Token cookie management + auto-refresh
├── schwab-mock.ts                      Fixtures for mock mode (no creds required)
└── format.ts                           Number / currency formatting helpers
```

## How It Works

1. **Connect**: user clicks "Connect Schwab Account" → server action redirects to Schwab OAuth
2. **Callback**: Schwab redirects to `/auth/callback?code=…`; the handler exchanges the code for tokens and stores them in httpOnly cookies (access, refresh, and an `expires_at` timestamp)
3. **Session**: every protected server action calls `getValidAccessToken()`, which proactively refreshes the access token (with a 60s buffer) using the refresh token if needed
4. **Data fetch**: dashboard pages call server actions that hit the Schwab Trader API (`/trader/v1/accounts`, `/trader/v1/accounts/{hash}?fields=positions`) and Market Data API (`/marketdata/v1/quotes`)
5. **Logout**: clears all three session cookies and redirects to login

## Roadmap

- [x] Account summary (Phase 1)
- [x] Token refresh (Phase 2)
- [x] Positions with P&L (Phase 2)
- [x] Watchlist + live quotes (Phase 2)
- [x] Mock mode (Phase 2.5)
- [x] Suspense streaming + per-page refresh (Phase 2.5)
- [x] Symbol detail with price-history sparkline (Phase 2.5)
- [x] Order history view (Phase 2.5)
- [ ] Live price streaming (WebSocket)
- [ ] Full candlestick charting
- [ ] Order placement UI
- [ ] Multi-account support
- [ ] Database-backed sessions (replace cookie-only storage)

## Diagnostics

Visit [`/dev/api-check`](http://localhost:3000/dev/api-check) after logging in to ping every Schwab endpoint in one place. Each row shows the HTTP status, response time, Schwab correlation ID, and full response body — perfect for confirming a live setup or debugging a 4xx without digging through server logs.

All API errors thrown by `lib/schwab-auth.ts` are `SchwabApiError` instances carrying `status`, `body`, `url`, and `correlId`. Every outbound request also sets a `Schwab-Client-CorrelId` header so failed calls can be traced through Schwab support.

## Notes

- **Secrets**: never commit `.env.local`. Use Vercel project secrets for production.
- **Token refresh**: handled transparently in `lib/schwab-session.ts`. Refresh tokens are valid for 7 days; users will need to re-authenticate after that.
- **Rate limits**: the Schwab API has rate limits. All API calls are `cache: 'no-store'` for freshness; add backoff if rate limits are hit.
- **Next.js version**: this project runs on Next.js 16. See `AGENTS.md` — agents should read `node_modules/next/dist/docs/` before writing code, since APIs differ from earlier major versions.

## License

MIT
