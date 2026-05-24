'use client';

import { useSearchParams } from 'next/navigation';
import { getSchwabAuthUrl } from '@/lib/schwab-auth';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleConnect = () => {
    try {
      const authUrl = getSchwabAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to get auth URL:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Nova Fox OS</h1>
            <p className="text-slate-400">Live Trading Dashboard</p>
          </div>

          {/* Main Content */}
          <div className="mb-8">
            <p className="text-slate-300 text-center mb-6">
              Connect your Schwab account to get started with live market data and portfolio insights.
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                {error === 'missing_code' && 'Authorization failed: No code received'}
                {error === 'token_exchange_failed' && 'Failed to exchange authorization code'}
                {!['missing_code', 'token_exchange_failed'].includes(error) && error}
              </div>
            )}

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-13-4h8m-8 3h5m-5 3h8m-8 3h5" />
              </svg>
              Connect Schwab Account
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 pt-6">
            <p className="text-slate-400 text-xs text-center">
              Nova Fox OS securely connects to your Schwab account via OAuth2.
              Your credentials are never stored locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
