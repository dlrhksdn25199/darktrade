# DARKTRADE 📈

> 사이버펑크 주식 시뮬레이터 — 5명의 AI 트레이더와 경쟁하세요

![DARKTRADE](https://img.shields.io/badge/DARK-TRADE-cyan?style=for-the-badge&labelColor=0a0e17)

## 게임 소개

DARKTRADE는 사이버펑크 테마의 턴제 주식 시뮬레이터입니다.

### 모드
- **일반 모드** — 순수 실력으로 15일간 최대 수익률 달성
- **세력 모드** — 물량 폭탄, 공매도 어택, 작전 세력 능력 사용 가능

### AI 트레이더
| AI | 전략 | 설명 |
|---|---|---|
| 🤖 AlgoX | 모멘텀 | 상승 추세 추종 |
| 🧠 DeepValue | 가치투자 | 하락 시 매수 |
| 🦈 SharkFin | 공격적 | 고빈도 대량 매매 |
| ⚡ QuantBot | 역추세 | 남들과 반대로 |
| 👻 GhostNet | 랜덤 | 예측 불가 |

### 종목 (6개)
NXG (기술) · QBT (반도체) · DFN (금융) · GRN (에너지) · MDP (바이오) · CYB (보안)

---

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 배포

### Vercel (추천)
1. GitHub에 push
2. [vercel.com](https://vercel.com) 에서 Import
3. 자동 배포 완료

### GitHub Pages
1. `vite.config.js`에서 `base`를 레포 이름으로 변경:
   ```js
   base: '/your-repo-name/',
   ```
2. 빌드 후 `dist` 폴더 배포:
   ```bash
   npm run build
   npx gh-pages -d dist
   ```

### Netlify
1. GitHub 연결
2. Build command: `npm run build`
3. Publish directory: `dist`

---

## 프로젝트 구조

```
darktrade/
├── index.html              # HTML 엔트리
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx            # React 엔트리
    ├── App.jsx             # 메인 게임 로직 & UI
    ├── data/
    │   ├── stocks.js       # 종목 데이터 & 설정
    │   ├── news.js         # 뉴스 풀 (80+)
    │   ├── abilities.js    # 세력 모드 능력
    │   └── aiPlayers.js    # AI 트레이더 설정
    ├── utils/
    │   ├── format.js       # 숫자/달러/퍼센트 포맷
    │   ├── helpers.js      # 가격 생성, ID 유틸
    │   └── aiEngine.js     # AI 매매 결정 엔진
    ├── components/
    │   └── Charts.jsx      # MiniChart, StockChart, VolumeChart
    └── styles/
        ├── index.css       # 글로벌 스타일
        └── theme.js        # 사이버펑크 테마 헬퍼
```

## 기술 스택

- **React 18** — UI 렌더링
- **Vite 6** — 빌드 도구
- **SVG** — 차트 렌더링 (외부 라이브러리 없음)
- **CSS-in-JS** — 인라인 스타일 (사이버펑크 테마)

## 라이선스

MIT
