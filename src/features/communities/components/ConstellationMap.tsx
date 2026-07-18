const NODES: [number, number, number][] = [
  [60, 150, 168],
  [120, 70, 88],
  [200, 120, 138],
  [270, 60, 78],
  [320, 150, 168],
];

export interface ConstellationStar {
  id: string;
  initials: string;
}

export function ConstellationMap({
  name,
  tint,
  stars,
}: {
  name: string;
  tint: string;
  stars: ConstellationStar[];
}) {
  const shown = stars.slice(0, NODES.length);
  const points = shown.map((_, i) => NODES[i].slice(0, 2).join(",")).join(" ");

  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-secondary to-background">
      <svg viewBox="0 0 360 220" className="absolute inset-0 size-full">
        {shown.length > 1 && (
          <polyline points={points} fill="none" stroke={tint} strokeOpacity={0.6} strokeWidth={1.4} />
        )}
        {shown.map((star, i) => {
          const [cx, cy, ty] = NODES[i];
          return (
            <g key={star.id}>
              <circle cx={cx} cy={cy} r={12} fill={tint} opacity={0.4} />
              <circle cx={cx} cy={cy} r={5} fill="#fff" className="orbit-twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
              <text x={cx} y={ty} textAnchor="middle" fontSize={10} fill="#b6b9cc" className="font-sans">
                {star.initials}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="font-eyebrow absolute top-4 left-4 text-[11px]" style={{ color: tint }}>
        The {name} constellation
      </div>
    </div>
  );
}
