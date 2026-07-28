// 종목 상태 해석 (L2 보강 — "지금 이 종목은 이런 상태"를 초보자 문장으로)
//
// 헌법 §6(정확성): 단정·매수권유 금지. "~성격/편/경향" 톤으로 상대적 위치만 짚는다.
//   PER/변동성 구간 경계는 교육용 러프 기준이며 절대적 판정이 아니다.
//
// 부작용·React·import 없음. ES5 스타일. App.jsx가 결과를 렌더링한다.
// 반환: [{ label, text, tone:'calm'|'warn'|'info', term? }]  // term = 학습 페이지 용어 id(존재하는 것만)

export function interpretStock(st) {
  if (!st) return [];
  var out = [];

  // PER — 이익 대비 주가가 비싼지 싼지의 첫 잣대
  if (st.per != null) {
    var per = st.per, lab = 'PER ' + per + 'x';
    if (per < 10) out.push({ label: lab, text: '이익 대비 주가가 낮은 편 — 저평가(가치주) 성격', tone: 'calm', term: 'per' });
    else if (per <= 25) out.push({ label: lab, text: '이익 대비 보통 수준의 밸류에이션', tone: 'calm', term: 'per' });
    else out.push({ label: lab, text: '성장 기대가 큰 편 — 기대에 못 미치면 크게 빠질 수 있음', tone: 'warn', term: 'per' });
  }

  // 변동성 — 얼마나 널뛰는가
  if (st.volatility != null) {
    var v = st.volatility, vl = '변동성 ' + (v * 100).toFixed(1) + '%';
    if (v < 0.03) out.push({ label: vl, text: '비교적 잔잔한 종목 — 초보자가 다루기 쉬운 편', tone: 'calm', term: 'volatility' });
    else if (v < 0.04) out.push({ label: vl, text: '보통 수준의 등락', tone: 'calm', term: 'volatility' });
    else out.push({ label: vl, text: '변동이 큰 종목 — 수익도 손실도 커지기 쉬움(고위험)', tone: 'warn', term: 'risk' });
  }

  // 시장 — 한국 vs 미장
  if (st.market === 'US') out.push({ label: '미장', text: '미국 주식 — 달러로 거래, 환율·거래시간(한국 밤~새벽)의 영향을 받음', tone: 'info', term: 'exchange' });
  else out.push({ label: '코스피', text: '한국 시장 상장 종목 — 원화로 바로 거래', tone: 'info', term: 'market' });

  return out;
}
