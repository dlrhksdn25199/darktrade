// 뉴스 풀. sector 가 종목 sector 와 일치하면 그 종목에 impact 만큼 편향(bias)이 걸린다.
// sector: null = 매크로(시장 전체에 약하게 작용). 섹터: 반도체 · 기술 · 인터넷 · 자동차.
export var NEWS_POOL = [
  // ── 반도체 ──
  { text: 'HBM 수요 폭증, 메모리 슈퍼사이클 진입 신호', sector: '반도체', impact: 0.1 },
  { text: 'AI 데이터센터 투자 확대에 반도체 주문 급증', sector: '반도체', impact: 0.09 },
  { text: '차세대 3nm 공정 양산 일정 앞당겨져', sector: '반도체', impact: 0.07 },
  { text: '주요 고객사, 대규모 반도체 장기 공급계약 체결', sector: '반도체', impact: 0.08 },
  { text: 'DRAM 현물가 반등, 감산 효과 가시화', sector: '반도체', impact: 0.06 },
  { text: '미국의 대중 반도체 수출 통제 강화 우려', sector: '반도체', impact: -0.07 },
  { text: '메모리 재고 조정 장기화 전망에 투자심리 위축', sector: '반도체', impact: -0.06 },
  { text: '반도체 업황 피크아웃 논란 재점화', sector: '반도체', impact: -0.05 },
  { text: '중국 반도체 자급률 확대 정책 발표', sector: '반도체', impact: -0.04 },
  { text: 'AI 칩 경쟁 심화, 마진 압박 우려', sector: '반도체', impact: -0.03 },

  // ── 기술(하드웨어·플랫폼) ──
  { text: '신형 플래그십 제품 출시, 사전 예약 신기록', sector: '기술', impact: 0.09 },
  { text: '클라우드 매출 급성장, 실적 컨센서스 상회', sector: '기술', impact: 0.1 },
  { text: '생성형 AI 서비스 유료 전환율 기대 이상', sector: '기술', impact: 0.08 },
  { text: '자사주 대규모 매입·배당 확대 발표', sector: '기술', impact: 0.06 },
  { text: '서비스 부문 구독자 증가로 이익 안정성 부각', sector: '기술', impact: 0.05 },
  { text: '주요국 반독점 규제·과징금 리스크 부각', sector: '기술', impact: -0.07 },
  { text: '신제품 판매 부진, 수요 둔화 신호', sector: '기술', impact: -0.06 },
  { text: 'AI 인프라 과잉투자 논란에 밸류에이션 부담', sector: '기술', impact: -0.05 },
  { text: '핵심 인력 이탈·구조조정 소식', sector: '기술', impact: -0.04 },
  { text: '환율·물류 비용 상승으로 원가 압박', sector: '기술', impact: -0.03 },

  // ── 인터넷(포털·플랫폼·광고) ──
  { text: '광고 매출 회복, 커머스 거래액 사상 최대', sector: '인터넷', impact: 0.09 },
  { text: '자체 AI 모델 공개, 검색·서비스 접목 기대', sector: '인터넷', impact: 0.08 },
  { text: '핀테크·콘텐츠 자회사 흑자 전환', sector: '인터넷', impact: 0.07 },
  { text: '유료 구독·멤버십 이용자 가파른 증가', sector: '인터넷', impact: 0.06 },
  { text: '해외 웹툰·콘텐츠 매출 고성장', sector: '인터넷', impact: 0.05 },
  { text: '플랫폼 독과점 규제 법안 발의', sector: '인터넷', impact: -0.07 },
  { text: '개인정보 유출 사고로 신뢰 훼손 우려', sector: '인터넷', impact: -0.08 },
  { text: '경기 둔화에 광고 예산 축소 조짐', sector: '인터넷', impact: -0.05 },
  { text: '신사업 적자 확대로 수익성 논란', sector: '인터넷', impact: -0.04 },
  { text: '경영진 리스크·오너 이슈 부각', sector: '인터넷', impact: -0.06 },

  // ── 자동차 ──
  { text: '전기차 판매 호조, 분기 인도량 최대치 경신', sector: '자동차', impact: 0.09 },
  { text: '신형 모델 흥행에 대기 수요 급증', sector: '자동차', impact: 0.08 },
  { text: '자율주행 소프트웨어 상용화 진전 발표', sector: '자동차', impact: 0.1 },
  { text: '북미·유럽 판매 확대로 점유율 상승', sector: '자동차', impact: 0.06 },
  { text: '원자재·배터리 가격 하락으로 마진 개선', sector: '자동차', impact: 0.05 },
  { text: '전기차 수요 둔화(캐즘) 우려 확산', sector: '자동차', impact: -0.07 },
  { text: '가격 인하 경쟁 심화로 수익성 악화', sector: '자동차', impact: -0.08 },
  { text: '대규모 리콜 이슈 발생', sector: '자동차', impact: -0.06 },
  { text: '주요 시장 관세·무역장벽 강화', sector: '자동차', impact: -0.05 },
  { text: '노조 파업으로 생산 차질 우려', sector: '자동차', impact: -0.04 },

  // ── 매크로 (시장 전체, sector=null) ──
  { text: '미국 연준, 기준금리 인하 시사에 위험자산 선호', sector: null, impact: 0.06 },
  { text: '원/달러 환율 급등, 수출주엔 호재·수입엔 부담', sector: null, impact: 0.03 },
  { text: '외국인 순매수 전환, 코스피 반등 시도', sector: null, impact: 0.05 },
  { text: '글로벌 증시 랠리에 투자심리 개선', sector: null, impact: 0.04 },
  { text: '예상 밖 물가 지표에 금리 인하 기대 후퇴', sector: null, impact: -0.05 },
  { text: '중동·지정학 리스크 고조로 변동성 확대', sector: null, impact: -0.06 },
  { text: '경기 침체 우려에 안전자산 선호 강화', sector: null, impact: -0.04 },
  { text: '외국인·기관 동반 매도에 지수 하락', sector: null, impact: -0.05 },
];
