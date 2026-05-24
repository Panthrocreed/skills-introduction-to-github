'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';

const STORAGE_KEY = 'nova-auto-refresh-seconds';
const INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

// useSyncExternalStore subscription: notifies all RefreshButton instances
// when the auto-refresh interval changes, including same-tab updates.
const subscribers = new Set<() => void>();
function subscribeIntervalChange(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
function notifyIntervalChange() {
  subscribers.forEach((cb) => cb());
}
function getIntervalSec(): number {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intervalSec = useSyncExternalStore(
    subscribeIntervalChange,
    getIntervalSec,
    () => 0
  );

  const refresh = useCallback(() => {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setSpinning(false), 400);
    });
  }, [router]);

  // Schedule auto-refresh; pauses when document is hidden.
  useEffect(() => {
    if (intervalSec <= 0) return;

    let cancelled = false;
    const schedule = () => {
      if (cancelled) return;
      timerRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible') refresh();
        schedule();
      }, intervalSec * 1000);
    };
    schedule();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [intervalSec, refresh]);

  const handleSelect = (value: number) => {
    window.localStorage.setItem(STORAGE_KEY, String(value));
    notifyIntervalChange();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={refresh}
        disabled={isPending}
        aria-label="Refresh"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md px-3 py-1.5 transition-colors disabled:opacity-60"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`}
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
        </svg>
        Refresh
      </button>

      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md overflow-hidden text-xs">
        <span className="px-2 py-1.5 text-slate-500">Auto</span>
        {INTERVALS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`px-2 py-1.5 font-medium transition-colors ${
              intervalSec === opt.value
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
