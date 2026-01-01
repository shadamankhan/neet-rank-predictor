export function fmtNumber(n) {
  if (n === undefined || n === null) return '-';
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString();
  return String(n);
}

export function fmtShort(n) {
  if (n === undefined || n === null) return '-';
  if (n >= 1000000) return Math.round(n/1_000_000) + 'M';
  if (n >= 1000) return Math.round(n/1000) + 'k';
  return String(n);
}

export function fmtPercent(p) {
  if (p === undefined || p === null) return '-';
  return `${Number(p).toFixed(2)}%`;
}

