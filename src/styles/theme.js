// 가독성 우선: 네온 글로우를 아주 옅게만(색은 유지, 번짐 제거). 큰 제목만 은은하게.
export function neon(c) {
  return {
    color: c || '#0ff',
    textShadow: '0 0 1px ' + (c || '#0ff') + '55',
  };
}

export var panel = {
  background: 'linear-gradient(135deg, #0d1520 0%, #111a2d 100%)',
  border: '1px solid #1a2a4a',
  borderRadius: '8px',
  padding: '14px',
  position: 'relative',
  overflow: 'hidden',
};

export function glow(c) {
  return {
    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
    background: 'linear-gradient(90deg, transparent, ' + (c || '#0ff') + ', transparent)',
  };
}

export function btn(c, off) {
  return {
    background: off ? '#1a1a2e' : (c || '#0ff') + '15',
    border: '1px solid ' + (off ? '#333' : (c || '#0ff')),
    color: off ? '#555' : (c || '#0ff'),
    padding: '7px 16px',
    borderRadius: '4px',
    cursor: off ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    fontSize: '12px',
    transition: 'all 0.2s',
    textShadow: 'none',
  };
}

export function tag(c) {
  return {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: 'bold',
    background: (c || '#0ff') + '20',
    color: c || '#0ff',
    border: '1px solid ' + (c || '#0ff') + '40',
  };
}

export function secColor(s) {
  if (s === '반도체') return '#7bf';
  if (s === '기술') return '#0ff';
  if (s === '인터넷') return '#8f0';
  if (s === '자동차') return '#f80';
  return '#888';
}
