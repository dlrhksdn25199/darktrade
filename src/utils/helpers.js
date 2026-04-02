export function genPrice(prev, vol, bias) {
  return Math.max(0.01, +(prev * (1 + (Math.random() - 0.48 + (bias || 0)) * vol)).toFixed(2));
}

export function uid() {
  return Math.random().toString(36).substr(2, 9);
}
