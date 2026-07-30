import { STOCKS } from '../data/stocks';

export function aiDecide(ai, prices, history, aiCash, aiPortfolio) {
  var actions = [];
  var st = ai.strategy;
  var totalHeld = Object.entries(aiPortfolio).reduce(function(s, e) {
    return s + (prices[e[0]] || 0) * e[1];
  }, 0);
  var investRatio = totalHeld / (aiCash + totalHeld + 0.01);
  // 가격이 존재하는 종목만 대상 (실전 모드는 에피소드 로스터만 가격을 가짐)
  var shuffled = STOCKS.filter(function(s) { return prices[s.id] != null; }).sort(function() { return Math.random() - 0.5; });

  shuffled.forEach(function(s) {
    var h = history[s.id] || [];
    var p = prices[s.id];
    var held = aiPortfolio[s.id] || 0;
    var ch = h.length >= 2 ? (h[h.length - 1] - h[h.length - 2]) / h[h.length - 2] : 0;

    if (st === 'momentum') {
      if (ch > 0.005 && Math.random() > 0.35 && investRatio < 0.8) {
        var q = Math.floor(aiCash * (0.15 + Math.random() * 0.25) / p);
        if (q > 0) actions.push({ type: 'buy', stock: s.id, qty: q });
      }
      if (ch < -0.01 && held > 0 && Math.random() > 0.25) {
        actions.push({ type: 'sell', stock: s.id, qty: Math.max(1, Math.ceil(held * 0.6)) });
      }
      if (ch > 0.05 && held > 0 && Math.random() > 0.5) {
        actions.push({ type: 'sell', stock: s.id, qty: Math.max(1, Math.ceil(held * 0.3)) });
      }
    } else if (st === 'value') {
      if (ch < -0.005 && Math.random() > 0.3 && investRatio < 0.75) {
        var q2 = Math.floor(aiCash * (0.1 + Math.random() * 0.2) / p);
        if (q2 > 0) actions.push({ type: 'buy', stock: s.id, qty: q2 });
      }
      if (ch < -0.03 && Math.random() > 0.2 && investRatio < 0.85) {
        var q3 = Math.floor(aiCash * 0.3 / p);
        if (q3 > 0) actions.push({ type: 'buy', stock: s.id, qty: q3 });
      }
      if (ch > 0.02 && held > 0 && Math.random() > 0.35) {
        actions.push({ type: 'sell', stock: s.id, qty: Math.max(1, Math.ceil(held * 0.5)) });
      }
    } else if (st === 'aggressive') {
      if (Math.random() > 0.35 && investRatio < 0.9) {
        var q4 = Math.floor(aiCash * (0.2 + Math.random() * 0.3) / p);
        if (q4 > 0) actions.push({ type: 'buy', stock: s.id, qty: q4 });
      }
      if (held > 0 && Math.random() > 0.4) {
        actions.push({ type: 'sell', stock: s.id, qty: Math.max(1, Math.ceil(held * (0.3 + Math.random() * 0.7))) });
      }
    } else if (st === 'contrarian') {
      if (ch < -0.008 && Math.random() > 0.3 && investRatio < 0.8) {
        var q5 = Math.floor(aiCash * (0.15 + Math.random() * 0.2) / p);
        if (q5 > 0) actions.push({ type: 'buy', stock: s.id, qty: q5 });
      }
      if (ch > 0.015 && held > 0 && Math.random() > 0.3) {
        actions.push({ type: 'sell', stock: s.id, qty: Math.max(1, Math.ceil(held * 0.5)) });
      }
    } else {
      if (Math.random() > 0.45 && investRatio < 0.85) {
        var q6 = Math.floor(aiCash * (0.1 + Math.random() * 0.3) / p);
        if (q6 > 0) actions.push({ type: 'buy', stock: s.id, qty: q6 });
      }
      if (held > 0 && Math.random() > 0.45) {
        actions.push({ type: 'sell', stock: s.id, qty: Math.max(1, Math.ceil(held * Math.random())) });
      }
    }
  });

  actions.sort(function() { return Math.random() - 0.5; });
  return actions.slice(0, 1 + Math.floor(Math.random() * 3));
}
