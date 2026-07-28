// 하루(턴) 마감 리뷰 유틸 (L3 — "왜 움직였나" 중 '하루 마감 판단 피드백'용 순수 함수)
//
// 목적 (헌법 §2-3 즉각 피드백): 하루가 끝날 때 "오늘 네 판단이 어땠는지"를
//   개념과 연결해 코칭한다. 결과 숫자만 던지지 않고, 왜 그런 상황이 됐는지
//   (등락 · 뉴스 연결 · 분산 · 현금 비중 · 악재 노출)를 개념 용어로 짚어준다.
//
// 정확성 주의 (헌법 §6): 수익 보장·특정 종목 매수/매도 권유 표현 금지.
//   문구는 "관찰·리스크 인지·개념 학습" 톤이며, 지나간 하루에 대한 회고일 뿐
//   앞으로 오르내린다는 예측이나 매매 신호가 아니다. 가상 시뮬레이션 톤 유지.
//
// 부작용·React·import 없음. ES5 스타일(var/function). App.jsx가 결과를 렌더링한다.
//
// 입력 ctx (정확히 이 shape로 전달됨):
//   prevPrices: { [stockId]: number }   // 어제 종가 (원 단위 정수 취급)
//   newPrices:  { [stockId]: number }   // 오늘 종가
//   todayNews:  [{ text, type:'good'|'bad'|'neutral'|'system', sector:string|null }]
//   portfolio:  { [stockId]: qty }      // 현재 보유 수량
//   avgCost:    { [stockId]: number }   // 평단가
//   STOCKS:     [{ id, name, sector, ... }]  (배열 또는 {id:stock} 맵 둘 다 허용)
//   cash: number, totalAssets: number
//
// 반환:
//   { messages: [{ tone:'good'|'warn'|'info', text:string, term? }], headline:string }
//   term 은 학습 페이지 용어 id (존재하는 것만): 'diversify' | 'risk' | 'stoploss' | 'sector' | 'news'

// STOCKS 를 id→stock 맵으로 정규화 (배열이면 map, 이미 맵이면 그대로 값 정리).
function toStockMap(STOCKS) {
  var map = {};
  if (!STOCKS) return map;
  if (Object.prototype.toString.call(STOCKS) === '[object Array]') {
    for (var i = 0; i < STOCKS.length; i++) {
      var s = STOCKS[i];
      if (s && s.id != null) map[s.id] = s;
    }
    return map;
  }
  // 객체 맵으로 들어온 경우
  for (var k in STOCKS) {
    if (Object.prototype.hasOwnProperty.call(STOCKS, k)) {
      var v = STOCKS[k];
      if (v && v.id == null) v = { id: k, name: v.name || k, sector: v.sector || null };
      map[k] = v;
    }
  }
  return map;
}

// stockId → 표시용 이름 (없으면 id 그대로).
function stockName(stockMap, id) {
  var s = stockMap[id];
  return s && s.name ? s.name : id;
}

// stockId → 섹터 (없으면 null).
function stockSector(stockMap, id) {
  var s = stockMap[id];
  return s && s.sector != null ? s.sector : null;
}

// 오늘 등락률(%) — 원 단위 정수 취급, 소수점 무시. prev 0/음수면 null.
function pctChange(prev, next) {
  var p = Math.round(prev || 0);
  var n = Math.round(next || 0);
  if (p <= 0) return null;
  return ((n - p) / p) * 100;
}

// 부호 붙은 % 한 자리 문자열: +3.2% / -1.5%
function fmtPct(pct) {
  var sign = pct >= 0 ? '+' : '';
  return sign + pct.toFixed(1) + '%';
}

// 오늘 뉴스 중 특정 섹터를 건드리는 항목 찾기 (같은 섹터 또는 매크로).
// good/bad 만 방향 뉴스로 취급 (neutral/system 제외).
function newsForSector(todayNews, sector, wantType) {
  var news = todayNews || [];
  for (var i = 0; i < news.length; i++) {
    var it = news[i];
    if (!it) continue;
    if (it.type !== wantType) continue;
    // 매크로(sector=null)는 전 종목에 작용 → 어떤 섹터든 매칭.
    if (it.sector == null || it.sector === sector) return it;
  }
  return null;
}

