'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function RunButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setSpinning(false), 400);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5 transition-colors disabled:opacity-60"
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
      Re-run checks
    </button>
  );
}
