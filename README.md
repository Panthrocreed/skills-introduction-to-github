# Nova Fox OS

A live financial trading dashboard / "operating system" for managing brokerage activity. Connect your Schwab account via OAuth2 to access real-time portfolio insights and market data in a sleek, cockpit-inspired interface.

## Features (MVP)

- **Schwab OAuth2 Authentication**: Secure, token-based login via Schwab API
- **Account Summary**: Real-time balance, buying power, and cash available
- **Dashboard Interface**: Dark, cockpit-inspired UI with live data panels
- **Secure Token Management**: Tokens stored in httpOnly cookies, never exposed to client
- **Logout**: Clean session termination with cookie cleanup

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Schwab API** via OAuth2
- **Server Actions** for secure token handling
- **Vercel** (deployment-ready)

## Getting Started

### Prerequisites

1. **Schwab Developer Account**: Register at https://developer.schwab.com
2. **OAuth2 Credentials**:
   - `SCHWAB_CLIENT_ID`
   - `SCHWAB_CLIENT_SECRET`
   - `NEXT_PUBLIC_SCHWAB_REDIRECT_URI`

### Local Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your Schwab credentials to .env.local
# SCHWAB_CLIENT_ID=your_client_id
# SCHWAB_CLIENT_SECRET=your_client_secret
# NEXT_PUBLIC_SCHWAB_REDIRECT_URI=http://localhost:3000/auth/callback

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click "Connect Schwab Account".

### Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel settings:
   - `SCHWAB_CLIENT_ID`
   - `SCHWAB_CLIENT_SECRET`
   - `NEXT_PUBLIC_SCHWAB_REDIRECT_URI=https://your-domain.com/auth/callback`
4. Deploy

Update your Schwab app settings to use the production redirect URI.

## Project Structure

```
app/
├── page.tsx                 # Root redirect (auth → dashboard or login)
├── login/
│   └── page.tsx            # Login page with Schwab OAuth button
├── dashboard/
│   └── page.tsx            # Main dashboard (protected)
├── auth/
│   └── callback/
│       └── route.ts        # OAuth callback handler
├── logout/
│   └── route.ts            # Logout / cookie cleanup
├── actions/
│   └── account.ts          # Server action for account data fetch
└── layout.tsx              # Global layout

lib/
└── schwab-auth.ts          # Schwab API utilities & OAuth flows
```

## How It Works

1. **User clicks "Connect Schwab Account"** → redirects to Schwab OAuth login
2. **Schwab redirects back** to `/auth/callback?code=XXX`
3. **Callback route exchanges code for tokens** → stores in httpOnly cookies
4. **User redirected to dashboard** → server action fetches account data
5. **Dashboard renders with account summary** (balance, buying power, cash)
6. **Click logout** → clears cookies, redirects to login

## Next Steps (Phase 2)

- [ ] Positions list with real-time P&L
- [ ] Live market data / watchlist with WebSocket
- [ ] Order placement UI
- [ ] Trade history / execution panel
- [ ] Secure token refresh flow (auto-renew before expiry)
- [ ] Database storage for user sessions (instead of cookies only)
- [ ] Multi-account support
- [ ] Advanced charting / candlestick data

## Notes

- **Secrets**: Never commit `.env.local`. Use Vercel secrets for production.
- **Token Refresh**: Currently tokens expire based on Schwab's `expires_in`. TODO: implement auto-refresh before expiry.
- **Rate Limits**: Schwab API has rate limits. Monitor and add backoff logic if needed.
- **Error Handling**: Basic error states implemented; enhance as needed.

## License

MIT
