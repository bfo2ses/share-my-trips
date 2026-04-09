const PALETTE = [
  '#4a9eff',
  '#ff6b35',
  '#2ecc71',
  '#9b59b6',
  '#e74c3c',
  '#f39c12',
  '#1abc9c',
  '#e91e63',
];

function hashId(id: string): number {
  return id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export function tripColor(id: string): string {
  return PALETTE[hashId(id) % PALETTE.length];
}
