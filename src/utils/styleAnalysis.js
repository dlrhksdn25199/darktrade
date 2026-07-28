// styleAnalysis.js — 커리큘럼 L4(투자 스타일) 순수 분석 모듈.
// 용도: 시즌(15일) 종료 시 플레이어의 이번 시즌 전체 매매 기록(eventLog)을 분석해,
//   "당신의 매매 성향은 5명의 AI 트레이더 중 누구와 가장 닮았나"를 매칭하고
//   관찰된 특징·강점·리스크(약점)를 교육용으로 되돌려 준다.
//
// 헌법 §6 준수:
//   - 특정 스타일이 "옳다/수익난다"고 단정하지 않는다. 어떤 성향도 우열이 아니다.
//   - 강약점은 "~경향 / ~리스크" 톤으로만 서술. 매수·매도 권유, 미래 예측 표현 금지.
//   - 이건 지나간 시즌의 '거울'일 뿐, 실전 매매 신호가 아니다(가상 시뮬레이션).
//
// 순수 함수: React·import·부작용 없음. ES5(var/function) 스타일.
//
// 입력 데이터 shape (App.jsx eventLog / priceHistory 기준):
//   trades:       [{ day, type:'buy'|'sell'|'ability', stock, qty, price }]  // ability는 stock/qty/price가 없을 수 있음 → 무시
//   priceHistory: { [stockId]: number[] }   // 종목별 일자별 종가(index = 경과일)
//   STOCKS:       [{ id, name, sector, volatility, ... }]
//   AI_PLAYERS:   [{ id, name, avatar, strategy, desc, color }]

// ── 내부 헬퍼 ──────────────────────────────────────────────

// 안전 나눗셈(0 가드).
function safeRatio(a, b) {
  if (!b) return 0;
  return a / b;
}

// 특정 종목의 day 시점 '직전 추세'를 판정한다.
// priceHistory[stock]에서 day 이전 최대 3일 구간의 가격 흐름을 보고
//   1 = 직전 상승, -1 = 직전 하락, 0 = 판단 불가/횡보.
function trendBefore(priceHistory, stock, day) {
  var hist = priceHistory && priceHistory[stock];
  if (!hist || hist.length < 2) return 0;
  // day 시점 종가의 인덱스는 대략 day(경과일). 히스토리 길이로 클램프.
  var idx = day;
  if (idx >= hist.length) idx = hist.length - 1;
  if (idx < 1) return 0;
  var lookback = 3;
  var from = idx - lookback;
  if (from < 0) from = 0;
  var cur = hist[idx];
  var past = hist[from];
  if (typeof cur !== "number" || typeof past !== "number" || !past) return 0;
  var change = (cur - past) / past;
  // ±1% 안쪽은 횡보로 본다(노이즈 컷).
  if (change > 0.01) return 1;
  if (change < -0.01) return -1;
  return 0;
}

// ── 메인 ───────────────────────────────────────────────────

