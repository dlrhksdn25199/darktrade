// 시작 자금: 1천만원 (한국 개미 초보자 기준 현실적 시드머니)
export var INITIAL_CASH = 10000000;
export var SEASON_DAYS = 15;

// 미장(미국 주식) 원화 환산에 쓰는 기준 환율 (근사치). 나중 L3에서 환율 교육 소재로 재활용.
export var USD_KRW = 1380;

// ── 실존 기업 로스터 (한국 5 + 미장 5) ──
// 지표(basePrice·per·shares·시총)는 2024년 기준 수동 큐레이션 '근사치'다. 실시간 값 아님.
// market: 'KR'=코스피 | 'US'=미장. US 종목의 basePrice 는 priceUSD × USD_KRW 로 원화 환산.
export var STOCKS = [
  // ── 한국 (코스피) ──
  { id: '삼성전자', name: 'Samsung · 코스피 005930', market: 'KR', ticker: '005930', sector: '반도체', volatility: 0.025, basePrice: 71000, priceUSD: null, shares: 5969782550, per: 13.2, desc: '세계 1위 메모리 반도체·스마트폰 제조사. 한국 시가총액 1위 대표 우량주.', ceo: '한종희', founded: 1969, employees: 267000 },
  { id: 'SK하이닉스', name: 'SK hynix · 코스피 000660', market: 'KR', ticker: '000660', sector: '반도체', volatility: 0.035, basePrice: 180000, priceUSD: null, shares: 728002365, per: 28.4, desc: '세계 2위 메모리 반도체 기업. AI 열풍의 핵심인 HBM(고대역폭 메모리) 강자.', ceo: '곽노정', founded: 1983, employees: 31000 },
  { id: '네이버', name: 'NAVER · 코스피 035420', market: 'KR', ticker: '035420', sector: '인터넷', volatility: 0.03, basePrice: 170000, priceUSD: null, shares: 155000000, per: 24.6, desc: '한국 최대 검색 포털·커머스·핀테크 플랫폼. AI·클라우드 사업 확장 중.', ceo: '최수연', founded: 1999, employees: 4900 },
  { id: '카카오', name: 'Kakao · 코스피 035720', market: 'KR', ticker: '035720', sector: '인터넷', volatility: 0.04, basePrice: 40000, priceUSD: null, shares: 445000000, per: 41.0, desc: '국민 메신저 카카오톡 기반 플랫폼. 금융·모빌리티·콘텐츠로 확장한 성장주.', ceo: '정신아', founded: 1995, employees: 3800 },
  { id: '현대차', name: 'Hyundai · 코스피 005380', market: 'KR', ticker: '005380', sector: '자동차', volatility: 0.03, basePrice: 250000, priceUSD: null, shares: 209416191, per: 5.1, desc: '한국 1위 완성차 기업. 전기차·수소차 전환 가속, 저PER 대표 가치주.', ceo: '장재훈', founded: 1967, employees: 72000 },

  // ── 미장 (미국) ── basePrice = priceUSD × USD_KRW(1380)
  { id: 'AAPL', name: '애플 · 나스닥', market: 'US', ticker: 'AAPL', sector: '기술', volatility: 0.025, basePrice: 317400, priceUSD: 230, shares: 15200000000, per: 34.8, desc: '아이폰·맥·서비스 생태계를 가진 세계 최대 시총 기업. 미국 대표 우량주.', ceo: '팀 쿡', founded: 1976, employees: 161000 },
  { id: 'NVDA', name: '엔비디아 · 나스닥', market: 'US', ticker: 'NVDA', sector: '반도체', volatility: 0.045, basePrice: 179400, priceUSD: 130, shares: 24600000000, per: 55.0, desc: 'AI 가속기(GPU) 사실상 독점. AI 붐의 최대 수혜주이자 변동성 큰 성장주.', ceo: '젠슨 황', founded: 1993, employees: 29600 },
  { id: 'TSLA', name: '테슬라 · 나스닥', market: 'US', ticker: 'TSLA', sector: '자동차', volatility: 0.05, basePrice: 345000, priceUSD: 250, shares: 3190000000, per: 68.5, desc: '세계 전기차·자율주행 선도. 기대와 실망에 크게 출렁이는 고변동 성장주.', ceo: '일론 머스크', founded: 2003, employees: 140000 },
  { id: 'MSFT', name: '마이크로소프트 · 나스닥', market: 'US', ticker: 'MSFT', sector: '기술', volatility: 0.022, basePrice: 579600, priceUSD: 420, shares: 7430000000, per: 36.2, desc: '윈도우·오피스·애저 클라우드. OpenAI 파트너십으로 AI 시대 핵심 플레이어.', ceo: '사티아 나델라', founded: 1975, employees: 221000 },
  { id: 'GOOGL', name: '알파벳(구글) · 나스닥', market: 'US', ticker: 'GOOGL', sector: '인터넷', volatility: 0.03, basePrice: 241500, priceUSD: 175, shares: 12300000000, per: 23.7, desc: '구글 검색·유튜브·클라우드를 가진 광고·AI 거인. 상대적으로 낮은 PER.', ceo: '순다르 피차이', founded: 1998, employees: 182000 },
];
