export function fmtN(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function fmtD(n) {
  return Math.abs(n) < 0.01 ? '0.00' : n.toFixed(2);
}

export function fmtF(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtP(n) {
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%';
}