export function analyzeStyle(trades, priceHistory, STOCKS, AI_PLAYERS) {
  trades = trades || [];
  priceHistory = priceHistory || {};
  STOCKS = STOCKS || [];
  AI_PLAYERS = AI_PLAYERS || [];

  // ability 타입 등은 스타일 분석에서 무시. stock 정보 없는 것도 제외.
  var real = [];
  for (var i = 0; i < trades.length; i++) {
    var t = trades[i];
    if (!t) continue;
    if (t.type !== "buy" && t.type !== "sell") continue;
    if (!t.stock) continue;
    real.push(t);
  }

  // ── 기본 지표 집계 ──
  var buyCount = 0, sellCount = 0;
  var buyAfterUp = 0, buyAfterDown = 0;      // 추세 판정된 매수만 카운트
  var sellAfterUp = 0, sellAfterDown = 0;    // 매도 타이밍(오르면 파는지) 판정
  var stockSet = {};
  var daySet = {};

  for (var j = 0; j < real.length; j++) {
    var tr = real[j];
    stockSet[tr.stock] = true;
    daySet[tr.day] = true;
    var trend = trendBefore(priceHistory, tr.stock, tr.day);
    if (tr.type === "buy") {
      buyCount++;
      if (trend > 0) buyAfterUp++;
      else if (trend < 0) buyAfterDown++;
    } else {
      sellCount++;
      if (trend > 0) sellAfterUp++;
      else if (trend < 0) sellAfterDown++;
    }
  }

  var tradeCount = real.length;
  var distinctStocks = 0;
  for (var sk in stockSet) { if (stockSet.hasOwnProperty(sk)) distinctStocks++; }
  var activeDays = 0;
  for (var dk in daySet) { if (daySet.hasOwnProperty(dk)) activeDays++; }

  // 추세가 판정된 매수만 분모로 써서 상승매수/하락매수 성향 비율을 낸다.
  var trendedBuys = buyAfterUp + buyAfterDown;
  var buyAfterUpRatio = safeRatio(buyAfterUp, trendedBuys);
  var buyAfterDownRatio = safeRatio(buyAfterDown, trendedBuys);
  var avgTradesPerActiveDay = safeRatio(tradeCount, activeDays);

  var metrics = {
    tradeCount: tradeCount,
    buyCount: buyCount,
    sellCount: sellCount,
    buyAfterUpRatio: +buyAfterUpRatio.toFixed(3),
    buyAfterDownRatio: +buyAfterDownRatio.toFixed(3),
    avgTradesPerActiveDay: +avgTradesPerActiveDay.toFixed(2),
    distinctStocks: distinctStocks
  };

  // ── 헬퍼: 전략별 AI 객체 찾기(없으면 첫 번째로 폴백) ──
  function pickAi(strategy) {
    for (var a = 0; a < AI_PLAYERS.length; a++) {
      if (AI_PLAYERS[a] && AI_PLAYERS[a].strategy === strategy) return AI_PLAYERS[a];
    }
    return AI_PLAYERS[0] || { id: null, name: "?", avatar: "❓", strategy: strategy, desc: "", color: "#888" };
  }

  // ── 거래 극소량(관망형) → random 성격 + 낮은 confidence ──
  if (tradeCount < 3) {
    var randAi = pickAi("random");
    return {
      matchedAi: randAi,
      confidence: 0.15,
      metrics: metrics,
      traits: ["매매 횟수가 적은 관망형(신중형) 경향", "시장을 지켜보며 움직임을 아낀 편"],
      strengths: ["성급하게 자주 사고팔지 않아 잦은 거래 비용·실수 노출이 적은 편"],
      weaknesses: [
        "표본이 적어 자기 매매 성향을 아직 파악하기 어려운 상태",
        "관망만으로는 시장 반응을 몸으로 익힐 기회가 줄어드는 리스크"
      ],
      summary: "이번 시즌은 거래가 적어 성향을 단정하기 이른 관망형 플레이였어요."
    };
  }

  // ── 전략별 점수 산정(러프 스코어링, 설명 가능하게) ──
  // 각 전략에 대한 성향 근거를 점수로 쌓는다.
  var score = { momentum: 0, value: 0, aggressive: 0, contrarian: 0, random: 0 };

  // 1) 매수 추세 성향: 상승 후 매수 → momentum, 하락 후 매수 → value & contrarian
  score.momentum += buyAfterUpRatio * 2.0;
  score.value += buyAfterDownRatio * 1.6;
  score.contrarian += buyAfterDownRatio * 1.2;

  // 2) 매도 타이밍: 오르면 파는 성향은 contrarian(역추세)·차익실현 색채.
  var trendedSells = sellAfterUp + sellAfterDown;
  var sellAfterUpRatio = safeRatio(sellAfterUp, trendedSells);
  var sellAfterDownRatio = safeRatio(sellAfterDown, trendedSells);
  // 오르면 팔고(+) 내리면 사는(buyAfterDown) 조합이 강하면 contrarian.
  score.contrarian += sellAfterUpRatio * 1.6;
  // 하락매수 + 상승매도가 동시에 뚜렷하면 '남들과 반대' 역추세 시그니처 → contrarian 보너스.
  if (buyAfterDownRatio >= 0.5 && sellAfterUpRatio >= 0.5) score.contrarian += 1.4;
  // 반대로 내려도 안 팔고(하락에 매도 안 함) 하락매수+장기보유면 value 색채.
  // 보유 성향: 매도 대비 매수가 많고 회전이 낮으면 value 가중.
  var sellRatio = safeRatio(sellCount, tradeCount);
  if (sellRatio < 0.3) score.value += 1.0;   // 거의 안 파는(오래 들고 있는) 경향

  // 3) 매매 빈도·회전: 하루 평균 거래가 잦고 사고팔기를 반복하면 aggressive.
  if (avgTradesPerActiveDay >= 2) score.aggressive += (avgTradesPerActiveDay - 1) * 2.0;
  if (tradeCount >= 10) score.aggressive += 1.0;
  // 매수·매도를 고르게 반복(높은 회전)하면 aggressive 색채 강화.
  if (sellRatio >= 0.3 && sellRatio <= 0.7 && tradeCount >= 8) score.aggressive += 1.2;
  // 종목을 여러 개 갈아타면 aggressive 색채도 소폭.
  if (distinctStocks >= 5) score.aggressive += 0.6;

  // 4) 뚜렷한 추세 패턴이 거의 없으면 random 성향 가중.
  var patternStrength = Math.abs(buyAfterUpRatio - buyAfterDownRatio);
  if (patternStrength < 0.2 && sellRatio >= 0.35 && avgTradesPerActiveDay < 2) {
    score.random += 0.9;
  }

  // ── 최고 점수 전략 선택 ──
  var bestStrategy = "random", bestScore = -1, totalScore = 0;
  var order = ["momentum", "value", "aggressive", "contrarian", "random"];
  for (var s = 0; s < order.length; s++) {
    var st = order[s];
    totalScore += score[st];
    if (score[st] > bestScore) { bestScore = score[st]; bestStrategy = st; }
  }
  if (bestScore <= 0) bestStrategy = "random";

  var matchedAi = pickAi(bestStrategy);

  // ── confidence: 점수 우위(분리도) × 표본 충분도 ──
  var separation = safeRatio(bestScore, totalScore || 1); // 최고 전략이 전체에서 차지하는 비중
  var sampleFactor = tradeCount >= 12 ? 1 : tradeCount / 12;
  var confidence = separation * sampleFactor;
  if (bestScore <= 0) confidence = 0.2;
  if (confidence > 0.95) confidence = 0.95;
  if (confidence < 0.1) confidence = 0.1;
  confidence = +confidence.toFixed(2);

  // ── traits(관찰된 특징, 2~4개) ──
  var traits = [];
  if (buyAfterUpRatio >= 0.55) traits.push("상승 추세를 따라 매수하는 경향(추세추종)");
  if (buyAfterDownRatio >= 0.55) traits.push("가격이 떨어졌을 때 사들이는 경향(저가매수)");
  if (sellAfterUpRatio >= 0.55) traits.push("오르면 차익을 실현하듯 매도하는 경향");
  if (sellRatio < 0.35) traits.push("한번 산 종목을 오래 들고 가는 경향(장기보유)");
  if (avgTradesPerActiveDay >= 2) traits.push("거래일마다 매매가 잦아 회전이 빠른 편");
  if (distinctStocks >= 5) traits.push("여러 종목에 걸쳐 폭넓게 매매한 편(분산형)");
  else if (distinctStocks <= 2) traits.push("소수 종목에 매매를 집중한 편(집중형)");
  if (patternStrength < 0.2 && traits.length === 0) traits.push("뚜렷한 방향성보다 상황 따라 움직인 경향");
  if (traits.length === 0) traits.push("여러 성향이 섞여 나타난 편");
  if (traits.length > 4) traits = traits.slice(0, 4);

  // ── strengths / weaknesses (강점 1~3 / 약점·리스크 1~3, 우열 단정 금지) ──
  var strengths = [];
  var weaknesses = [];

  if (bestStrategy === "momentum") {
    strengths.push("시장의 흐름(추세)에 올라타 방향을 읽으려는 감각이 관찰돼요");
    weaknesses.push("이미 오른 뒤 따라 사면 고점에서 물릴 수 있는 리스크가 있어요");
  } else if (bestStrategy === "value") {
    strengths.push("싸게 사서 기다리는 인내심(저가매수·보유) 경향이 보여요");
    weaknesses.push("떨어지는 종목이 더 떨어질 때 손실이 길어질 수 있는 리스크가 있어요");
  } else if (bestStrategy === "aggressive") {
    strengths.push("기회에 빠르게 반응하며 적극적으로 매매하는 실행력이 보여요");
    weaknesses.push("매매가 잦으면 비용·감정적 판단에 노출되기 쉬운 리스크가 있어요");
  } else if (bestStrategy === "contrarian") {
    strengths.push("분위기에 휩쓸리지 않고 반대로 보려는 독립적 판단이 관찰돼요");
    weaknesses.push("시장과 반대로 갈 때 흐름이 길어지면 견디기 어려운 리스크가 있어요");
  } else {
    strengths.push("특정 패턴에 얽매이지 않고 유연하게 대응한 편이에요");
    weaknesses.push("일관된 기준이 옅으면 판단을 되짚어 배우기 어려운 리스크가 있어요");
  }

  // 분산/집중에 따른 리스크(공통) — 우열 아닌 트레이드오프로 서술.
  if (distinctStocks <= 2) {
    weaknesses.push("소수 종목 집중은 한 종목 악재에 크게 흔들릴 수 있어 분산이 아쉬운 편");
  } else if (distinctStocks >= 6) {
    strengths.push("여러 종목에 나눠 담아 한 종목 충격을 줄이려는 분산 경향이 보여요");
  }
  // 관망/보유의 장점 하나 더(있을 때).
  if (sellRatio < 0.35 && strengths.length < 3) {
    strengths.push("성급히 팔지 않고 판단을 지켜본 침착함이 보여요");
  }

  if (strengths.length > 3) strengths = strengths.slice(0, 3);
  if (weaknesses.length > 3) weaknesses = weaknesses.slice(0, 3);

  // ── summary(한 줄 총평) ──
  var styleLabel = {
    momentum: "추세를 따라 올라타는",
    value: "떨어질 때 담아 기다리는",
    aggressive: "빠르게 치고 빠지는",
    contrarian: "분위기와 반대로 보는",
    random: "상황 따라 유연하게 움직인"
  };
  var summary = "이번 시즌 당신의 매매는 " + styleLabel[bestStrategy] +
    " 성향이 두드러져 " + matchedAi.name + "(" + matchedAi.avatar + ")와(과) 가장 닮았어요.";

  return {
    matchedAi: matchedAi,
    confidence: confidence,
    metrics: metrics,
    traits: traits,
    strengths: strengths,
    weaknesses: weaknesses,
    summary: summary
  };
}
