export function money(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function signedMoney(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${money(Math.abs(value))}`;
}

export function percent(value: number, fractionDigits = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function changeColor(value: number): string {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-300';
}
