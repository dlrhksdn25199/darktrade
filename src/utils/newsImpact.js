// 뉴스 임팩트 연쇄 유틸 (L3 — "왜 움직였나"용 순수 함수 모음)
//
// 목적: "뉴스 → 섹터 → 내 보유종목" 연쇄를 유저가 눈으로 보게 한다.
//   하루치 뉴스 각 항목을 받아, 그 뉴스가 어느 섹터를 건드리는지, 그 섹터에
//   어떤 종목이 있는지, 그중 내가 보유한 게 무엇인지까지 펼쳐서 돌려준다.
//
// 정확성 주의 (헌법 §6): 호재라고 반드시 오른다고 단정하지 않는다.
//   dir/문구는 "유리/불리·▲/▼ 압력" 톤 — 확정된 결과가 아니라 방향성 '압력'이다.
//   실제 시뮬 가격은 RNG+bias로 매번 달라지므로 여기 dir은 "이 뉴스가 어느 쪽으로
//   미는 힘인가"를 표시하는 교육용 라벨일 뿐이다.
//
// 부작용·React·import 없음. ES5 스타일(var/function). App.jsx가 결과를 렌더링한다.

// 섹터 라벨: 매크로(sector=null)는 "시장 전체"로 표기.
function sectorLabel(sector) {
  return sector == null ? '시장 전체' : sector;
}

// type → 호재/악재/중립 한국어 라벨.
function typeLabel(type) {
  if (type === 'good') return '호재';
  if (type === 'bad') return '악재';
  return ''; // neutral/system 은 라벨 없이 통과
}

// type → 방향 압력. good=상승 압력('up'), bad=하락 압력('down'), 그 외는 방향 없음.
function typeDir(type) {
  if (type === 'good') return 'up';
  if (type === 'bad') return 'down';
  return 'flat';
}

// 방향 화살표 기호(압력 톤). up=▲, down=▼, 그 외=빈 문자열.
function dirArrow(dir) {
  if (dir === 'up') return '▲';
  if (dir === 'down') return '▼';
  return '';
}

// enrichNews: 하루치 뉴스 배열을 "섹터→종목→내 보유" 연쇄로 확장한 배열로 변환.
//   todayNews: [{ text, type:'good'|'bad'|'neutral'|'system', day, sector:string|null }]
//   portfolio: { [stockId]: qty }
//   STOCKS:    [{ id, name, sector, ... }]
// 반환 각 항목:
//   { text, type, sector, isMacro, sectorStocks:[{id,name}],
//     myHits:[{id,name,qty,dir}], others:[{id,name}] }
export function enrichNews(todayNews, portfolio, STOCKS) {
  var news = todayNews || [];
  var pf = portfolio || {};
  var stocks = STOCKS || [];

  return news.map(function(item) {
    var sector = item.sector != null ? item.sector : null;
    var isMacro = sector === null;

    // 이 뉴스의 영향권 종목: 매크로면 전 종목, 아니면 같은 섹터 종목.
    var affected = stocks.filter(function(s) {
      return isMacro || s.sector === sector;
    });

    var sectorStocks = affected.map(function(s) {
      return { id: s.id, name: s.name };
    });

    // system/neutral 뉴스는 방향성 없는 표시용 → myHits/others 비우고 그대로 통과.
    if (item.type === 'system' || item.type === 'neutral') {
      return {
        text: item.text,
        type: item.type,
        sector: sector,
        isMacro: isMacro,
        sectorStocks: sectorStocks,
        myHits: [],
        others: []
      };
    }

    var dir = typeDir(item.type); // 'up' | 'down' | 'flat'
    var myHits = [];
    var others = [];

    affected.forEach(function(s) {
      var qty = pf[s.id] || 0;
      if (qty > 0) {
        myHits.push({ id: s.id, name: s.name, qty: qty, dir: dir });
      } else {
        others.push({ id: s.id, name: s.name });
      }
    });

    return {
      text: item.text,
      type: item.type,
      sector: sector,
      isMacro: isMacro,
      sectorStocks: sectorStocks,
      myHits: myHits,
      others: others
    };
  });
}

// chainSummary: enrichNews 결과 한 항목 → 한 줄 한국어 요약 문자열.
//   예) "반도체 호재 → 내 보유 삼성전자·SK하이닉스 ▲ 압력"
//       "반도체 호재 (보유 없음)"
//       "시장 전체 악재 → 내 보유 삼성전자·현대차 ▼ 압력"
//       "장 마감" 등 system/neutral 은 뉴스 문구를 그대로 반환.
export function chainSummary(item) {
  if (!item) return '';

  // 방향성 없는 뉴스는 그냥 문구만.
  if (item.type === 'system' || item.type === 'neutral') {
    return item.text;
  }

  var head = sectorLabel(item.sector) + ' ' + typeLabel(item.type);

  var hits = item.myHits || [];
  if (hits.length === 0) {
    return head + ' (보유 없음)';
  }

  var names = hits.map(function(h) { return h.name; }).join('·');
  var arrow = dirArrow(hits[0].dir); // 같은 뉴스 → 보유 종목 방향 동일

  // "▲/▼ 압력" 톤: 확정 상승/하락이 아니라 방향 압력임을 명시(§6 정확성).
  var tail = arrow ? ' ' + arrow + ' 압력' : '';
  return head + ' → 내 보유 ' + names + tail;
}
