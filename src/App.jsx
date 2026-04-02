import { useState, useCallback, useMemo } from "react";
import { INITIAL_CASH, SEASON_DAYS, STOCKS } from "./data/stocks";
import { ABILITIES } from "./data/abilities";
import { AI_PLAYERS } from "./data/aiPlayers";
import { NEWS_POOL } from "./data/news";
import { fmtN, fmtD, fmtF, fmtP } from "./utils/format";
import { genPrice as genP, uid } from "./utils/helpers";
import { aiDecide } from "./utils/aiEngine";
import { MiniChart, StockChart, VolumeChart } from "./components/Charts";
import { neon, panel as PNL, glow as GLW, btn as BTN, tag as TAG, secColor as secC } from "./styles/theme";

export default function App() {
  var _s = useState, _c = useCallback, _m = useMemo;
  var s = function(init) { return _s(init); };
  var [screen, setScreen] = s("menu");
  var [mode, setMode] = s("normal");
  var [day, setDay] = s(1);
  var [cash, setCash] = s(INITIAL_CASH);
  var [portfolio, setPortfolio] = s({});
  var [avgCost, setAvgCost] = s({});
  var [prices, setPrices] = s({});
  var [priceHistory, setPriceHistory] = s({});
  var [volumes, setVolumes] = s({});
  var [selectedStock, setSelectedStock] = s(STOCKS[0].id);
  var [tradeAmount, setTradeAmount] = s(1);
  var [news, setNews] = s([]);
  var [newsHistory, setNewsHistory] = s([]);
  var [eventLog, setEventLog] = s([]);
  var [abilities, setAbilities] = s({ volumeBomb: { cooldown: 0 }, shortAttack: { cooldown: 0 }, pumpScheme: { cooldown: 0 } });
  var [rankings, setRankings] = s([]);
  var [showTrade, setShowTrade] = s(false);
  var [tradeType, setTradeType] = s("buy");
  var [abilityMode, setAbilityMode] = s(null);
  var [seasonNum, setSeasonNum] = s(1);
  var [notification, setNotification] = s(null);
  var [pendingPumps, setPendingPumps] = s([]);
  var [dayHighLow, setDayHighLow] = s({});
  var [week52, setWeek52] = s({});
  var [infoTab, setInfoTab] = s("chart");
  var [aiPlayers, setAiPlayers] = s([]);
  var [aiActivity, setAiActivity] = s([]);
  var [rightTab, setRightTab] = s("detail");

  var notify = _c(function(msg, type) { setNotification({ msg: msg, type: type || "info" }); setTimeout(function() { setNotification(null); }, 2500); }, []);

  var initGame = _c(function(m) {
    setMode(m); setDay(1); setCash(INITIAL_CASH); setPortfolio({}); setAvgCost({}); setEventLog([]); setPendingPumps([]);
    setAbilities({ volumeBomb: { cooldown: 0 }, shortAttack: { cooldown: 0 }, pumpScheme: { cooldown: 0 } }); setInfoTab("chart"); setRightTab("detail"); setShowTrade(false); setAbilityMode(null);
    var ip = {}, ih = {}, iv = {}, idh = {}, iw = {};
    STOCKS.forEach(function(st) { ip[st.id] = st.basePrice; ih[st.id] = [st.basePrice]; iv[st.id] = [Math.floor(Math.random() * 50000) + 10000]; idh[st.id] = { high: st.basePrice, low: st.basePrice, open: st.basePrice }; iw[st.id] = { high: st.basePrice, low: st.basePrice }; });
    setPrices(ip); setPriceHistory(ih); setVolumes(iv); setDayHighLow(idh); setWeek52(iw);
    setAiPlayers(AI_PLAYERS.map(function(a) { return { ...a, cash: INITIAL_CASH, portfolio: {}, totalAssets: INITIAL_CASH }; }));
    setAiActivity([]); setNews([{ text: "시뮬레이션 시작. 시장이 열렸습니다.", type: "system" }]); setNewsHistory([]); setScreen("game");
  }, []);

  var totalAssets = cash + Object.entries(portfolio).reduce(function(s, e) { return s + (prices[e[0]] || 0) * e[1]; }, 0);
  var profitRate = (totalAssets - INITIAL_CASH) / INITIAL_CASH;

  var nextDay = _c(function() {
    if (day >= SEASON_DAYS) {
      var allR = [{ id: "PLAYER", name: "나", avatar: "👤", totalAssets: totalAssets, profitRate: profitRate, color: "#0ff", isPlayer: true }].concat(aiPlayers.map(function(a) { return { ...a, profitRate: (a.totalAssets - INITIAL_CASH) / INITIAL_CASH }; })).sort(function(a, b) { return b.profitRate - a.profitRate; });
      setRankings(function(p) { return p.concat([{ id: uid(), season: seasonNum, mode: mode, totalAssets: totalAssets, profitRate: profitRate, allRanks: allR }]); }); setScreen("result"); return;
    }
    var numN = Math.random() < 0.25 ? 3 : Math.random() < 0.45 ? 2 : 1, todayN = [], used = {};
    for (var ni = 0; ni < numN; ni++) { if (Math.random() < 0.75 || ni === 0) { var idx; do { idx = Math.floor(Math.random() * NEWS_POOL.length); } while (used[idx]); used[idx] = true; todayN.push(NEWS_POOL[idx]); } }
    var np = { ...prices }, nh = { ...priceHistory }, nv = { ...volumes }, ndh = {}, nw = { ...week52 }, ap = pendingPumps.slice(), rp = [];
    STOCKS.forEach(function(st) {
      var bias = 0;
      todayN.forEach(function(n) { if (n.sector === st.sector) bias += n.impact; else if (n.sector === null) bias += n.impact * 0.3; });
      ap.forEach(function(p) { if (p.stockId === st.id && p.turnsLeft > 0) { bias += 0.05 + Math.random() * 0.05; if (!rp.find(function(x) { return x.id === p.id; })) rp.push({ ...p, turnsLeft: p.turnsLeft - 1 }); } else if (p.stockId !== st.id && !rp.find(function(x) { return x.id === p.id; })) rp.push(p); });
      var op = np[st.id], newP = genP(op, st.volatility, bias), dv = Math.floor((Math.abs(bias) + 0.01) * 500000 + Math.random() * 80000 + 10000), spread = Math.abs(newP - op);
      np[st.id] = newP; nh[st.id] = (nh[st.id] || []).concat([newP]); nv[st.id] = (nv[st.id] || []).concat([dv]);
      var dH = +(Math.max(op, newP) + Math.random() * spread * 0.5).toFixed(2), dL = +Math.max(0.01, Math.min(op, newP) - Math.random() * spread * 0.5).toFixed(2);
      ndh[st.id] = { high: dH, low: dL, open: op }; var p52 = nw[st.id] || { high: newP, low: newP }; nw[st.id] = { high: Math.max(p52.high, dH), low: Math.min(p52.low, dL) };
    });
    var newAis = aiPlayers.map(function(ai) { return { ...ai, portfolio: { ...ai.portfolio } }; }), acts = [];
    newAis.forEach(function(ai) {
      aiDecide(ai, np, nh, ai.cash, ai.portfolio).forEach(function(d) {
        if (d.type === "buy") { var cost = np[d.stock] * d.qty; if (cost <= ai.cash && d.qty > 0) { ai.cash -= cost; ai.portfolio[d.stock] = (ai.portfolio[d.stock] || 0) + d.qty; acts.push({ name: ai.name, avatar: ai.avatar, color: ai.color, text: d.stock + " " + d.qty + "주 매수", type: "buy" }); } }
        else { var held = ai.portfolio[d.stock] || 0, qty = Math.min(d.qty, held); if (qty > 0) { ai.cash += np[d.stock] * qty; ai.portfolio[d.stock] = held - qty; if (ai.portfolio[d.stock] <= 0) delete ai.portfolio[d.stock]; acts.push({ name: ai.name, avatar: ai.avatar, color: ai.color, text: d.stock + " " + qty + "주 매도", type: "sell" }); } }
      });
      ai.totalAssets = ai.cash + Object.entries(ai.portfolio).reduce(function(s, e) { return s + (np[e[0]] || 0) * e[1]; }, 0);
    });
    setAiPlayers(newAis); setAiActivity(acts);
    setPendingPumps(rp.filter(function(p) { return p.turnsLeft > 0; })); setPrices(np); setPriceHistory(nh); setVolumes(nv); setDayHighLow(ndh); setWeek52(nw);
    setAbilities(function(p) { return { volumeBomb: { cooldown: Math.max(0, p.volumeBomb.cooldown - 1) }, shortAttack: { cooldown: Math.max(0, p.shortAttack.cooldown - 1) }, pumpScheme: { cooldown: Math.max(0, p.pumpScheme.cooldown - 1) } }; });
    var fN = todayN.map(function(n) { return { text: n.text, type: n.impact > 0 ? "good" : "bad", day: day + 1, sector: n.sector }; });
    if (fN.length === 0) fN.push({ text: "특별한 시장 뉴스 없음", type: "neutral", day: day + 1, sector: null });
    setNews(fN); setNewsHistory(function(p) { return fN.concat(p).slice(0, 60); }); setDay(function(d) { return d + 1; });
  }, [day, prices, priceHistory, volumes, pendingPumps, week52, mode, totalAssets, profitRate, seasonNum, aiPlayers]);

  var executeTrade = _c(function(type, sid, qty) {
    var price = prices[sid];
    if (type === "buy") {
      if (price * qty > cash) { notify("자금이 부족합니다!", "error"); return; }
      setCash(function(c) { return c - price * qty; }); var pq = portfolio[sid] || 0, pa = avgCost[sid] || 0;
      setAvgCost(function(a) { return { ...a, [sid]: (pa * pq + price * qty) / (pq + qty) }; });
      setPortfolio(function(p) { return { ...p, [sid]: pq + qty }; });
      setEventLog(function(l) { return l.concat([{ day: day, text: sid + " " + qty + "주 매수 @$" + fmtD(price), type: "buy" }]); }); notify(sid + " " + qty + "주 매수 완료", "success");
    } else {
      var held = portfolio[sid] || 0; if (qty > held) { notify("보유 수량 부족!", "error"); return; }
      setCash(function(c) { return c + price * qty; });
      setPortfolio(function(p) { var n = { ...p }; n[sid] = (n[sid] || 0) - qty; if (n[sid] <= 0) delete n[sid]; return n; });
      if (held - qty <= 0) setAvgCost(function(a) { var n = { ...a }; delete n[sid]; return n; });
      setEventLog(function(l) { return l.concat([{ day: day, text: sid + " " + qty + "주 매도 @$" + fmtD(price), type: "sell" }]); }); notify(sid + " " + qty + "주 매도 완료", "success");
    }
    setShowTrade(false);
  }, [prices, cash, portfolio, avgCost, day, notify]);

  var useAb = _c(function(ak, sid) {
    var ab = ABILITIES[ak]; if (abilities[ak].cooldown > 0) { notify("쿨다운 중!", "error"); return; } if (cash < ab.cost) { notify("자금 부족!", "error"); return; }
    setCash(function(c) { return c - ab.cost; }); setAbilities(function(p) { return { ...p, [ak]: { cooldown: ab.cooldown } }; });
    var np = { ...prices }, nh = { ...priceHistory };
    if (ak === "volumeBomb") { var d = Math.random() > 0.5 ? 1 : -1, im = (0.08 + Math.random() * 0.07) * d; np[sid] = +Math.max(0.01, np[sid] * (1 + im)).toFixed(2); nh[sid] = (nh[sid] || []).concat([np[sid]]); setPrices(np); setPriceHistory(nh); notify("💣 물량 폭탄! " + sid + (im > 0 ? " 급등!" : " 급락!"), "ability"); setEventLog(function(l) { return l.concat([{ day: day, text: "💣 물량폭탄 → " + sid + " (" + fmtP(im) + ")", type: "ability" }]); }); }
    else if (ak === "shortAttack") { var imp = -(0.10 + Math.random() * 0.10); np[sid] = +Math.max(0.01, np[sid] * (1 + imp)).toFixed(2); nh[sid] = (nh[sid] || []).concat([np[sid]]); setPrices(np); setPriceHistory(nh); notify("📉 공매도 어택! " + sid + " 폭락!", "ability"); setEventLog(function(l) { return l.concat([{ day: day, text: "📉 공매도 → " + sid + " (" + fmtP(imp) + ")", type: "ability" }]); }); }
    else if (ak === "pumpScheme") { setPendingPumps(function(p) { return p.concat([{ id: uid(), stockId: sid, turnsLeft: 3 }]); }); notify("🎯 작전 세력 가동! " + sid, "ability"); setEventLog(function(l) { return l.concat([{ day: day, text: "🎯 작전세력 → " + sid + " (3턴)", type: "ability" }]); }); }
    setAbilityMode(null);
  }, [abilities, cash, prices, priceHistory, day, notify]);

  var leaderboard = _m(function() {
    return [{ id: "PLAYER", name: "나", avatar: "👤", totalAssets: totalAssets, profitRate: profitRate, color: "#0ff", isPlayer: true }].concat(aiPlayers.map(function(a) { return { ...a, profitRate: (a.totalAssets - INITIAL_CASH) / INITIAL_CASH }; })).sort(function(a, b) { return b.profitRate - a.profitRate; });
  }, [totalAssets, profitRate, aiPlayers]);

  // ── MENU ──
  if (screen === "menu") return (
    <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#c8d6e5", fontFamily: "'Courier New', monospace" }}>
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,255,0.015) 2px,rgba(0,255,255,0.015) 4px)", pointerEvents: "none", zIndex: 100 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div style={{ fontSize: 11, letterSpacing: 8, color: "#0ff", marginBottom: 12, opacity: 0.7 }}>[ SIMULATION v3.0 ]</div>
          <h1 style={{ fontSize: "clamp(36px,7vw,56px)", fontWeight: 900, margin: 0, ...neon("#0ff"), letterSpacing: 4 }}>DARK<span style={neon("#f0f")}>TRADE</span></h1>
          <div style={{ fontSize: 13, color: "#556", marginTop: 8, letterSpacing: 3 }}>주식 시뮬레이터</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>{AI_PLAYERS.map(function(a) { return <span key={a.id} style={TAG(a.color)}>{a.avatar} {a.name}</span>; })}</div>
          <div style={{ fontSize: 11, color: "#445", marginTop: 8 }}>5명의 AI 트레이더와 경쟁하세요</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "min(320px,90%)" }}>
          <button style={{ ...BTN("#0ff"), padding: 16, fontSize: 16, letterSpacing: 2 }} onClick={function() { setScreen("modeSelect"); }}>▶ 게임 시작</button>
          <button style={{ ...BTN("#f0f"), padding: 16, fontSize: 16, letterSpacing: 2 }} onClick={function() { if (rankings.length === 0) notify("기록 없음"); else setScreen("result"); }}>◆ 전적 보기</button>
        </div>
      </div>
    </div>
  );

  // ── MODE ──
  if (screen === "modeSelect") return (
    <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#c8d6e5", fontFamily: "'Courier New', monospace" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#556", marginBottom: 30 }}>[ 모드 선택 ]</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ k: "normal", i: "📈", t: "일반 모드", d: "순수 실력으로 승부. " + SEASON_DAYS + "일 안에 AI를 이겨라.", c: "#0ff", tg: "CLASSIC" }, { k: "force", i: "🐋", t: "세력 모드", d: "특수 능력으로 시장을 지배하라.", c: "#f0f", tg: "WHALE" }].map(function(m) {
            return <div key={m.k} style={{ ...PNL, width: 280, cursor: "pointer", transition: "all 0.3s" }} onClick={function() { initGame(m.k); }}><div style={GLW(m.c)} /><div style={{ fontSize: 28, marginBottom: 8 }}>{m.i}</div><h3 style={{ margin: "0 0 6px", ...neon(m.c), fontSize: 18 }}>{m.t}</h3><p style={{ fontSize: 12, color: "#667", margin: 0, lineHeight: 1.6 }}>{m.d}</p><div style={{ ...TAG(m.c), marginTop: 12 }}>{m.tg}</div></div>;
          })}
        </div>
        <button style={{ ...BTN("#556"), marginTop: 30 }} onClick={function() { setScreen("menu"); }}>← 뒤로</button>
      </div>
    </div>
  );

  // ── RESULT ──
  if (screen === "result") {
    var last = rankings[rankings.length - 1];
    var board = (last && last.allRanks) || leaderboard;
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#c8d6e5", fontFamily: "'Courier New', monospace" }}>
        <div style={{ padding: "30px 20px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#556", marginBottom: 10 }}>[ 시즌 {seasonNum} 종료 ]</div>
            <h2 style={{ ...neon(profitRate >= 0 ? "#0f6" : "#f33"), fontSize: 32, margin: 0 }}>{profitRate >= 0 ? "수익 달성!" : "손실 발생"}</h2>
          </div>
          <div style={{ ...PNL, marginBottom: 16, textAlign: "center" }}><div style={GLW(profitRate >= 0 ? "#0f6" : "#f33")} /><div style={{ fontSize: 13, color: "#556", marginBottom: 4 }}>최종 수익률</div><div style={{ fontSize: 34, fontWeight: 900, ...neon(profitRate >= 0 ? "#0f6" : "#f33") }}>{fmtP(profitRate)}</div><div style={{ fontSize: 12, color: "#778", marginTop: 6 }}>총 자산: ${fmtF(totalAssets)} / {mode === "force" ? "세력" : "일반"} 모드</div></div>
          <div style={{ ...PNL, marginBottom: 16 }}><div style={GLW("#ff0")} /><h3 style={{ margin: "0 0 12px", fontSize: 13, ...neon("#ff0") }}>◆ 최종 순위</h3>
            {board.map(function(r, i) { return <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: r.isPlayer ? "#0ff08" : "transparent", borderRadius: 4, borderLeft: "3px solid " + (i === 0 ? "#ff0" : i === 1 ? "#aaa" : i === 2 ? "#a65" : "#333"), marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 900, color: i === 0 ? "#ff0" : "#556", width: 24 }}>#{i + 1}</span><span style={{ fontSize: 16 }}>{r.avatar}</span><span style={{ flex: 1, fontSize: 12, color: r.isPlayer ? "#0ff" : "#aab", fontWeight: r.isPlayer ? 700 : 400 }}>{r.name}</span><span style={{ fontSize: 13, fontWeight: 700, color: r.profitRate >= 0 ? "#0f6" : "#f33" }}>{fmtP(r.profitRate)}</span><span style={{ fontSize: 10, color: "#556" }}>${fmtN(r.totalAssets)}</span></div>; })}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={BTN("#0ff")} onClick={function() { setSeasonNum(function(s) { return s + 1; }); setScreen("modeSelect"); }}>▶ 다음 시즌</button>
            <button style={BTN("#f0f")} onClick={function() { setScreen("menu"); }}>◆ 메인 메뉴</button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ──
  var sel = STOCKS.find(function(s) { return s.id === selectedStock; });
  var sp = prices[selectedStock] || 0, sh = priceHistory[selectedStock] || [], svol = volumes[selectedStock] || [];
  var sc = sh.length >= 2 ? (sh[sh.length - 1] - sh[sh.length - 2]) / sh[sh.length - 2] : 0;
  var held = portfolio[selectedStock] || 0, sdh = dayHighLow[selectedStock] || { high: sp, low: sp, open: sp };
  var s52 = week52[selectedStock] || { high: sp, low: sp }, sAvg = avgCost[selectedStock] || 0;
  var sMcap = sp * (sel ? sel.shares : 1), sTotRet = sh.length >= 2 ? (sh[sh.length - 1] - sh[0]) / sh[0] : 0;
  var sVolLast = svol.length > 0 ? svol[svol.length - 1] : 0, hasPump = pendingPumps.some(function(p) { return p.stockId === selectedStock; });
  var sectorNews = newsHistory.filter(function(n) { return n.sector === (sel ? sel.sector : "") || n.sector === null; });
  var myRank = leaderboard.findIndex(function(l) { return l.isPlayer; }) + 1;
  var nc = notification ? (notification.type === "error" ? "#f33" : notification.type === "success" ? "#0f6" : notification.type === "ability" ? "#f0f" : "#0ff") : "#0ff";

  // trade panel computed
  var maxBuy = sp > 0 ? Math.floor(cash / sp) : 0;
  var tradeCost = sp * tradeAmount;
  var cashPct = cash > 0 ? ((tradeCost / cash) * 100).toFixed(1) : "0.0";
  var heldPct = held > 0 ? ((tradeAmount / held) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e17", color: "#c8d6e5", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,255,0.015) 2px,rgba(0,255,255,0.015) 4px)", pointerEvents: "none", zIndex: 100 }} />
      {notification && <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "9px 22px", borderRadius: 6, fontSize: 12, fontWeight: 700, letterSpacing: 1, background: nc + "15", border: "1px solid " + nc, color: nc, animation: "fadeIn 0.3s" }}>{notification.msg}</div>}

      <div style={{ padding: "10px 14px", maxWidth: 900, margin: "0 auto" }}>
        {/* TOP */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 900, ...neon("#0ff"), letterSpacing: 2 }}>DARK<span style={neon("#f0f")}>TRADE</span></span>
            {mode === "force" && <span style={TAG("#f0f")}>세력</span>}
            <span style={TAG(myRank === 1 ? "#ff0" : myRank <= 3 ? "#0f6" : "#556")}>#{myRank}위</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11 }}>
            <span style={{ color: "#556" }}>DAY <span style={{ color: "#0ff", fontWeight: 700 }}>{day}</span>/{SEASON_DAYS}</span>
            <button style={{ ...BTN("#556"), padding: "3px 10px", fontSize: 10 }} onClick={function() { setScreen("menu"); }}>나가기</button>
          </div>
        </div>

        {/* ASSETS + RANKING */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ ...PNL, flex: "1 1 300px", display: "flex", flexWrap: "wrap", gap: 16, padding: "10px 14px" }}>
            <div style={GLW(profitRate >= 0 ? "#0f6" : "#f33")} />
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 2 }}>총 자산</div><div style={{ fontSize: 18, fontWeight: 900, ...neon(profitRate >= 0 ? "#0f6" : "#f33") }}>${fmtF(totalAssets)}</div></div>
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 2 }}>수익률</div><div style={{ fontSize: 14, fontWeight: 700, color: profitRate >= 0 ? "#0f6" : "#f33" }}>{fmtP(profitRate)}</div></div>
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 2 }}>현금</div><div style={{ fontSize: 14, fontWeight: 700, color: "#0ff" }}>${fmtF(cash)}</div></div>
          </div>
          <div style={{ ...PNL, flex: "1 1 240px", padding: "8px 12px" }}><div style={GLW("#ff0")} /><div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 4 }}>실시간 순위</div>
            {leaderboard.map(function(l, i) { return <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "2px 4px", borderRadius: 3, background: l.isPlayer ? "#0ff08" : "transparent" }}><span style={{ color: i === 0 ? "#ff0" : "#556", fontWeight: 700, width: 18 }}>#{i + 1}</span><span>{l.avatar}</span><span style={{ flex: 1, color: l.isPlayer ? "#0ff" : l.color, fontWeight: l.isPlayer ? 700 : 400 }}>{l.name}</span><span style={{ color: l.profitRate >= 0 ? "#0f6" : "#f33", fontWeight: 700 }}>{fmtP(l.profitRate)}</span></div>; })}
          </div>
        </div>

        {/* NEWS */}
        {news.length > 0 && <div style={{ marginBottom: 10, padding: "7px 12px", background: "#0d1520", border: "1px solid #1a2a4a", borderRadius: 6, fontSize: 11 }}><span style={{ color: "#ff0", marginRight: 8, fontWeight: 700 }}>⚡ 뉴스</span>{news.map(function(n, i) { return <span key={i} style={{ color: n.type === "good" ? "#0f6" : n.type === "bad" ? "#f33" : "#667" }}>{n.text}{i < news.length - 1 ? " │ " : ""}</span>; })}</div>}

        {/* AI ACTIVITY */}
        {aiActivity.length > 0 && <div style={{ marginBottom: 10, padding: "6px 12px", background: "#111118", border: "1px solid #1a1a3a", borderRadius: 6, fontSize: 10, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}><span style={{ color: "#a8f", fontWeight: 700 }}>🤖 AI 매매</span>{aiActivity.map(function(a, i) { return <span key={i} style={{ color: a.type === "buy" ? "#0f6" : "#f33" }}><span style={{ color: a.color }}>{a.avatar}{a.name}</span> {a.text}</span>; })}</div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* LEFT: MARKET */}
          <div style={{ flex: "1 1 260px", minWidth: 260 }}>
            <div style={{ ...PNL, marginBottom: 10 }}><div style={GLW("#0ff")} /><div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 8 }}>종목 목록</div>
              {STOCKS.map(function(st) {
                var p = prices[st.id] || st.basePrice, h = priceHistory[st.id] || [st.basePrice];
                var ch = h.length >= 2 ? (h[h.length - 1] - h[h.length - 2]) / h[h.length - 2] : 0, isUp = ch >= 0, isSel = selectedStock === st.id, pump = pendingPumps.some(function(pp) { return pp.stockId === st.id; });
                return <div key={st.id} onClick={function() { setSelectedStock(st.id); setInfoTab("chart"); setRightTab("detail"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 8px", borderRadius: 6, cursor: "pointer", background: isSel ? "#0ff08" : "transparent", border: "1px solid " + (isSel ? "#0ff40" : "transparent"), marginBottom: 2, transition: "all 0.15s" }}>
                  <div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12, fontWeight: 700, color: isSel ? "#0ff" : "#aab" }}>{st.id}</span><span style={{ ...TAG(secC(st.sector)), fontSize: 8, padding: "1px 4px" }}>{st.sector}</span>{pump && <span style={{ fontSize: 8, color: "#f0f" }}>🎯</span>}{portfolio[st.id] > 0 && <span style={{ ...TAG("#ff0"), fontSize: 8, padding: "1px 3px" }}>{portfolio[st.id]}주</span>}</div><div style={{ fontSize: 9, color: "#445" }}>{st.name}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 700, color: isUp ? "#0f6" : "#f33" }}>${fmtD(p)}</div><div style={{ fontSize: 9, color: isUp ? "#0f6" : "#f33" }}>{fmtP(ch)}</div></div>
                  <MiniChart data={h.slice(-15)} color={isUp ? "#0f6" : "#f33"} />
                </div>;
              })}
            </div>

            {/* PORTFOLIO */}
            {Object.keys(portfolio).length > 0 && <div style={{ ...PNL, marginBottom: 10 }}><div style={GLW("#ff0")} /><div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 6 }}>보유 종목</div>
              {Object.entries(portfolio).map(function(e) { var id = e[0], qty = e[1], cp = prices[id] || 0, avg = avgCost[id] || cp, pl = (cp - avg) / avg; return <div key={id} style={{ padding: "4px 0", borderBottom: "1px solid #1a2a3a" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}><span style={{ color: "#aab", fontWeight: 700 }}>{id} x{qty}</span><span style={{ color: "#ff0" }}>${fmtD(cp * qty)}</span></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 1 }}><span style={{ color: "#445" }}>평단 ${fmtD(avg)}</span><span style={{ color: pl >= 0 ? "#0f6" : "#f33" }}>{fmtP(pl)}</span></div></div>; })}
            </div>}

            {/* LOG */}
            <div style={PNL}><div style={GLW("#556")} /><div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 6 }}>거래 기록</div><div style={{ maxHeight: 80, overflow: "auto", fontSize: 10 }}>
              {eventLog.length === 0 ? <div style={{ color: "#334" }}>아직 거래 없음</div> : eventLog.slice().reverse().slice(0, 15).map(function(e, i) { var lc = e.type === "buy" ? "#0f6" : e.type === "sell" ? "#f33" : e.type === "ability" ? "#f0f" : "#667"; return <div key={i} style={{ padding: "2px 0", borderBottom: "1px solid #111a2d", color: lc }}><span style={{ color: "#334", marginRight: 4 }}>D{e.day}</span>{e.text}</div>; })}
            </div></div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: "1 1 400px", minWidth: 320 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {[{ k: "detail", l: "📊 종목 상세" }, { k: "players", l: "🤖 AI 트레이더" }].map(function(t) { return <button key={t.k} onClick={function() { setRightTab(t.k); }} style={{ background: rightTab === t.k ? "#0ff10" : "transparent", border: "1px solid " + (rightTab === t.k ? "#0ff" : "#222"), color: rightTab === t.k ? "#0ff" : "#556", padding: "5px 14px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: rightTab === t.k ? 700 : 400 }}>{t.l}</button>; })}
            </div>

            {/* STOCK DETAIL */}
            {rightTab === "detail" && <div style={{ ...PNL, marginBottom: 10 }}><div style={GLW(sc >= 0 ? "#0f6" : "#f33")} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
                <div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 16, fontWeight: 900, ...neon(sc >= 0 ? "#0f6" : "#f33") }}>{sel ? sel.id : ""}</span><span style={TAG(secC(sel ? sel.sector : ""))}>{sel ? sel.sector : ""}</span>{hasPump && <span style={TAG("#f0f")}>🎯 작전중</span>}</div><div style={{ fontSize: 10, color: "#556", marginTop: 1 }}>{sel ? sel.name : ""}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 900, color: sc >= 0 ? "#0f6" : "#f33" }}>${fmtD(sp)}</div><div style={{ fontSize: 11, color: sc >= 0 ? "#0f6" : "#f33" }}>{fmtP(sc)}</div></div>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, borderBottom: "1px solid #1a2a4a", paddingBottom: 6 }}>
                {[{ k: "chart", l: "📊 차트" }, { k: "info", l: "📋 정보" }, { k: "news", l: "📰 뉴스" }].map(function(t) { return <button key={t.k} onClick={function() { setInfoTab(t.k); }} style={{ background: infoTab === t.k ? "#0ff15" : "transparent", border: "1px solid " + (infoTab === t.k ? "#0ff" : "#222"), color: infoTab === t.k ? "#0ff" : "#556", padding: "3px 12px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: infoTab === t.k ? 700 : 400 }}>{t.l}</button>; })}
              </div>
              {infoTab === "chart" && <div><StockChart data={sh} /><VolumeChart volumes={svol} /><div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 9, color: "#556", flexWrap: "wrap" }}><span>시가 <span style={{ color: "#aab" }}>${fmtD(sdh.open)}</span></span><span>고가 <span style={{ color: "#f33" }}>${fmtD(sdh.high)}</span></span><span>저가 <span style={{ color: "#38f" }}>${fmtD(sdh.low)}</span></span><span>거래량 <span style={{ color: "#aab" }}>{fmtF(sVolLast)}</span></span></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>{[["시총", "$" + fmtN(sMcap), "#ff0"], ["PER", (sel ? sel.per : 0) + "x", "#aab"], ["변동성", (sel ? (sel.volatility * 100).toFixed(1) : 0) + "%", "#f5a"]].map(function(t, i) { return <div key={i} style={{ background: "#0a0e1780", padding: "5px 6px", borderRadius: 4, textAlign: "center" }}><div style={{ fontSize: 8, color: "#445" }}>{t[0]}</div><div style={{ fontSize: 12, fontWeight: 700, color: t[2] }}>{t[1]}</div></div>; })}</div></div>}
              {infoTab === "info" && <div><div style={{ fontSize: 10, color: "#667", lineHeight: 1.6, marginBottom: 10, padding: "6px 8px", background: "#0a0e1780", borderRadius: 4, borderLeft: "3px solid " + secC(sel ? sel.sector : "") }}>{sel ? sel.desc : ""}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>{[["시가총액", "$" + fmtN(sMcap), "#ff0"], ["PER", (sel ? sel.per : 0) + "x", "#aab"], ["발행주식", fmtN(sel ? sel.shares : 0), "#aab"], ["변동성", (sel ? (sel.volatility * 100).toFixed(1) : 0) + "%", "#f5a"], ["시즌 고가", "$" + fmtD(s52.high), "#f33"], ["시즌 저가", "$" + fmtD(s52.low), "#38f"], ["시즌 수익률", fmtP(sTotRet), sTotRet >= 0 ? "#0f6" : "#f33"], ["CEO", sel ? sel.ceo : "", "#aab"], ["설립", sel ? sel.founded + "년" : "", "#aab"], ["직원수", sel ? sel.employees + "명" : "", "#aab"]].map(function(t, i) { return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #111a2d", fontSize: 11 }}><span style={{ color: "#556" }}>{t[0]}</span><span style={{ color: t[2], fontWeight: 700 }}>{t[1]}</span></div>; })}</div>{held > 0 && <div style={{ marginTop: 10, padding: "6px 8px", background: "#ff008", border: "1px solid #ff030", borderRadius: 4 }}><div style={{ fontSize: 9, color: "#ff0", letterSpacing: 2, marginBottom: 3 }}>내 포지션</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>{[["수량", held + "주", "#ff0"], ["평단가", "$" + fmtD(sAvg), "#aab"], ["평가금", "$" + fmtD(sp * held), "#ff0"], ["손익률", fmtP((sp - sAvg) / sAvg), (sp - sAvg) >= 0 ? "#0f6" : "#f33"]].map(function(t, i) { return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #111a2d", fontSize: 11 }}><span style={{ color: "#556" }}>{t[0]}</span><span style={{ color: t[2], fontWeight: 700 }}>{t[1]}</span></div>; })}</div></div>}</div>}
              {infoTab === "news" && <div style={{ maxHeight: 220, overflow: "auto" }}>{sectorNews.length === 0 ? <div style={{ color: "#334", fontSize: 11 }}>뉴스 없음</div> : sectorNews.slice(0, 25).map(function(n, i) { return <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #111a2d", display: "flex", gap: 6, alignItems: "start" }}><span style={{ color: "#334", fontSize: 9, minWidth: 24 }}>D{n.day}</span><span style={{ ...TAG(n.sector ? secC(n.sector) : "#556"), fontSize: 8, padding: "1px 4px" }}>{n.sector || "매크로"}</span><span style={{ fontSize: 10, color: n.type === "good" ? "#0f6" : n.type === "bad" ? "#f33" : "#667", lineHeight: 1.4, flex: 1 }}>{n.type === "good" ? "▲ " : n.type === "bad" ? "▼ " : "● "}{n.text}</span></div>; })}</div>}
            </div>}

            {/* AI PLAYERS */}
            {rightTab === "players" && <div style={{ ...PNL, marginBottom: 10 }}><div style={GLW("#a8f")} /><div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 10 }}>🤖 AI 트레이더</div>
              {aiPlayers.map(function(ai) { var ap = (ai.totalAssets - INITIAL_CASH) / INITIAL_CASH, pos = Object.entries(ai.portfolio); return <div key={ai.id} style={{ marginBottom: 10, padding: 10, background: "#0a0e1780", borderRadius: 6, border: "1px solid " + ai.color + "30" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>{ai.avatar}</span><div><div style={{ fontSize: 13, fontWeight: 700, color: ai.color }}>{ai.name}</div><div style={{ fontSize: 9, color: "#556" }}>{ai.desc}</div></div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 900, color: ap >= 0 ? "#0f6" : "#f33" }}>{fmtP(ap)}</div><div style={{ fontSize: 10, color: "#556" }}>${fmtF(ai.totalAssets)}</div></div></div><div style={{ fontSize: 10, color: "#556", marginBottom: 4 }}>현금: <span style={{ color: "#0ff" }}>${fmtF(ai.cash)}</span></div>{pos.length > 0 ? <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{pos.map(function(e) { return <span key={e[0]} style={{ ...TAG(ai.color), fontSize: 9 }}>{e[0]} x{e[1]}</span>; })}</div> : <div style={{ fontSize: 9, color: "#334" }}>보유 종목 없음</div>}</div>; })}
            </div>}

            {/* ═══════ TRADE BUTTONS ═══════ */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button style={{ ...BTN("#0f6"), flex: 1, padding: 10, fontSize: 13, fontWeight: 700 }} onClick={function() { setTradeType("buy"); setShowTrade(true); setTradeAmount(1); setRightTab("detail"); }}>매수</button>
              <button style={{ ...BTN("#f33"), flex: 1, padding: 10, fontSize: 13, fontWeight: 700 }} onClick={function() { setTradeType("sell"); setShowTrade(true); setTradeAmount(1); setRightTab("detail"); }}>매도</button>
              <button style={{ ...BTN("#ff0"), flex: "0 0 auto", padding: "10px 18px", fontSize: 13, fontWeight: 700 }} onClick={nextDay}>▶ 다음 날</button>
            </div>

            {/* ═══════ IMPROVED TRADE PANEL ═══════ */}
            {showTrade && (function() {
              var isBuy = tradeType === "buy";
              var accent = isBuy ? "#0f6" : "#f33";
              var canExecute = isBuy ? (tradeCost <= cash && tradeAmount > 0) : (tradeAmount <= held && tradeAmount > 0);
              return (
                <div style={{ ...PNL, marginBottom: 10, border: "1px solid " + accent + "60" }}>
                  <div style={GLW(accent)} />
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: accent + "20", border: "1px solid " + accent + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: accent }}>{isBuy ? "B" : "S"}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: accent }}>{sel ? sel.id : ""} {isBuy ? "매수" : "매도"}</div>
                        <div style={{ fontSize: 10, color: "#556" }}>{sel ? sel.name : ""} · 현재가 ${fmtD(sp)}</div>
                      </div>
                    </div>
                    <button style={{ background: "none", border: "1px solid #333", color: "#556", cursor: "pointer", fontSize: 12, borderRadius: 4, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function() { setShowTrade(false); }}>✕</button>
                  </div>

                  {/* Quick presets */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                    {isBuy ? (
                      [["전액", 1], ["50%", 0.5], ["25%", 0.25], ["10%", 0.1]].map(function(pr) {
                        var q = Math.max(1, Math.floor(cash / sp * pr[1]));
                        return <button key={pr[0]} onClick={function() { setTradeAmount(q); }} style={{ ...BTN(accent), flex: 1, padding: "6px 4px", fontSize: 11, textAlign: "center" }}>{pr[0]}</button>;
                      })
                    ) : (
                      [["전량", 1], ["50%", 0.5], ["25%", 0.25], ["10%", 0.1]].map(function(pr) {
                        var q = Math.max(1, Math.floor(held * pr[1]));
                        return <button key={pr[0]} onClick={function() { setTradeAmount(q); }} style={{ ...BTN(accent), flex: 1, padding: "6px 4px", fontSize: 11, textAlign: "center" }}>{pr[0]}</button>;
                      })
                    )}
                  </div>

                  {/* Quantity input */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                    <button style={{ ...BTN("#556"), padding: "8px 10px", fontSize: 14, fontWeight: 700 }} onClick={function() { setTradeAmount(Math.max(1, tradeAmount - 10)); }}>-10</button>
                    <button style={{ ...BTN("#556"), padding: "8px 10px", fontSize: 14, fontWeight: 700 }} onClick={function() { setTradeAmount(Math.max(1, tradeAmount - 1)); }}>-</button>
                    <input type="number" value={tradeAmount} onChange={function(e) { setTradeAmount(Math.max(1, parseInt(e.target.value) || 1)); }} style={{ flex: 1, background: "#080c14", border: "2px solid " + accent + "50", color: accent, textAlign: "center", padding: "10px 8px", borderRadius: 6, fontFamily: "inherit", fontSize: 20, fontWeight: 900, outline: "none" }} />
                    <button style={{ ...BTN("#556"), padding: "8px 10px", fontSize: 14, fontWeight: 700 }} onClick={function() { setTradeAmount(tradeAmount + 1); }}>+</button>
                    <button style={{ ...BTN("#556"), padding: "8px 10px", fontSize: 14, fontWeight: 700 }} onClick={function() { setTradeAmount(tradeAmount + 10); }}>+10</button>
                  </div>

                  {/* Summary card */}
                  <div style={{ background: "#080c14", borderRadius: 6, padding: "10px 12px", marginBottom: 12, border: "1px solid #1a2a4a" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#556" }}>주문 금액</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#ff0" }}>${fmtF(tradeCost)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#445" }}>수량</span>
                      <span style={{ fontSize: 11, color: "#aab" }}>{tradeAmount}주 × ${fmtD(sp)}</span>
                    </div>
                    {isBuy && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#445" }}>현금 대비</span>
                      <span style={{ fontSize: 11, color: parseFloat(cashPct) > 80 ? "#f33" : "#aab" }}>{cashPct}%</span>
                    </div>}
                    {isBuy && <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#445" }}>최대 매수 가능</span>
                      <span style={{ fontSize: 11, color: "#0ff" }}>{maxBuy}주</span>
                    </div>}
                    {!isBuy && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#445" }}>보유량 대비</span>
                      <span style={{ fontSize: 11, color: "#aab" }}>{heldPct}% (보유 {held}주)</span>
                    </div>}
                    {!isBuy && held > 0 && sAvg > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#445" }}>예상 실현손익</span>
                      <span style={{ fontSize: 11, color: (sp - sAvg) >= 0 ? "#0f6" : "#f33", fontWeight: 700 }}>{(sp - sAvg) >= 0 ? "+" : ""}${fmtD((sp - sAvg) * tradeAmount)}</span>
                    </div>}
                  </div>

                  {/* Execute button */}
                  <button disabled={!canExecute} style={{ ...BTN(accent, !canExecute), width: "100%", padding: "12px", fontSize: 14, fontWeight: 900, letterSpacing: 1 }} onClick={function() { if (canExecute) executeTrade(tradeType, selectedStock, tradeAmount); }}>
                    {!canExecute ? (isBuy ? "자금 부족" : "수량 부족") : (isBuy ? "매수 확인 — $" + fmtF(tradeCost) : "매도 확인 — " + tradeAmount + "주")}
                  </button>
                </div>
              );
            })()}

            {/* ABILITIES */}
            {mode === "force" && <div style={{ ...PNL, marginBottom: 10 }}><div style={GLW("#f0f")} /><div style={{ fontSize: 9, color: "#556", letterSpacing: 2, marginBottom: 8 }}>🐋 세력 능력</div>
              {abilityMode && <div style={{ marginBottom: 8, padding: 6, background: "#f0f10", border: "1px solid #f0f40", borderRadius: 4, fontSize: 11 }}><span style={{ color: "#f0f" }}>{ABILITIES[abilityMode].icon} {ABILITIES[abilityMode].name}</span><span style={{ color: "#778" }}> → 대상 종목 선택</span><div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>{STOCKS.map(function(st) { return <button key={st.id} style={BTN("#f0f")} onClick={function() { useAb(abilityMode, st.id); }}>{st.id}</button>; })}<button style={BTN("#556")} onClick={function() { setAbilityMode(null); }}>취소</button></div></div>}
              {Object.entries(ABILITIES).map(function(e) { var k = e[0], ab = e[1], cd = abilities[k] ? abilities[k].cooldown : 0, can = cd === 0 && cash >= ab.cost; return <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, background: can ? "#f0f08" : "#111", border: "1px solid " + (can ? "#f0f30" : "#222"), opacity: can ? 1 : 0.5, marginBottom: 4 }}><span style={{ fontSize: 18 }}>{ab.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, color: can ? "#f0f" : "#556" }}>{ab.name}</div><div style={{ fontSize: 9, color: "#445" }}>{ab.desc}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: "#ff0" }}>${fmtN(ab.cost)}</div>{cd > 0 && <div style={{ fontSize: 9, color: "#f33" }}>CD:{cd}</div>}</div><button style={BTN("#f0f", !can)} disabled={!can} onClick={function() { if (can) setAbilityMode(k); }}>발동</button></div>; })}
            </div>}

            {/* PROGRESS */}
            <div style={{ marginTop: 6 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#445", marginBottom: 3 }}><span>시즌 진행도</span><span>{day}/{SEASON_DAYS}</span></div><div style={{ height: 4, background: "#111a2d", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: (day / SEASON_DAYS * 100) + "%", background: "linear-gradient(90deg, #0ff, #f0f)", borderRadius: 2, transition: "width 0.3s" }} /></div></div>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: #1a2a4a #0a0e17; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0e17; }
        ::-webkit-scrollbar-thumb { background: #1a2a4a; border-radius: 2px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}
