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

// 원화 정밀 표기: ₩12,340,000 (소수점 없음, 천단위 콤마)
export function won(n) {
  return '₩' + Math.round(n || 0).toLocaleString('ko-KR');
}

// 원화 축약 표기: 큰 금액을 조/억/만 단위로 (시가총액·요약용)
export function wonK(n) {
  var v = n || 0, a = Math.abs(v);
  if (a >= 1e12) return '₩' + (v / 1e12).toFixed(1) + '조';                        // 조
  if (a >= 1e8) return '₩' + Math.round(v / 1e8).toLocaleString('ko-KR') + '억';   // 억
  if (a >= 1e4) return '₩' + Math.round(v / 1e4).toLocaleString('ko-KR') + '만';   // 만
  return '₩' + Math.round(v).toLocaleString('ko-KR');
}
