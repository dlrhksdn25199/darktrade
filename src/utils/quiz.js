// quiz.js — L3(왜 움직였나) 뉴스↔섹터 미니퀴즈 빌더.
// 뉴스가 뜨는 순간 "이 뉴스는 어느 섹터에 호재/악재?"를 유저가 맞히게 해서
// 뉴스 → 섹터 → 내 종목 연쇄를 몸으로 익히게 하는 순수 함수 모음.
//
// 헌법 §6(정확성): 방향은 "확정 수익"이 아니라 "유리/불리" 톤으로만 서술한다.
// 특정 종목 매수·매도 권유 금지. 예시 종목은 "그 섹터에 속한다"는 사실 안내일 뿐.
//
// 부작용·React·import 없음. ES5 스타일(var/function). Math.random 만 사용.
//
// 입력 뉴스 shape (App.jsx 가 만드는 그대로):
//   { text: string, type: 'good'|'bad'|'neutral'|'system', day: number, sector: string|null }
//   sector: 반도체·기술·인터넷·자동차 중 하나 = 섹터 뉴스 / null = 매크로(시장 전체)
// STOCKS: [{ id, name, sector, ... }] — 존재하는 섹터 목록의 출처.

// 시장 전체(매크로) 정답에 쓰는 라벨. STOCKS 의 어떤 sector 값과도 겹치지 않는다.
var MARKET_LABEL = '시장 전체';

// type -> 방향(호재/악재) 라벨. neutral/system 은 퀴즈화 불가라 여기 없다.
function directionOf(type) {
  if (type === 'good') return 'good';
  if (type === 'bad') return 'bad';
  return null;
}

function dirWord(direction) {
  return direction === 'good' ? '호재' : '악재';
}

// 유리/불리 톤 단어 (수익 보장 아님).
function favorWord(direction) {
  return direction === 'good' ? '유리' : '불리';
}

// STOCKS 에서 서로 다른 섹터 목록을 순서 유지하며 뽑는다.
function uniqueSectors(STOCKS) {
  var out = [];
  if (!STOCKS || !STOCKS.length) return out;
  for (var i = 0; i < STOCKS.length; i++) {
    var s = STOCKS[i] && STOCKS[i].sector;
    if (!s) continue;
    var seen = false;
    for (var j = 0; j < out.length; j++) { if (out[j] === s) { seen = true; break; } }
    if (!seen) out.push(s);
  }
  return out;
}

// 종목을 사람이 읽기 친절한 이름으로. 한국 종목은 id(예:삼성전자), 미장은 name 앞부분(예:애플).
function friendlyName(st) {
  if (!st) return '';
  if (st.market === 'US' && st.name && st.name.indexOf('·') >= 0) return st.name.split('·')[0].trim();
  return st.id;
}

// 특정 섹터에 속한 대표 종목명 하나(설명용 예시). 없으면 빈 문자열.
function sampleStockName(STOCKS, sector) {
  if (!STOCKS) return '';
  for (var i = 0; i < STOCKS.length; i++) {
    if (STOCKS[i] && STOCKS[i].sector === sector) return friendlyName(STOCKS[i]);
  }
  return '';
}

// Fisher–Yates 셔플(원본 불변). 보기 순서를 매번 다르게.
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// 뉴스 text 앞부분만 인용(너무 길면 자른다).
function quoteText(text) {
  var t = (text || '').trim();
  if (t.length <= 22) return t;
  return t.slice(0, 22) + '…';
}

// 정답 + 오답 후보들에서 중복 없이 최대 total 개(정답 포함)를 만든다.
// answer 는 반드시 포함. 나머지는 distractors 를 셔플해 채운다.
function buildOptions(answer, distractors, total) {
  var opts = [answer];
  var pool = shuffle(distractors);
  for (var i = 0; i < pool.length && opts.length < total; i++) {
    var d = pool[i];
    if (d === answer) continue;
    var dup = false;
    for (var j = 0; j < opts.length; j++) { if (opts[j] === d) { dup = true; break; } }
    if (!dup) opts.push(d);
  }
  return shuffle(opts);
}

// 메인: 뉴스 항목 하나를 퀴즈 객체로. 퀴즈화 불가면 null.
export function buildQuiz(newsItem, STOCKS) {
  if (!newsItem) return null;

  // system / neutral 은 방향(호재·악재)이 없으므로 퀴즈 불가 → null (호출측 스킵).
  var direction = directionOf(newsItem.type);
  if (!direction) return null;

  var sectors = uniqueSectors(STOCKS);
  var isMacro = (newsItem.sector === null || newsItem.sector === undefined);

  // 섹터 뉴스인데 그 섹터가 STOCKS 에 없으면(판별 애매) → null.
  if (!isMacro) {
    var known = false;
    for (var i = 0; i < sectors.length; i++) { if (sectors[i] === newsItem.sector) { known = true; break; } }
    if (!known) return null;
  }

  var quote = quoteText(newsItem.text);
  var dw = dirWord(direction);       // '호재' | '악재'
  var fw = favorWord(direction);     // '유리' | '불리'

  var answer, options, explainCorrect, explainWrong;

  if (isMacro) {
    // 매크로: 정답은 '시장 전체'. 보기 = 시장 전체 + 섹터 몇 개 섞기.
    answer = MARKET_LABEL;
    options = buildOptions(MARKET_LABEL, sectors, 4);
    explainCorrect =
      '맞아요! 금리·환율·지정학 같은 이 뉴스는 특정 섹터가 아니라 ' + MARKET_LABEL +
      '에 ' + dw + '라, 시장 전반이 함께 ' + fw + '해지는 쪽으로 작용해요.';
    explainWrong =
      '아쉬워요. 이건 한 섹터만의 뉴스가 아니라 ' + MARKET_LABEL + '에 영향을 주는 ' + dw +
      '예요. 매크로(금리·환율 등)는 시장 전반을 함께 움직입니다.';
  } else {
    // 일반: 정답 = 뉴스의 섹터. 오답 = 나머지 섹터들 중 최대 3개.
    answer = newsItem.sector;
    var distractors = [];
    for (var k = 0; k < sectors.length; k++) { if (sectors[k] !== answer) distractors.push(sectors[k]); }
    // 정답 1 + 오답 최대 3 = 총 3~4지선다.
    options = buildOptions(answer, distractors, 4);

    var example = sampleStockName(STOCKS, answer);
    var exampleFrag = example ? ('그 섹터 종목(' + example + ' 등)') : '그 섹터 종목';
    explainCorrect =
      '맞아요! 이 뉴스는 ' + answer + '에 ' + dw + '예요. ' + exampleFrag + '이(가) ' + fw +
      '해질 가능성이 커요. (가상 시뮬레이션이니 확정 수익은 아니에요.)';
    explainWrong =
      '아쉬워요. 정답은 ' + answer + '예요. 이 뉴스는 ' + answer + ' 업종을 직접 건드리는 ' + dw +
      '라, ' + exampleFrag + '이(가) ' + fw + '해지는 쪽으로 기울어요.';
  }

  var question =
    '"' + quote + '" — 이 뉴스는 어느 쪽에 ' + dw + '일까요?';

  return {
    question: question,
    options: options,
    answer: answer,
    direction: direction,
    explainCorrect: explainCorrect,
    explainWrong: explainWrong
  };
}
