// Original sheep drawn for this project: fluffy scalloped head, navy outline,
// pale peach face, pink cheeks, small ears.

const PUFFS: [number, number][] = [
  [34, 0], [27.5, 20], [10.5, 32.3], [-10.5, 32.3], [-27.5, 20],
  [-34, 0], [-27.5, -20], [-10.5, -32.3], [10.5, -32.3], [27.5, -20],
];

export function SheepShape() {
  return (
    <g>
      <ellipse cx={-50} cy={2} rx={15} ry={8} transform="rotate(-18 -50 2)" fill="#FFFFFF" stroke="#5B6FA3" strokeWidth={2.5} />
      <ellipse cx={-52} cy={3} rx={8} ry={4} transform="rotate(-18 -52 3)" fill="#F9D9D0" />
      <ellipse cx={50} cy={2} rx={15} ry={8} transform="rotate(18 50 2)" fill="#FFFFFF" stroke="#5B6FA3" strokeWidth={2.5} />
      <ellipse cx={52} cy={3} rx={8} ry={4} transform="rotate(18 52 3)" fill="#F9D9D0" />
      <g fill="#5B6FA3" stroke="#5B6FA3" strokeWidth={5}>
        <circle cx={0} cy={0} r={35} />
        {PUFFS.map(([x, y]) => (
          <circle key={`o${x},${y}`} cx={x} cy={y} r={14} />
        ))}
      </g>
      <g fill="#FFFFFF">
        <circle cx={0} cy={0} r={35} />
        {PUFFS.map(([x, y]) => (
          <circle key={`w${x},${y}`} cx={x} cy={y} r={14} />
        ))}
      </g>
      <ellipse cx={0} cy={10} rx={29} ry={20} fill="#FDF0EA" />
      <circle cx={-11} cy={5} r={2.8} fill="#4A3B3B" />
      <circle cx={11} cy={5} r={2.8} fill="#4A3B3B" />
      <ellipse cx={-20} cy={14} rx={6.5} ry={4.5} fill="#F4B5A6" />
      <ellipse cx={20} cy={14} rx={6.5} ry={4.5} fill="#F4B5A6" />
      <path d="M-4.5 12 q2.25 3 4.5 0 q2.25 3 4.5 0" fill="none" stroke="#4A3B3B" strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

export function SheepIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="-68 -52 136 104" className={className} aria-hidden="true">
      <SheepShape />
    </svg>
  );
}
