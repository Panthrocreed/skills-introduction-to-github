# Nova Fox OS

A live financial trading dashboard / "operating system" for managing brokerage activity. Connect your Schwab account via OAuth2 to access real-time portfolio insights and market data in a sleek, cockpit-inspired interface.

## Features

- **Schwab OAuth2 authentication** with proactive token refresh
- **Account summary**: balance, buying power, cash available
- **Positions**: real-time holdings with day change and total P&L
- **Watchlist**: live quotes for tracked symbols with bid/ask/volume detail
- **Dark cockpit-inspired UI** with persistent navigation
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
cp .env.example .env.local
# add your Schwab credentials to .env.local:
#   SCHWAB_CLIENT_ID=your_client_id
#   SCHWAB_CLIENT_SECRET=your_client_secret
#   NEXT_PUBLIC_SCHWAB_REDIRECT_URI=http://localhost:3000/auth/callback
npm run dev
```

Open <http://localhost:3000> and click "Connect Schwab Account".

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
├── page.tsx                       Root redirect (auth → dashboard or login)
├── layout.tsx                     Global layout / metadata
├── login/page.tsx                 Login page with Schwab connect button
├── auth/callback/route.ts         OAuth callback (code → tokens)
├── logout/route.ts                Clears session cookies
├── dashboard/
│   ├── layout.tsx                 Shared dashboard chrome + auth gate
│   ├── nav-link.tsx               Client navigation link
│   ├── page.tsx                   Account summary
│   ├── positions/page.tsx         Positions table with P&L
│   └── quotes/page.tsx            Watchlist quotes
└── actions/
    ├── account.ts                 fetchAccountData, fetchPositions
    ├── quotes.ts                  fetchQuotes(symbols)
    └── watchlist.ts               getWatchlist, addToWatchlist, removeFromWatchlist

lib/
├── schwab-auth.ts                 Schwab API client (OAuth, accounts, positions, quotes)
├── schwab-session.ts              Token cookie management + auto-refresh
└── format.ts                      Number / currency formatting helpers
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
- [ ] Live price streaming (WebSocket)
- [ ] Charting / candlesticks
- [ ] Order placement UI
- [ ] Trade history / execution panel
- [ ] Multi-account support
- [ ] Database-backed sessions (replace cookie-only storage)

## Notes

- **Secrets**: never commit `.env.local`. Use Vercel project secrets for production.
- **Token refresh**: handled transparently in `lib/schwab-session.ts`. Refresh tokens are valid for 7 days; users will need to re-authenticate after that.
- **Rate limits**: the Schwab API has rate limits. All API calls are `cache: 'no-store'` for freshness; add backoff if rate limits are hit.
- **Next.js version**: this project runs on Next.js 16. See `AGENTS.md` — agents should read `node_modules/next/dist/docs/` before writing code, since APIs differ from earlier major versions.

## License

MIT
