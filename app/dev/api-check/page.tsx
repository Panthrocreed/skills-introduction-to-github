import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSchwabSession } from '@/lib/schwab-session';
import { runApiCheck, type ApiCheckEntry } from '@/app/actions/api-check';
import { RunButton } from './run-button';

export const dynamic = 'force-dynamic';

export default async function ApiCheckPage() {
  const session = await readSchwabSession();
  if (!session) redirect('/login?error=session_expired');

  const result = await runApiCheck();

  const okCount = result.checks.filter((c) => c.ok).length;
  const total = result.checks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">API Check</h1>
            <p className="text-slate-400 text-xs">
              Pings each Schwab endpoint and shows the raw response
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RunButton />
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white transition-colors text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Pill
            label={result.mock ? 'Mock mode' : 'Live mode'}
            tone={result.mock ? 'amber' : 'green'}
          />
          <Pill
            label={`${okCount}/${total} ok`}
            tone={okCount === total ? 'green' : okCount > 0 ? 'amber' : 'red'}
          />
          {result.mock && (
            <p className="text-slate-400 text-xs">
              Set <code className="font-mono bg-slate-800 px-1 rounded">SCHWAB_CLIENT_ID</code>{' '}
              in <code className="font-mono bg-slate-800 px-1 rounded">.env.local</code> to hit
              the real API.
            </p>
          )}
        </div>

        {result.fatal && (
          <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-300">
            {result.fatal}
          </div>
        )}

        <ul className="space-y-3">
          {result.checks.map((c, i) => (
            <CheckRow key={i} entry={c} />
          ))}
        </ul>
      </main>
    </div>
  );
}

function CheckRow({ entry }: { entry: ApiCheckEntry }) {
  const tone = entry.ok ? 'border-green-700/40' : 'border-red-700/40';

  return (
    <li className={`bg-slate-800 border ${tone} rounded-lg overflow-hidden`}>
      <details>
        <summary className="cursor-pointer px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              entry.ok ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium">{entry.name}</div>
            <div className="text-slate-400 text-xs font-mono truncate">
              {entry.endpoint}
            </div>
          </div>
          <div className="text-right text-xs">
            {entry.status !== null && (
              <div
                className={`font-mono ${
                  entry.ok ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {entry.status}
              </div>
            )}
            <div className="text-slate-500">{entry.durationMs}ms</div>
          </div>
        </summary>

        <div className="border-t border-slate-700 px-4 py-3 space-y-3 text-xs">
          <div>
            <span className="text-slate-500">Message:</span>{' '}
            <span className={entry.ok ? 'text-slate-200' : 'text-red-300'}>
              {entry.message}
            </span>
          </div>
          {entry.correlId && (
            <div>
              <span className="text-slate-500">Correlation ID:</span>{' '}
              <span className="font-mono text-slate-300">{entry.correlId}</span>
            </div>
          )}
          {entry.body && (
            <div>
              <p className="text-slate-500 mb-1">Response body:</p>
              <pre className="bg-slate-950 border border-slate-700 rounded p-3 overflow-auto text-slate-300 max-h-60">
                {prettify(entry.body)}
              </pre>
            </div>
          )}
          {entry.result !== null && entry.result !== undefined && (
            <div>
              <p className="text-slate-500 mb-1">Parsed result:</p>
              <pre className="bg-slate-950 border border-slate-700 rounded p-3 overflow-auto text-slate-300 max-h-80">
                {safeJsonStringify(entry.result)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: 'amber' | 'green' | 'red';
}) {
  const cls = {
    amber: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
    green: 'bg-green-900/40 text-green-300 border-green-700/40',
    red: 'bg-red-900/40 text-red-300 border-red-700/40',
  }[tone];
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

function prettify(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