// reviewDay: 하루 마감 코칭 메시지(2~4개) + 총평 headline 생성.
export function reviewDay(ctx) {
  ctx = ctx || {};
  var prevPrices = ctx.prevPrices || {};
  var newPrices = ctx.newPrices || {};
  var todayNews = ctx.todayNews || [];
  var portfolio = ctx.portfolio || {};
  var STOCKS = ctx.STOCKS;
  var cash = Math.round(ctx.cash || 0);
  var totalAssets = Math.round(ctx.totalAssets || 0);

  var stockMap = toStockMap(STOCKS);

  // 보유 종목(수량>0)만 추린다.
  var holds = [];
  for (var id in portfolio) {
    if (!Object.prototype.hasOwnProperty.call(portfolio, id)) continue;
    var qty = portfolio[id] || 0;
    if (qty <= 0) continue;
    var price = Math.round(newPrices[id] || 0);
    var value = price * qty;
    holds.push({
      id: id,
      name: stockName(stockMap, id),
      sector: stockSector(stockMap, id),
      qty: qty,
      value: value,
      pct: pctChange(prevPrices[id], newPrices[id]) // null 가능
    });
  }

  var messages = [];
  var headline = '';

  // ── 보유 없음: 관찰 안내 위주 (매수 권유 금지, §6) ──────────────────
  if (holds.length === 0) {
    messages.push({
      tone: 'info',
      text: '오늘은 아무 종목도 들고 있지 않았어요. 사기 전에 뉴스와 주가가 어떻게 움직이는지 지켜보는 것도 훌륭한 연습이에요.',
      term: 'news'
    });
    // 오늘 방향성 뉴스가 있었는지 짚어준다 (관찰 포인트).
    var sampleNews = null;
    for (var ni = 0; ni < todayNews.length; ni++) {
      var t = todayNews[ni];
      if (t && (t.type === 'good' || t.type === 'bad')) { sampleNews = t; break; }
    }
    if (sampleNews) {
      var secLabel = sampleNews.sector == null ? '시장 전체' : sampleNews.sector;
      var dirLabel = sampleNews.type === 'good' ? '상승 압력' : '하락 압력';
      messages.push({
        tone: 'info',
        text: '오늘 "' + secLabel + '" 쪽에 ' + (sampleNews.type === 'good' ? '호재' : '악재') + '가 있었어요. 이 뉴스가 관련 종목을 어느 쪽(' + dirLabel + ')으로 밀었는지 관찰해 두면 감이 생겨요.',
        term: 'sector'
      });
    } else {
      messages.push({
        tone: 'info',
        text: '가상 시뮬레이션이라 실패해도 손해가 없어요. 관심 종목 하나를 정해 며칠간 주가 흐름만 눈으로 따라가 보세요.'
      });
    }
    headline = '오늘은 관망한 하루 — 시장을 읽는 눈부터 키워요';
    return { messages: messages, headline: headline };
  }

  // ── 보유 있음 ────────────────────────────────────────────────────────
  // 총 평가금(보유 가치 합).
  var equityVal = 0;
  for (var h = 0; h < holds.length; h++) equityVal += holds[h].value;

  // (1) 오늘 등락 요약: 가장 크게 오른/내린 보유 1~2개.
  //     등락률 계산 가능한 것만 정렬.
  var moved = holds.filter(function(x) { return x.pct != null; });
  moved.sort(function(a, b) { return b.pct - a.pct; });

  var topUp = moved.length > 0 && moved[0].pct > 0 ? moved[0] : null;
  var topDown = moved.length > 0 && moved[moved.length - 1].pct < 0 ? moved[moved.length - 1] : null;

  if (topUp) {
    var upNews = newsForSector(todayNews, topUp.sector, 'good');
    var upText = topUp.name + ' ' + fmtPct(topUp.pct) + ' — 오늘 오른 하루였어요';
    if (upNews) {
      var upSec = upNews.sector == null ? '시장 전체' : upNews.sector;
      upText = topUp.name + ' ' + fmtPct(topUp.pct) + ' — 오늘 "' + upSec + '" 호재가 반영된 흐름으로 보여요';
    }
    messages.push({ tone: 'good', text: upText, term: upNews ? 'news' : undefined });
  }

  if (topDown && (!topUp || topDown.id !== topUp.id)) {
    var dnNews = newsForSector(todayNews, topDown.sector, 'bad');
    var dnText = topDown.name + ' ' + fmtPct(topDown.pct) + ' — 오늘 내린 하루였어요';
    if (dnNews) {
      var dnSec = dnNews.sector == null ? '시장 전체' : dnNews.sector;
      dnText = topDown.name + ' ' + fmtPct(topDown.pct) + ' — 오늘 "' + dnSec + '" 악재가 눌렀던 흐름으로 보여요';
    }
    messages.push({ tone: 'warn', text: dnText, term: dnNews ? 'news' : undefined });
  }

  // (2) 분산: 한 섹터 또는 한 종목에 70%+ 몰렸는지.
  //     비중 기준은 '보유 평가금(equityVal)' 대비.
  var concentrated = false;
  if (equityVal > 0) {
    // 종목 집중.
    var maxStock = holds[0];
    for (var hi = 1; hi < holds.length; hi++) {
      if (holds[hi].value > maxStock.value) maxStock = holds[hi];
    }
    var stockShare = maxStock.value / equityVal;

    // 섹터 집중.
    var sectorVal = {};
    for (var si = 0; si < holds.length; si++) {
      var sec = holds[si].sector == null ? '__macro__' : holds[si].sector;
      sectorVal[sec] = (sectorVal[sec] || 0) + holds[si].value;
    }
    var maxSectorKey = null, maxSectorVal = 0;
    for (var sk in sectorVal) {
      if (!Object.prototype.hasOwnProperty.call(sectorVal, sk)) continue;
      if (sectorVal[sk] > maxSectorVal) { maxSectorVal = sectorVal[sk]; maxSectorKey = sk; }
    }
    var sectorShare = maxSectorVal / equityVal;

    if (stockShare >= 0.7 && holds.length === 1) {
      concentrated = true;
      messages.push({
        tone: 'warn',
        text: maxStock.name + ' 한 종목에 보유가 몰려 있어요. 그 종목에 악재 한 방이 터지면 자산 전체가 크게 흔들릴 수 있어요.',
        term: 'diversify'
      });
    } else if (sectorShare >= 0.7) {
      concentrated = true;
      var secName = maxSectorKey === '__macro__' ? '한 그룹' : ('"' + maxSectorKey + '" 섹터');
      messages.push({
        tone: 'warn',
        text: '보유가 ' + secName + '에 집중돼 있어요(약 ' + Math.round(sectorShare * 100) + '%). 같은 악재 한 방에 함께 흔들릴 수 있으니 분산을 생각해볼 만해요.',
        term: 'diversify'
      });
    } else if (stockShare >= 0.7) {
      concentrated = true;
      messages.push({
        tone: 'warn',
        text: maxStock.name + '이(가) 보유의 약 ' + Math.round(stockShare * 100) + '%를 차지해요. 한 종목 의존도가 높으면 그 종목 리스크에 그대로 노출돼요.',
        term: 'diversify'
      });
    } else if (holds.length >= 2) {
      messages.push({
        tone: 'good',
        text: '여러 종목·섹터에 나눠 담아서 한쪽 악재에 덜 휘둘리는 구성이에요. 분산이 잘 된 하루예요.',
        term: 'diversify'
      });
    }
  }

  // (3) 현금 과다: 총자산의 90%+ 가 현금 (거의 안 삼).
  //     보유가 있어도 평가금 비중이 미미하면 안내.
  if (totalAssets > 0 && cash / totalAssets >= 0.9) {
    messages.push({
      tone: 'info',
      text: '아직 자산의 대부분(약 ' + Math.round((cash / totalAssets) * 100) + '%)이 현금이에요. 관찰만 하는 것도 전략이지만, 그만큼 기회도 놓칠 수 있다는 걸 기억해요.'
    });
  }

  // (4) 악재 섹터 보유: 오늘 악재가 난 섹터를 들고 있으면 리스크·손절 개념 환기.
  var riskHitName = null, riskSecLabel = null;
  for (var rh = 0; rh < holds.length; rh++) {
    var hit = newsForSector(todayNews, holds[rh].sector, 'bad');
    if (hit) {
      riskHitName = holds[rh].name;
      riskSecLabel = hit.sector == null ? '시장 전체' : hit.sector;
      break;
    }
  }
  if (riskHitName) {
    messages.push({
      tone: 'warn',
      text: '오늘 "' + riskSecLabel + '" 악재가 있었고 관련 종목(' + riskHitName + ')을 보유 중이에요. 손실이 커질 때 어디서 정리할지(손절 기준)를 미리 정해두면 흔들림이 줄어요.',
      term: 'stoploss'
    });
  }

  // ── 메시지 개수 보정: 최소 2개, 최대 4개 ────────────────────────────
  if (messages.length === 0) {
    messages.push({
      tone: 'info',
      text: '오늘은 보유 종목이 큰 움직임 없이 잔잔했어요. 이런 날은 뉴스와 지표를 차분히 읽어두기 좋아요.',
      term: 'news'
    });
  }
  if (messages.length === 1) {
    messages.push({
      tone: 'info',
      text: '수익은 하루로 결정되지 않아요. 왜 올랐고 왜 내렸는지 이유를 쌓아가는 게 진짜 실력이에요.'
    });
  }
  if (messages.length > 4) {
    // 우선순위: 앞쪽(등락·분산)을 유지, warn 을 우선 남긴다.
    var warns = messages.filter(function(m) { return m.tone === 'warn'; });
    var rest = messages.filter(function(m) { return m.tone !== 'warn'; });
    var merged = warns.concat(rest);
    messages = merged.slice(0, 4);
  }

  // ── headline 총평 ────────────────────────────────────────────────────
  if (riskHitName) {
    headline = '오늘은 악재 노출을 점검할 하루';
  } else if (concentrated) {
    headline = '오늘은 한쪽에 쏠린 하루 — 분산을 생각해볼 때';
  } else if (totalAssets > 0 && cash / totalAssets >= 0.9) {
    headline = '오늘은 대부분 현금으로 관망한 하루';
  } else if (holds.length >= 2) {
    headline = '오늘은 분산이 잘 된 하루';
  } else if (topUp && (!topDown)) {
    headline = '오늘은 보유 종목이 웃은 하루';
  } else if (topDown && (!topUp)) {
    headline = '오늘은 보유 종목이 눌린 하루 — 이유를 복기해봐요';
  } else {
    headline = '오늘 하루 판단을 되짚어봐요';
  }

  return { messages: messages, headline: headline };
}
