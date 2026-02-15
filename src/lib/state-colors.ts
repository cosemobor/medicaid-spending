// Rotating palette of 12 visually distinct colors for state coding on scatter charts.
// States are assigned colors by spending rank (top states get most distinct colors).
const STATE_PALETTE = [
  '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5',
  '#0d9488', '#c026d3',
];

export function getStateColors(states: string[]): Record<string, string> {
  const colors: Record<string, string> = {};
  for (let i = 0; i < states.length; i++) {
    colors[states[i]] = STATE_PALETTE[i % STATE_PALETTE.length];
  }
  return colors;
}
