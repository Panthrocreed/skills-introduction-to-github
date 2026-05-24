import type { SchwabCandle } from '@/lib/schwab-auth';

interface SparklineProps {
  candles: SchwabCandle[];
  width?: number;
  height?: number;
}

export function Sparkline({ candles, width = 800, height = 240 }: SparklineProps) {
  if (candles.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No price history available
      </div>
    );
  }

  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const padding = 8;
  const usableHeight = height - padding * 2;
  const stepX = (width - padding * 2) / (candles.length - 1);

  const points = candles.map((c, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (c.close - min) / range) * usableHeight;
    return [x, y] as const;
  });

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');

  const areaD = `${pathD} L ${(width - padding).toFixed(2)} ${(height - padding).toFixed(2)} L ${padding} ${(height - padding).toFixed(2)} Z`;

  const isUp = candles[candles.length - 1].close >= candles[0].close;
  const strokeColor = isUp ? '#4ade80' : '#f87171';
  const fillColor = isUp ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      role="img"
      aria-label="Price history chart"
    >
      <path d={areaD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
