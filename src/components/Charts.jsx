import React from 'react';
import { fmtD } from '../utils/format';

export function MiniChart(props) {
  var d = props.data, w = props.width || 55, h = props.height || 22, c = props.color || '#0ff';
  if (!d || d.length < 2) return null;
  var mn = Math.min.apply(null, d), mx = Math.max.apply(null, d), r = mx - mn || 1;
  var pts = d.map(function(v, i) {
    return (i / (d.length - 1)) * w + ',' + (h - ((v - mn) / r) * (h - 4) - 2);
  }).join(' ');
  var gid = 'mc' + c.replace('#', '') + w;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={'0,' + h + ' ' + pts + ' ' + w + ',' + h} fill={'url(#' + gid + ')'} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.5" />
    </svg>
  );
}

export function StockChart(props) {
  var d = props.data, W = 560, H = 185;
  if (!d || d.length < 2) {
    return <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#556' }}>데이터 수집중...</div>;
  }
  var mn = Math.min.apply(null, d) * 0.98, mx = Math.max.apply(null, d) * 1.02, r = mx - mn || 1;
  var isUp = d[d.length - 1] >= d[0], c = isUp ? '#0f6' : '#f33';
  var pts = d.map(function(v, i) {
    return (40 + (i / (d.length - 1)) * (W - 60)) + ',' + (10 + (1 - (v - mn) / r) * (H - 30));
  }).join(' ');
  var grids = [];
  for (var i = 0; i <= 4; i++) {
    grids.push({ y: 10 + (i / 4) * (H - 30), val: mx - (i / 4) * r });
  }
  var lx = 40 + (W - 60), ly = 10 + (1 - (d[d.length - 1] - mn) / r) * (H - 30);
  return (
    <svg width="100%" viewBox={'0 0 ' + W + ' ' + H} style={{ display: 'block' }}>
      {grids.map(function(g, idx) {
        return (
          <g key={idx}>
            <line x1="40" y1={g.y} x2={W - 10} y2={g.y} stroke="#1a2a3a" strokeWidth="1" />
            <text x="36" y={g.y + 4} fill="#445" fontSize="9" textAnchor="end">{'$' + fmtD(g.val)}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="cfg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.15" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={'40,' + (H - 20) + ' ' + pts + ' ' + (W - 20) + ',' + (H - 20)} fill="url(#cfg)" />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="2" />
      <circle cx={lx} cy={ly} r="3" fill={c}>
        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function VolumeChart(props) {
  var v = props.volumes, W = 560, H = 30;
  if (!v || v.length < 2) return null;
  var mx = Math.max.apply(null, v) || 1, bw = Math.max(1, (W - 60) / v.length - 1);
  return (
    <svg width="100%" viewBox={'0 0 ' + W + ' ' + H} style={{ display: 'block' }}>
      {v.map(function(val, i) {
        var x = 40 + (i / v.length) * (W - 60);
        var h = (val / mx) * (H - 4);
        return <rect key={i} x={x} y={H - h - 2} width={bw} height={h} fill="#0ff30" rx="1" />;
      })}
    </svg>
  );
}
